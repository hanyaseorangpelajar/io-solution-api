const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { KnowledgeEntry, Ticket, Part } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat entri basis pengetahuan baru secara manual.
 * @param {Object} entryBody - Data entri (title, symptom, diagnosis, solution, sourceTicketId, relatedComponentIds?, tags?).
 * @returns {Promise<KnowledgeEntry>}
 */
const createKnowledgeEntry = async (entryBody) => {
  if (
    !entryBody.sourceTicketId ||
    !mongoose.Types.ObjectId.isValid(entryBody.sourceTicketId)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "ID Tiket Sumber (sourceTicketId) tidak valid."
    );
  }
  const ticketExists = await Ticket.findById(entryBody.sourceTicketId);
  if (!ticketExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Tiket sumber tidak ditemukan.");
  }

  const dataToCreate = {
    title: entryBody.title,
    symptom: entryBody.symptom,
    diagnosis: entryBody.diagnosis,
    solution: entryBody.solution,
    sourceTicket: entryBody.sourceTicketId,
    relatedComponents: entryBody.relatedComponentIds || [],
    tags: entryBody.tags || [],
    isPublished: entryBody.isPublished || false,
  };

  if (
    !dataToCreate.title ||
    !dataToCreate.symptom ||
    !dataToCreate.diagnosis ||
    !dataToCreate.solution
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Title, Symptom, Diagnosis, dan Solution wajib diisi."
    );
  }

  return KnowledgeEntry.create(dataToCreate);
};

/**
 * Membuat draft entri basis pengetahuan dari tiket yang sudah di-resolve.
 * @param {string} ticketId - ID Tiket yang sudah 'resolved'.
 * @returns {Promise<KnowledgeEntry>}
 */
