const httpStatus = require("http-status");
const {
  RmaRecord,
  ServiceTicket,
  User,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
} = require("../models");
const { ApiError } = require("../utils");
const mongoose = require("mongoose");

/**
 * Membuat record RMA baru.
 * @param {Object} rmaBody - Data RMA dari request body.
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
    const ticketExists = await ServiceTicket.findById(rmaBody.ticketId);
    if (!ticketExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Tiket dengan ID ${rmaBody.ticketId} tidak ditemukan.`
      );
    }
    rmaBody.ticket = rmaBody.ticketId;
  }

  rmaBody.reviewer = userId;

  const rmaRecord = await RmaRecord.create(rmaBody);
  return rmaRecord;
};

/**
 * Mendapatkan daftar record RMA dengan filter dan populasi.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<RmaRecord[]>}
 */
const queryRmaRecords = async (filter) => {
  const rmaRecords = await RmaRecord.find(filter)
    .populate("reviewer", "id name username role")
    .populate("ticket", "id ticketNumber deviceInfo")
    .populate("actions.by", "id name username")
    .sort({ createdAt: -1 });
  return rmaRecords;
};

/**
 * Mendapatkan satu record RMA berdasarkan ID.
 * @param {string} id - ID RMA.
 * @returns {Promise<RmaRecord>}
 */
const getRmaRecordById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID RMA tidak valid.");
  }
  const rmaRecord = await RmaRecord.findById(id)
    .populate("reviewer", "id name username role")
    .populate("ticket", "id ticketNumber deviceInfo")
    .populate("actions.by", "id name username");

  if (!rmaRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "Record RMA tidak ditemukan.");
  }
  return rmaRecord;
};

/**
 * Menambahkan aksi baru ke record RMA dan update status.
 * @param {string} rmaId - ID RMA.
 * @param {Object} actionBody - Data aksi (type, note, payload).
 * @param {string} userId - ID User yang melakukan aksi.
 * @returns {Promise<RmaRecord>}
 */
const addRmaAction = async (rmaId, actionBody, userId) => {
  if (!mongoose.Types.ObjectId.isValid(rmaId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID RMA tidak valid.");
  }
  if (!actionBody.type || !RMA_ACTION_TYPES.includes(actionBody.type)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Tipe aksi tidak valid. Pilihan: ${RMA_ACTION_TYPES.join(", ")}`
    );
  }

  const rmaRecord = await RmaRecord.findById(rmaId);
  if (!rmaRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "Record RMA tidak ditemukan.");
  }

  let newStatus = rmaRecord.status;
  const actionType = actionBody.type;

  if (actionType === "receive_unit" && rmaRecord.status === "new")
    newStatus = "received";
  if (actionType === "send_to_vendor" && rmaRecord.status === "received")
    newStatus = "sent_to_vendor";
  if (actionType === "vendor_update" && rmaRecord.status === "sent_to_vendor")
    newStatus = "in_vendor";
  if (actionType === "replace" && rmaRecord.status === "in_vendor")
    newStatus = "replaced";
  if (actionType === "repair" && rmaRecord.status === "in_vendor")
    newStatus = "repaired";
  if (
    actionType === "return_to_customer" &&
    ["replaced", "repaired", "rejected"].includes(rmaRecord.status)
  )
    newStatus = "returned";
  if (actionType === "reject" && rmaRecord.status === "in_vendor")
    newStatus = "rejected";
  if (actionType === "cancel") newStatus = "cancelled";

  const newAction = {
    type: actionBody.type,
    note: actionBody.note,
    payload: actionBody.payload,
    by: userId,
    at: new Date(),
  };

  rmaRecord.actions.push(newAction);
  rmaRecord.status = newStatus;

  await rmaRecord.save();

  await rmaRecord.populate("actions.by", "id name username");

  return rmaRecord;
};

module.exports = {
  createRmaRecord,
  queryRmaRecords,
  getRmaRecordById,
  addRmaAction,
};
