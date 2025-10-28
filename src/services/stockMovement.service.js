const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { StockMovement, Part, User } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat record pergerakan stok baru DAN mengupdate stok Part terkait.
 * Dilakukan dalam transaksi database.
 * @param {Object} moveData - Data pergerakan (partId, type, quantity, reference, notes).
 * @param {string} userId - ID User yang melakukan aksi.
 * @returns {Promise<StockMovement>} Record StockMovement yang baru dibuat.
 * @throws {ApiError} Jika part tidak ditemukan, stok tidak cukup (untuk 'out'), atau transaksi gagal.
 */
const createStockMovement = async (moveData, userId) => {
  const { partId, type, quantity, reference, notes } = moveData;

  if (!partId || !type || !quantity || quantity < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Part ID, Type, dan Quantity (>=1) wajib diisi."
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "User tidak valid.");
  }

  const part = await Part.findById(partId);
  if (!part) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Part dengan ID ${partId} tidak ditemukan.`
    );
  }

  let stockChange = 0;
  if (type === "in") {
    stockChange = quantity;
  } else if (type === "out") {
    if (part.stock < quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Stok part '${part.name}' tidak cukup. Tersedia: ${part.stock}, Diminta: ${quantity}`
      );
    }
    stockChange = -quantity;
  } else if (type === "adjust") {
    const targetStock = Math.max(0, quantity);
    stockChange = targetStock - part.stock;
    moveData.quantity = targetStock;
    moveData.notes = `Adjust stok dari ${part.stock} menjadi ${targetStock}. ${
      notes || ""
    }`.trim();
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Tipe pergerakan '${type}' tidak valid.`
    );
  }

  const movementRecord = {
    part: part._id,
    partNameSnapshot: part.name,
    type,
    quantity: moveData.quantity,
    reference: reference || null,
    notes: moveData.notes || "",
    user: userId,
    at: new Date(),
  };

  const session = await mongoose.startSession();
  let createdMovement;
  try {
    await session.withTransaction(async () => {
      const updatedPart = await Part.findByIdAndUpdate(
        partId,
        type === "adjust"
          ? { $set: { stock: moveData.quantity } }
          : { $inc: { stock: stockChange } },
        { new: true, session }
      );

      if (!updatedPart) {
        throw new Error("Gagal mengupdate stok part.");
      }

      if (type === "adjust") {
        movementRecord.quantity = Math.abs(stockChange);
      } else {
        movementRecord.quantity = quantity;
      }

      const movements = await StockMovement.create([movementRecord], {
        session,
      });
      createdMovement = movements[0];

      if (!createdMovement) {
        throw new Error("Gagal membuat record pergerakan stok.");
      }
    });
  } catch (error) {
    console.error("Transaksi pergerakan stok gagal:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Gagal memproses pergerakan stok: ${error.message}`
    );
  } finally {
    session.endSession();
  }

  await createdMovement.populate("user", "name username");
  await createdMovement.populate("part", "name sku unit");

  return createdMovement;
};

/**
 * Mendapatkan semua stock movements dengan filter, sort, dan pagination.
 * @param {Object} filter - Filter query Mongoose.
 * @param {Object} options - Opsi query (limit, skip, sort).
 * @returns {Promise<{results: StockMovement[], totalResults: number}>}
 */
const queryStockMovements = async (filter, options = {}) => {
  const { limit = 20, skip = 0, sort = { at: -1 } } = options;

  const movements = await StockMovement.find(filter)
    .populate("user", "name username")
    .populate("part", "name sku unit")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await StockMovement.countDocuments(filter);

  const results = movements.map((m) => {
    return {
      id: m._id.toString(),
      at: m.at.toISOString(),
      partId: m.part?._id?.toString() || null,
      partName: m.partNameSnapshot,
      type: m.type,
      qty: m.quantity,
      ref: m.reference || null,
      note: m.notes || "",
      by: m.user?.name || m.user?.username || "N/A",
      partUnit: m.part?.unit || "-",
    };
  });

  return { results, totalResults };
};

module.exports = {
  createStockMovement,
  queryStockMovements,
};
