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

const mapRmaRecord = (rma) => {
  if (!rma) return null;
  const result = rma.toObject ? rma.toObject() : { ...rma };

  result.id = result._id ? result._id.toString() : null;

  if (result.ticket && result.ticket._id) {
    result.ticketId = result.ticket._id.toString();
    if (result.ticket.toObject || typeof result.ticket === "object") {
      const ticketObj = result.ticket.toObject
        ? result.ticket.toObject()
        : result.ticket;
      ticketObj.id = ticketObj._id ? ticketObj._id.toString() : null;
      result.ticket = ticketObj;
    }
  } else {
    result.ticketId = null;
  }

  if (Array.isArray(result.actions)) {
    result.actions = result.actions.map((action) => {
      action.id = action._id ? action._id.toString() : null;

      if (action.by && action.by._id) {
        if (action.by.toObject) {
          const userObj = action.by.toObject();
          userObj.id = userObj._id ? userObj._id.toString() : null;
          delete userObj._id;
          delete userObj.__v;
          action.by = userObj;
        } else {
          action.by.id = action.by._id ? action.by._id.toString() : null;
        }
      }

      if (action.at) {
        try {
          action.at = new Date(action.at).toISOString();
        } catch (e) {
          console.warn(
            `Gagal mengonversi action.at ke ISOString: ${action.at}`,
            e
          );
          action.at = null;
        }
      } else {
        action.at = null;
      }

      delete action._id;
      return action;
    });
  }
  if (result.createdAt) {
    try {
      result.createdAt = new Date(result.createdAt).toISOString();
    } catch (e) {
      console.warn(
        `Gagal mengonversi createdAt ke ISOString: ${result.createdAt}`,
        e
      );
      result.createdAt = null;
    }
  } else {
    result.createdAt = null;
  }

  if (result.updatedAt) {
    try {
      result.updatedAt = new Date(result.updatedAt).toISOString();
    } catch (e) {
      console.warn(
        `Gagal mengonversi updatedAt ke ISOString: ${result.updatedAt}`,
        e
      );
      result.updatedAt = null;
    }
  } else {
    result.updatedAt = null;
  }
  if (result.warranty?.purchaseDate) {
    try {
      result.warranty.purchaseDate = new Date(
        result.warranty.purchaseDate
      ).toISOString();
    } catch (e) {
      result.warranty.purchaseDate = null;
    }
  }

  delete result._id;
  delete result.__v;
  return result;
};

const createRmaRecord = async (rmaBody, userId) => {
  const rmaRecord = await RmaRecord.create(rmaBody);
  return mapRmaRecord(rmaRecord);
};

const queryRmaRecords = async (filter, options = {}) => {
  const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
  const queryFilter = { ...filter };

  const rmaRecords = await RmaRecord.find(queryFilter)
    .populate("ticket", "id code subject _id")
    .populate({
      path: "actions.by",
      select: "id name username _id",
    })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await RmaRecord.countDocuments(queryFilter);
  const results = rmaRecords.map(mapRmaRecord);
  return { results, totalResults };
};

const getRmaRecordById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID RMA tidak valid.");
  }
  const rmaRecord = await RmaRecord.findById(id)
    .populate("ticket", "id code subject deviceInfo _id")
    .populate("actions.by", "id name username _id");

  if (!rmaRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, "Record RMA tidak ditemukan.");
  }
  return mapRmaRecord(rmaRecord);
};

const addRmaAction = async (rmaId, actionBody, userId) => {
  const rmaRecordDoc = await RmaRecord.findById(rmaId);
  if (!rmaRecordDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Record RMA tidak ditemukan.");
  }

  const newAction = {
    type: actionBody.type,
    note: actionBody.note || "",
    payload: actionBody.payload,
    by: userId,
    at: new Date(),
  };

  rmaRecordDoc.actions.push(newAction);
  rmaRecordDoc.status = newStatus;

  await rmaRecordDoc.save();

  const updatedRma = await getRmaRecordById(rmaId);

  return updatedRma;
};

module.exports = {
  createRmaRecord,
  queryRmaRecords,
  getRmaRecordById,
  addRmaAction,
};
