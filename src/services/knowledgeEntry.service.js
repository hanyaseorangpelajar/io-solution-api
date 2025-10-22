// src/services/knowledgeEntry.service.js
const { KnowledgeEntry, ServiceTicket } = require("../models");
const { ApiError } = require("../utils");
const httpStatus = require("http-status");

/**
 * Membuat entri basis pengetahuan baru secara manual.
 * @param {Object} entryBody - Data entri dari request body.
 * @returns {Promise<KnowledgeEntry>}
 */
const createKnowledgeEntry = async (entryBody) => {
  // Pastikan sourceTicket valid jika diberikan
  if (entryBody.sourceTicket) {
    const ticketExists = await ServiceTicket.findById(entryBody.sourceTicket);
    if (!ticketExists) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Tiket sumber tidak ditemukan."
      );
    }
  }
  return KnowledgeEntry.create(entryBody);
};

/**
 * Membuat draft entri basis pengetahuan dari tiket yang sudah selesai.
 * @param {string} ticketId - ID Tiket yang sudah 'Selesai'.
 * @returns {Promise<KnowledgeEntry>}
 */
const createKnowledgeEntryFromTicket = async (ticketId) => {
  const ticket = await ServiceTicket.findById(ticketId).populate(
    "actions.componentsUsed.component"
  );
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan.");
  }
  if (ticket.status !== "Selesai") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya tiket dengan status 'Selesai' yang dapat dijadikan basis pengetahuan."
    );
  }

  // Cek apakah sudah ada KB dari tiket ini
  const existingEntry = await KnowledgeEntry.findOne({
    sourceTicket: ticketId,
  });
  if (existingEntry) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Basis pengetahuan untuk tiket ini sudah ada (ID: ${existingEntry._id}).`
    );
  }

  // Gabungkan data dari tiket untuk membuat entri baru
  const diagnosisSummary = ticket.diagnostics
    .map((d) => d.diagnosis)
    .join("\n");
  const solutionSummary = ticket.actions.map((a) => a.actionTaken).join("\n");
  const relatedComponents = [
    ...new Set(
      ticket.actions.flatMap((a) =>
        a.componentsUsed.map((c) => c.component._id)
      )
    ),
  ];

  const newEntryData = {
    title: `Solusi untuk: ${ticket.deviceInfo} - ${ticket.initialComplaint}`,
    symptom: ticket.initialComplaint,
    diagnosis: diagnosisSummary || "Tidak ada diagnosis rinci.",
    solution: solutionSummary || "Tidak ada tindakan rinci.",
    relatedComponents,
    sourceTicket: ticket._id,
    isPublished: false, // Selalu jadi draft dulu
  };

  return KnowledgeEntry.create(newEntryData);
};

/**
 * Mendapatkan entri basis pengetahuan dengan filter.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<KnowledgeEntry[]>}
 */
const queryKnowledgeEntries = async (filter) => {
  return KnowledgeEntry.find(filter)
    .populate("relatedComponents", "name type")
    .populate("sourceTicket", "ticketNumber customerName")
    .sort({ createdAt: -1 });
};

/**
 * Mendapatkan satu entri basis pengetahuan berdasarkan ID.
 * @param {string} id - ID Entri.
 * @returns {Promise<KnowledgeEntry>}
 */
const getKnowledgeEntryById = async (id) => {
  const entry = await KnowledgeEntry.findById(id)
    .populate("relatedComponents", "name type price")
    .populate("sourceTicket");
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
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Entri ini sudah dipublikasikan."
    );
  }
  entry.isPublished = true;
  await entry.save();
  return entry;
};

module.exports = {
  createKnowledgeEntry,
  createKnowledgeEntryFromTicket,
  queryKnowledgeEntries,
  getKnowledgeEntryById,
  publishKnowledgeEntry,
};
