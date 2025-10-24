const httpStatus = require("http-status");
const mongoose = require("mongoose");
const {
  RmaRecord,
  Ticket,
  User,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
} = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat record RMA baru.
 * @param {Object} rmaBody - Data RMA (title, customerName, productName, ticketId?, dll).
 * @param {string} userId - ID User yang membuat.
 * @returns {Promise<RmaRecord>}
 */
const createRmaRecord = async (rmaBody, userId) => {
  if (!rmaBody.title || !rmaBody.customerName || !rmaBody.productName) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Title, Nama Pelanggan, dan Nama Produk wajib diisi."
    );
  }

  if (rmaBody.ticketId) {
    if (!mongoose.Types.ObjectId.isValid(rmaBody.ticketId)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `ID Tiket '${rmaBody.ticketId}' tidak valid.`
      );
    }
    const ticketExists = await Ticket.findById(rmaBody.ticketId);
    if (!ticketExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Tiket dengan ID ${rmaBody.ticketId} tidak ditemukan.`
      );
    }
    rmaBody.ticket = rmaBody.ticketId;
  }

  const rmaRecord = await RmaRecord.create(rmaBody);
  return rmaRecord;
};

/**
 * Mendapatkan daftar record RMA dengan filter dan populasi.
 * @param {Object} filter - Filter query Mongoose (misal { status: 'new' }).
 * @param {Object} options - Opsi query (limit, skip, sort).
 * @returns {Promise<{results: RmaRecord[], totalResults: number}>}
 */
const queryRmaRecords = async (filter, options = {}) => {
  const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;

  const queryFilter = { ...filter };
  if (filter.q && typeof filter.q === "string") {
    const searchQuery = filter.q.trim();
    const regex = new RegExp(searchQuery, "i");
    queryFilter.$or = [
      { code: regex },
      { customerName: regex },
      { productName: regex },
      { productSku: regex },
      { "warranty.serial": regex },
    ];
    delete queryFilter.q;
  }
  if (filter.status && !RMA_STATUSES.includes(filter.status)) {
    console.warn(`Ignoring invalid RMA status filter: ${filter.status}`);
    delete queryFilter.status;
  }

  const rmaRecords = await RmaRecord.find(queryFilter)
    .populate("ticket", "id code subject")
    .populate({
      path: "actions.by",
      select: "id name username",
    })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await RmaRecord.countDocuments(queryFilter);

  const results = rmaRecords.map((rma) => {
    rma.id = rma._id.toString();
    if (rma.ticket) {
      rma.ticketId = rma.ticket._id.toString();
      delete rma.ticket;
    } else {
      rma.ticketId = null;
    }
    if (Array.isArray(rma.actions)) {
      rma.actions = rma.actions.map((action) => {
        action.id = action._id.toString();
        if (action.by) {
          action.by = action.by._id.toString();
        }
        action.at = action.at?.toISOString();
        delete action._id;
        delete action.__v;
        return action;
      });
    }
    rma.createdAt = rma.createdAt?.toISOString();
    rma.updatedAt = rma.updatedAt?.toISOString();
    if (rma.warranty?.purchaseDate) {
      try {
        rma.warranty.purchaseDate = new Date(
          rma.warranty.purchaseDate
        ).toISOString();
      } catch (e) {
        rma.warranty.purchaseDate = null;
      }
    }

    delete rma._id;
    delete rma.__v;
    return rma;
  });

  return { results, totalResults };
};

/**
 * Mendapatkan satu record RMA berdasarkan ID dengan detail lengkap.
 * @param {string} id - ID RMA.
 * @returns {Promise<RmaRecord>}
 */
const getRmaRecordById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID RMA tidak valid.");
  }
  const rmaRecord = await RmaRecord.findById(id)
    .populate("ticket", "id code subject deviceInfo")
    .populate("actions.by", "id name username");

  if (!rmaRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "Record RMA tidak ditemukan.");
  }
  return rmaRecord;
};

/**
 * Menambahkan aksi baru ke record RMA dan update status.
 * @param {string} rmaId - ID RMA.
 * @param {Object} actionBody - Data aksi (type, note, payload?).
 * @param {string} userId - ID User yang melakukan aksi (dari req.user).
 * @returns {Promise<RmaRecord>}
 */
const addRmaAction = async (rmaId, actionBody, userId) => {
  const rmaRecord = await getRmaRecordById(rmaId);

  if (!actionBody.type || !RMA_ACTION_TYPES.includes(actionBody.type)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Tipe aksi tidak valid. Pilihan: ${RMA_ACTION_TYPES.join(", ")}`
    );
  }
  const actionByUser = await User.findById(userId);
  if (!actionByUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "User pelaku aksi tidak valid."
    );
  }

  let newStatus = rmaRecord.status;
  const actionType = actionBody.type;

  const transitions = {
    new: ["receive_unit", "cancel"],
    received: ["send_to_vendor", "cancel"],
    sent_to_vendor: ["vendor_update", "cancel"],
    in_vendor: ["replace", "repair", "reject", "cancel"],
    replaced: ["return_to_customer", "cancel"],
    repaired: ["return_to_customer", "cancel"],
    rejected: ["return_to_customer", "cancel"],
  };

  if (actionType === "receive_unit") newStatus = "received";
  if (actionType === "send_to_vendor") newStatus = "sent_to_vendor";
  if (actionType === "vendor_update") newStatus = "in_vendor";
  if (actionType === "replace") newStatus = "replaced";
  if (actionType === "repair") newStatus = "repaired";
  if (actionType === "return_to_customer") newStatus = "returned";
  if (actionType === "reject") newStatus = "rejected";
  if (actionType === "cancel") newStatus = "cancelled";

  const newAction = {
    type: actionBody.type,
    note: actionBody.note || "",
    payload: actionBody.payload,
    by: userId,
    at: new Date(),
  };

  rmaRecord.actions.push(newAction);
  rmaRecord.status = newStatus;

  await rmaRecord.save();

  const addedActionIndex = rmaRecord.actions.length - 1;
  if (addedActionIndex >= 0) {
    await rmaRecord.populate(
      `actions.${addedActionIndex}.by`,
      "id name username"
    );
  }

  return rmaRecord;
};

module.exports = {
  createRmaRecord,
  queryRmaRecords,
  getRmaRecordById,
  addRmaAction,
};
