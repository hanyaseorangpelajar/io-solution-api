const mongoose = require("mongoose");
const { AuditRecord } = require("../models");
const { ApiError } = require("../utils");

/**
 * Mendapatkan semua audit records dengan filter, sort, dan pagination.
 * @param {Object} filter - Filter query Mongoose.
 * @param {Object} options - Opsi query (limit, skip, sort).
 * @returns {Promise<{results: AuditRecord[], totalResults: number}>}
 */
const queryAuditRecords = async (filter, options = {}) => {
  const {
    limit = 10,
    skip = 0,
    sort = { reviewedAt: -1, createdAt: -1 },
  } = options;

  // Kita populate data 'reviewer' untuk mendapatkan nama
  const records = await AuditRecord.find(filter)
    .populate("reviewer", "name username") // Ambil nama reviewer
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean(); // Gunakan .lean() untuk performa read-only

  const totalResults = await AuditRecord.countDocuments(filter);

  // Transformasi data agar sesuai dengan apa yang diharapkan FE
  const results = records.map((rec) => {
    return {
      id: rec._id.toString(),
      at: (rec.reviewedAt || rec.createdAt).toISOString(), // Gunakan 'reviewedAt' sebagai 'at'
      who: rec.reviewer?.name || rec.reviewer?.username || "Sistem", // 'who' adalah reviewer
      ticketId: rec.ticket.toString(),
      ticketCode: rec.ticketCode, //
      action: rec.status, // 'action' adalah status audit (draft, approved, rejected)
      description: rec.notes || "Tidak ada catatan", // 'description' adalah notes
    };
  });

  return { results, totalResults };
};

module.exports = {
  queryAuditRecords,
};
