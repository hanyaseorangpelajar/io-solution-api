const httpStatus = require("http-status");
const mongoose = require("mongoose");
const {
  Ticket,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  User,
  ROLES,
  Part,
} = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat tiket baru.
 * @param {Object} ticketBody - Data tiket (subject, requester, priority, description, dll).
 * @param {string} createdById - ID User yang membuat (dari req.user).
 * @returns {Promise<Ticket>}
 */
const createTicket = async (ticketBody, createdById) => {
  const createdByUser = await User.findById(createdById);
  if (!createdByUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "User pembuat tidak valid."
    );
  }

  if (!ticketBody.subject || !ticketBody.requester) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Subject dan Requester wajib diisi."
    );
  }

  const dataToCreate = {
    ...ticketBody,
    createdBy: createdById,
    status: ticketBody.status || "open",
    priority: ticketBody.priority || "medium",
    requester: ticketBody.requester,
    subject: ticketBody.subject,
  };

  const ticket = await Ticket.create(dataToCreate);
  return ticket;
};

/**
 * Mendapatkan semua tiket dengan filter dan populasi.
 * @param {Object} filter - Filter query Mongoose (misal { status: 'open' }).
 * @param {Object} options - Opsi query (pagination, sort). Misal { limit, skip, sort }
 * @returns {Promise<{results: Ticket[], totalResults: number}>}
 */
const queryTickets = async (filter, options = {}) => {
  const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;

  let query = Ticket.find(filter)
    .populate("assignee", "id name username")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const tickets = await query.lean();
  const totalResults = await Ticket.countDocuments(filter);

  const results = tickets.map((ticket) => {
    ticket.id = ticket._id.toString();
    if (ticket.assignee) {
      ticket.assignee = ticket.assignee._id.toString();
    } else {
      ticket.assignee = null;
    }
    ticket.createdAt = ticket.createdAt?.toISOString();
    ticket.updatedAt = ticket.updatedAt?.toISOString();
    if (ticket.resolution && ticket.resolution.resolvedAt) {
      ticket.resolution.resolvedAt = ticket.resolution.resolvedAt.toISOString();
    }
    if (ticket.resolution && ticket.resolution.resolvedBy) {
      ticket.resolution.resolvedBy = ticket.resolution.resolvedBy.toString();
    }
    delete ticket._id;
    delete ticket.__v;
    delete ticket.createdBy;
    return ticket;
  });

  return { results, totalResults };
};

/**
 * Mendapatkan satu tiket berdasarkan ID dengan detail lengkap.
 * @param {string} id - ID Tiket.
 * @returns {Promise<Ticket>}
 */
const getTicketById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID Tiket tidak valid.");
  }
  const ticket = await Ticket.findById(id)
    .select(
      "+diagnostics +actions +resolution +deviceInfo +initialComplaint +finalResult +createdBy"
    )
    .populate("assignee", "id name username role")
    .populate("createdBy", "id name username role")
    .populate("actions.partsUsed.part", "id name category price")
    .populate("resolution.resolvedBy", "id name username");

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  return ticket;
};

/**
 * Mengalokasikan tiket ke teknisi.
 * @param {string} ticketId - ID Tiket.
 * @param {string} userId - ID User (Teknisi).
 * @returns {Promise<Ticket>}
 */
const assignTicket = async (ticketId, userId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  const technician = await User.findById(userId);
  if (!technician || !ROLES.includes(technician.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User tidak ditemukan atau role tidak valid untuk di-assign"
    );
  }

  ticket.assignee = technician._id;
  if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();
  await ticket.populate("assignee", "id name username");
  return ticket;
};

/**
 * Menambahkan hasil diagnosis baru ke history tiket.
 * @param {string} ticketId - ID Tiket.
 * @param {Object} diagnosisBody - Data diagnosis (symptom, diagnosis).
 * @param {string} userId - ID User yang melakukan diagnosis (dari req.user).
 * @returns {Promise<Ticket>}
 */
const addDiagnosis = async (ticketId, diagnosisBody, userId) => {
  const ticket = await Ticket.findById(ticketId).select("+diagnostics");
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  const newDiagnosis = {
    ...diagnosisBody,
    timestamp: new Date(),
  };

  ticket.diagnostics.push(newDiagnosis);
  if (ticket.status === "open") {
    ticket.status = "in_progress";
  }
  await ticket.save();
  return ticket;
};

/**
 * Menambahkan tindakan baru ke history tiket dan membuat record StockMovement.
 * @param {string} ticketId - ID Tiket.
 * @param {Object} actionBody - Data tindakan (actionTaken, partsUsed: [{ partId, quantity }]).
 * @param {string} userId - ID User yang melakukan aksi (dari req.user).
 * @returns {Promise<Ticket>}
 */
