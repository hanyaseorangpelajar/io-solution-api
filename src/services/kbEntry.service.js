const httpStatus = require("http-status");
const { KBEntry, KBTag } = require("../models");
const { ApiError } = require("../utils");

/**
 * Mencari/Mengambil daftar Knowledge Base Entries.
 * (Use Case 7)
 */
const getKBEntries = async (filter) => {
  const { q } = filter;
  let query = {};

  if (q) {
    const searchQuery = { $regex: q, $options: "i" };
    query.$or = [
      { gejala: searchQuery },
      { modelPerangkat: searchQuery },
      { diagnosis: searchQuery },
      { solusi: searchQuery },
    ];
  }

  const entries = await KBEntry.find(query)
    .populate("dibuatOleh", "nama")
    .populate("sourceTicketId", "nomorTiket")
    .populate("tags", "nama")
    .sort({ dibuatPada: -1 });

  return {
    results: entries,
    totalResults: entries.length,
  };
};

/**
 * Mengambil satu KB Entry berdasarkan ID.
 */
const getKBEntryById = async (kbId) => {
  const entry = await KBEntry.findById(kbId)
    .populate("dibuatOleh", "nama")
    .populate("sourceTicketId", "nomorTiket customerId deviceId")
    .populate("tags", "nama");

  if (!entry) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Knowledge Base Entry tidak ditemukan"
    );
  }
  return entry;
};

/**
 * Mengupdate KB Entry (oleh Admin).
 * (Use Case 11)
 */
const updateKBEntry = async (kbId, updateBody) => {
  const entry = await getKBEntryById(kbId);

  if (updateBody.gejala) entry.gejala = updateBody.gejala;
  if (updateBody.modelPerangkat)
    entry.modelPerangkat = updateBody.modelPerangkat;
  if (updateBody.diagnosis) entry.diagnosis = updateBody.diagnosis;
  if (updateBody.solusi) entry.solusi = updateBody.solusi;
  if (Array.isArray(updateBody.tags)) {
    // Validasi tag ID yang ada saja
    const validTags = await KBTag.find({
      _id: { $in: updateBody.tags },
    }).select("_id");
    entry.tags = validTags.map((t) => t._id);
  }

  await entry.save();
  return entry;
};

/**
 * Menghapus KB Entry (oleh Admin).
 * (Use Case 11)
 */
const deleteKBEntry = async (kbId) => {
  const entry = await getKBEntryById(kbId);
  await entry.deleteOne();
  return entry;
};

module.exports = {
  getKBEntries,
  getKBEntryById,
  updateKBEntry,
  deleteKBEntry,
};