const createKnowledgeEntryFromTicket = async (ticketId) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID Tiket tidak valid.");
  }
  const ticket = await Ticket.findById(ticketId)
    .select("+resolution")
    .populate("resolution.resolvedBy", "id name");

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan.");
  }
  if (ticket.status !== "resolved" || !ticket.resolution) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya tiket dengan status 'resolved' dan memiliki data resolusi yang dapat dijadikan basis pengetahuan."
    );
  }

  const existingEntry = await KnowledgeEntry.findOne({
    sourceTicket: ticketId,
  });
  if (existingEntry) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Basis pengetahuan untuk tiket ${ticket.code} sudah ada (ID: ${existingEntry._id}).`
    );
  }

  const { rootCause, solution, parts, tags } = ticket.resolution;

  const relatedComponentIds = parts.map((p) => p.partId);

  const newEntryData = {
    title: `Solusi: ${
      ticket.subject || ticket.initialComplaint || `Tiket ${ticket.code}`
    }`,
    symptom: ticket.initialComplaint || ticket.subject || rootCause,
    diagnosis: rootCause,
    solution: solution,
    relatedComponents: relatedComponentIds,
    sourceTicket: ticket._id,
    tags: tags || [],
    isPublished: false,
  };

  return KnowledgeEntry.create(newEntryData);
};

/**
 * Mendapatkan entri basis pengetahuan dengan filter dan populasi.
 * @param {Object} filter - Filter query Mongoose (misal { isPublished: true, tags: 'network' }).
 * @param {Object} options - Opsi query (limit, skip, sort).
 * @returns {Promise<{results: KnowledgeEntry[], totalResults: number}>}
 */
const queryKnowledgeEntries = async (filter, options = {}) => {
  const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;

  const queryFilter = { ...filter };
  if (filter.tags && typeof filter.tags === "string") {
    queryFilter.tags = {
      $in: filter.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
    };
  }
  if (filter.q && typeof filter.q === "string") {
    const searchQuery = filter.q.trim();
    const regex = new RegExp(searchQuery, "i");
    queryFilter.$or = [
      { title: regex },
      { symptom: regex },
      { diagnosis: regex },
      { solution: regex },
      { tags: regex },
    ];
    delete queryFilter.q;
  }

  const entries = await KnowledgeEntry.find(queryFilter)
    .populate("relatedComponents", "id name category price")
    .populate("sourceTicket", "id code subject requester")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await KnowledgeEntry.countDocuments(queryFilter);

  const results = entries.map((entry) => {
    entry.id = entry._id.toString();
    if (entry.sourceTicket) {
      entry.sourceTicket.id = entry.sourceTicket._id.toString();
      delete entry.sourceTicket._id;
    }
    if (Array.isArray(entry.relatedComponents)) {
      entry.relatedComponents = entry.relatedComponents.map((comp) => {
        if (comp) {
          comp.id = comp._id.toString();
          delete comp._id;
        }
        return comp;
      });
      entry.relatedComponentIds = entry.relatedComponents
        .map((comp) => comp?.id)
        .filter((id) => id);
    } else {
      entry.relatedComponentIds = [];
    }
    entry.createdAt = entry.createdAt?.toISOString();
    entry.updatedAt = entry.updatedAt?.toISOString();
    delete entry._id;
    delete entry.__v;
    delete entry.sourceTicket;
    delete entry.relatedComponents;
    return entry;
  });

  return { results, totalResults };
};

/**
 * Mendapatkan satu entri basis pengetahuan berdasarkan ID.
 * @param {string} id - ID Entri.
 * @returns {Promise<KnowledgeEntry>}
 */
const getKnowledgeEntryById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "ID Entri Knowledge Base tidak valid."
    );
  }
  const entry = await KnowledgeEntry.findById(id)
    .populate("relatedComponents", "id name category price")
    .populate("sourceTicket", "id code subject requester status");

  if (!entry) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Entri basis pengetahuan tidak ditemukan."
    );
  }
  return entry;
};

/**
 * Mempublikasikan sebuah entri basis pengetahuan.
 * @param {string} entryId - ID Entri.
 * @returns {Promise<KnowledgeEntry>}
 */
const publishKnowledgeEntry = async (entryId) => {
  const entry = await getKnowledgeEntryById(entryId);

  if (entry.isPublished) {
    console.log(`Knowledge Entry ${entryId} is already published.`);
    return entry;
  }
  entry.isPublished = true;
  await entry.save();
  return entry;
};

/**
 * Mengubah status publikasi entri KB menjadi false (draft).
 * @param {string} entryId - ID Entri.
 * @returns {Promise<KnowledgeEntry>}
 */
const unpublishKnowledgeEntry = async (entryId) => {
  const entry = await getKnowledgeEntryById(entryId);
  if (!entry.isPublished) {
    console.log(`Knowledge Entry ${entryId} is already unpublished (draft).`);
    return entry;
  }
  entry.isPublished = false;
  await entry.save();
  return entry;
};

/**
 * Memperbarui entri basis pengetahuan berdasarkan ID.
 * @param {string} entryId - ID Entri.
 * @param {Object} updateBody - Data untuk pembaruan.
 * @returns {Promise<KnowledgeEntry>}
 */
const updateKnowledgeEntryById = async (entryId, updateBody) => {
  const entry = await getKnowledgeEntryById(entryId);

  const allowedUpdates = [
    "title",
    "symptom",
    "diagnosis",
    "solution",
    "relatedComponentIds",
    "tags",
    "isPublished",
  ];
  const filteredUpdateBody = {};

  Object.keys(updateBody).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      if (key === "relatedComponentIds") {
        filteredUpdateBody["relatedComponents"] = updateBody[key] || [];
      } else {
        filteredUpdateBody[key] = updateBody[key];
      }
    }
  });

  if (filteredUpdateBody.title === "")
    throw new ApiError(httpStatus.BAD_REQUEST, "Title tidak boleh kosong.");

  delete filteredUpdateBody.sourceTicket;

  Object.assign(entry, filteredUpdateBody);
  await entry.save();
  return entry;
};

/**
 * Menghapus entri basis pengetahuan berdasarkan ID.
 * @param {string} entryId - ID Entri.
 * @returns {Promise<void>}
 */
const deleteKnowledgeEntryById = async (entryId) => {
  const entry = await getKnowledgeEntryById(entryId);
  await entry.deleteOne();
};

module.exports = {
  createKnowledgeEntry,
  createKnowledgeEntryFromTicket,
  queryKnowledgeEntries,
  getKnowledgeEntryById,
  publishKnowledgeEntry,
  unpublishKnowledgeEntry,
  updateKnowledgeEntryById,
  deleteKnowledgeEntryById,
};