const addAction = async (ticketId, actionBody, userId) => {
  const ticket = await Ticket.findById(ticketId).select("+actions");
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  const partsUsedUpdates = [];
  const stockMovementsToCreate = [];
  const partsUsedForActionSchema = [];

  if (actionBody.partsUsed && actionBody.partsUsed.length > 0) {
    for (const item of actionBody.partsUsed) {
      if (!item.partId || !item.quantity || item.quantity < 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Data partsUsed tidak valid (partId dan quantity > 0 wajib)."
        );
      }
      const part = await Part.findById(item.partId);
      if (!part) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          `Part dengan ID ${item.partId} tidak ditemukan.`
        );
      }
      if (part.stock < item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Stok part '${part.name}' tidak cukup. Tersedia: ${part.stock}, Diminta: ${item.quantity}`
        );
      }

      partsUsedForActionSchema.push({
        part: part._id,
        quantity: item.quantity,
      });

      partsUsedUpdates.push({
        updateOne: {
          filter: { _id: part._id },
          update: { $inc: { stock: -item.quantity } },
        },
      });

      stockMovementsToCreate.push({
        part: part._id,
        partNameSnapshot: part.name,
        type: "out",
        quantity: item.quantity,
        reference: ticket.code,
        notes: `Digunakan untuk tiket ${ticket.code}: ${
          actionBody.actionTaken || ""
        }`,
        user: userId,
        at: new Date(),
      });
    }
  }

  const newAction = {
    actionTaken: actionBody.actionTaken,
    partsUsed: partsUsedForActionSchema,
    timestamp: new Date(),
  };

  const session = await mongoose.startSession();
  let savedTicket;
  try {
    await session.withTransaction(async () => {
      if (partsUsedUpdates.length > 0) {
        await Part.bulkWrite(partsUsedUpdates, { session });
      }
      if (stockMovementsToCreate.length > 0) {
        await StockMovement.insertMany(stockMovementsToCreate, { session });
      }
      ticket.actions.push(newAction);
      if (ticket.status === "open") {
        ticket.status = "in_progress";
      }
      savedTicket = await ticket.save({ session });
    });
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Gagal menambahkan aksi: ${error.message}`
    );
  } finally {
    session.endSession();
  }

  return savedTicket;
};

/**
 * Mengubah status tiket (tanpa resolve).
 * @param {string} ticketId - ID Tiket.
 * @param {string} newStatus - Status baru (harus valid TICKET_STATUSES).
 * @returns {Promise<Ticket>}
 */
const updateTicketStatus = async (ticketId, newStatus) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  if (!TICKET_STATUSES.includes(newStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status tidak valid. Pilihan: ${TICKET_STATUSES.join(", ")}`
    );
  }

  if (newStatus === "resolved") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Gunakan endpoint resolve untuk mengubah status ke 'resolved'."
    );
  }

  ticket.status = newStatus;
  await ticket.save();
  return ticket;
};

/**
 * Menyelesaikan tiket dan menyimpan data resolusi.
 * @param {string} ticketId - ID Tiket.
 * @param {Object} resolutionBody - Data resolusi (rootCause, solution, parts, photos, tags, extraCosts).
 * @param {string} resolvedById - ID User yang me-resolve (dari req.user).
 * @returns {Promise<Ticket>}
 */
const resolveTicket = async (ticketId, resolutionBody, resolvedById) => {
  const ticket = await Ticket.findById(ticketId).select("+resolution");
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  if (!["open", "in_progress"].includes(ticket.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Tiket dengan status '${ticket.status}' tidak dapat di-resolve.`
    );
  }
  if (!resolutionBody.rootCause || !resolutionBody.solution) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Root Cause dan Solution wajib diisi."
    );
  }

  const resolvedByUser = await User.findById(resolvedById);
  if (!resolvedByUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "User resolver tidak valid."
    );
  }

  const partsForResolution = [];
  if (resolutionBody.parts && resolutionBody.parts.length > 0) {
    for (const item of resolutionBody.parts) {
      if (!item.partId || !item.name || !item.qty || item.qty < 1) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Data parts di resolution tidak valid (partId, name, qty > 0 wajib)."
        );
      }

      partsForResolution.push({
        partId: item.partId,
        name: item.name,
        qty: item.qty,
      });
    }
  }

  const resolutionData = {
    rootCause: resolutionBody.rootCause,
    solution: resolutionBody.solution,
    parts: partsForResolution,
    photos: resolutionBody.photos || [],
    tags: resolutionBody.tags || [],
    extraCosts: resolutionBody.extraCosts || [],
    resolvedBy: resolvedById,
    resolvedAt: new Date(),
  };

  ticket.resolution = resolutionData;
  ticket.status = "resolved";

  await ticket.save();

  await ticket.populate("resolution.resolvedBy", "id name username");

  return ticket;
};

module.exports = {
  createTicket,
  queryTickets,
  getTicketById,
  assignTicket,
  addDiagnosis,
  addAction,
  updateTicketStatus,
  resolveTicket,
};
