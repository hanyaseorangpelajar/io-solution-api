const httpStatus = require("http-status");
const { KBEntry } = require("../models/kbEntry.model");
const { KBTag } = require("../models/kbTag.model");
const { ApiError } = require("../utils");
const { ServiceTicket } = require("../models/serviceTicket.model");

const checkAuthorization = async (entry, user) => {
  if (user.role === "Admin" || user.role === "SysAdmin") {
    return;
  }
  if (user.role === "Teknisi") {
    const ticket = await ServiceTicket.findById(entry.sourceTicketId).select(
      "teknisiId"
    );
    if (!ticket) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Tiket sumber untuk entri KB ini tidak ditemukan."
      );
    }
    if (ticket.teknisiId?.toString() !== user.id.toString()) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Akses ditolak. Anda hanya dapat mengelola entri KB dari tiket yang Anda tangani."
      );
    }
    return;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "Akses ditolak.");
};

const findOrCreateTags = async (tagNames) => {
  if (!Array.isArray(tagNames) || tagNames.length === 0) {
    return [];
  }
  const tagIds = [];
  const uniqueNormalizedTags = [
    ...new Set(
      tagNames
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    ),
  ];
  for (const tagName of uniqueNormalizedTags) {
    try {
      const tag = await KBTag.findOneAndUpdate(
        { nama: tagName },
        { $setOnInsert: { nama: tagName } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      tagIds.push(tag._id);
    } catch (error) {
      console.warn(`Gagal memproses tag '${tagName}': ${error.message}`);
    }
  }
  return tagIds;
};

/**
 * Mencari/Mengambil daftar Knowledge Base Entries.
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
    .populate("sourceTicketId", "_id nomorTiket teknisiId")
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
    .populate({
      path: "sourceTicketId",
      select: "nomorTiket customerId deviceId teknisiId",
      populate: [
        { path: "customerId", select: "nama" },
        { path: "deviceId", select: "model brand" },
        { path: "teknisiId", select: "nama" },
      ],
    })
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
 * Mengupdate KB Entry (oleh Admin atau Teknisi pemilik).
 */
const updateKBEntry = async (kbId, updateBody, user) => {
  const entry = await getKBEntryById(kbId);
  await checkAuthorization(entry, user);

  if (updateBody.gejala) entry.gejala = updateBody.gejala;
  if (updateBody.modelPerangkat)
    entry.modelPerangkat = updateBody.modelPerangkat;
  if (updateBody.diagnosis) entry.diagnosis = updateBody.diagnosis;
  if (updateBody.solusi) entry.solusi = updateBody.solusi;

  if (typeof updateBody.imageUrl === "string" || updateBody.imageUrl === null) {
    entry.imageUrl = updateBody.imageUrl;
  }

  if (Array.isArray(updateBody.tags)) {
    const tagObjectIds = await findOrCreateTags(updateBody.tags);
    entry.tags = tagObjectIds;
  }

  await entry.save();
  return getKBEntryById(kbId);
};

/**
 * Menghapus KB Entry (oleh Admin atau Teknisi pemilik).
 */
const deleteKBEntry = async (kbId, user) => {
  const entry = await getKBEntryById(kbId);
  await checkAuthorization(entry, user);
  await entry.deleteOne();
  return entry;
};

module.exports = {
  getKBEntries,
  getKBEntryById,
  updateKBEntry,
  deleteKBEntry,
};
