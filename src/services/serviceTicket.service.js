// src/services/serviceTicket.service.js
const {
  ServiceTicket,
  TICKET_STATUSES,
} = require("../models/serviceTicket.model");
const { User, ROLES } = require("../models/user.model");
const { Component } = require("../models/component.model");
const { ApiError } = require("../utils/ApiError");
const httpStatus = require("http-status");
const mongoose = require("mongoose");

/**
 * Membuat tiket layanan baru.
 * @param {Object} ticketBody - Data tiket dari request body.
 * @returns {Promise<ServiceTicket>}
 */
const createServiceTicket = async (ticketBody) => {
  // Pastikan createdBy adalah user yang valid (misal: Admin)
  const createdByUser = await User.findById(ticketBody.createdBy);
  if (!createdByUser) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User pembuat (createdBy) tidak ditemukan."
    );
  }
  // Di masa depan, bisa ditambahkan validasi role createdBy (misal: hanya Admin yang bisa membuat)

  return ServiceTicket.create(ticketBody);
};

/**
 * Mendapatkan semua tiket layanan dengan filter.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<ServiceTicket[]>}
 */
const queryServiceTickets = async (filter) => {
  const tickets = await ServiceTicket.find(filter)
    .populate("assignedTo", "username fullName role") // Hanya ambil field tertentu dari User
    .populate("createdBy", "username fullName role")
    .sort({ createdAt: -1 }); // Urutkan dari yang terbaru
  return tickets;
};

/**
 * Mendapatkan satu tiket layanan berdasarkan ID.
 * @param {string} id - ID Tiket.
 * @returns {Promise<ServiceTicket>}
 */
const getServiceTicketById = async (id) => {
  const ticket = await ServiceTicket.findById(id)
    .populate("assignedTo", "username fullName role")
    .populate("createdBy", "username fullName role")
    .populate("actions.componentsUsed.component", "name type price"); // Populate komponen yang digunakan
  return ticket;
};

/**
 * Mengalokasikan tiket ke teknisi.
 * @param {string} ticketId - ID Tiket.
 * @param {string} userId - ID User (Teknisi).
 * @returns {Promise<ServiceTicket>}
 */
const assignTicket = async (ticketId, userId) => {
  const ticket = await getServiceTicketById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  const technician = await User.findById(userId);
  if (!technician || technician.role !== ROLES[0]) {
    // ROLES[0] adalah 'Teknisi'
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User tidak ditemukan atau bukan Teknisi"
    );
  }

  ticket.assignedTo = technician._id;
  ticket.status = "Dialokasikan"; // Otomatis ubah status
  await ticket.save();
  return ticket;
};

/**
 * Menambahkan hasil diagnosis baru ke tiket.
 * @param {string} ticketId - ID Tiket.
 * @param {Object} diagnosisBody - Data diagnosis (symptom, diagnosis).
 * @returns {Promise<ServiceTicket>}
 */
const addDiagnosis = async (ticketId, diagnosisBody) => {
  const ticket = await getServiceTicketById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  ticket.diagnostics.push(diagnosisBody);
  await ticket.save();
  return ticket;
};

/**
 * Menambahkan tindakan baru ke tiket dan mengurangi stok komponen.
 * @param {string} ticketId - ID Tiket.
 * @param {Object} actionBody - Data tindakan (actionTaken, componentsUsed).
 * @returns {Promise<ServiceTicket>}
 */
const addAction = async (ticketId, actionBody) => {
  const ticket = await getServiceTicketById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }

  // --- Validasi dan Kurangi Stok Komponen ---
  // Ini adalah operasi yang idealnya dilakukan dalam transaksi untuk memastikan atomicity.
  // Jika Anda menggunakan MongoDB replica set, pertimbangkan untuk menggunakan `session`
  // untuk transaksi multi-dokumen. Untuk kesederhanaan, kita akan melakukan ini secara berurutan.

  for (const item of actionBody.componentsUsed) {
    const component = await Component.findById(item.component);
    if (!component) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Komponen dengan ID ${item.component} tidak ditemukan.`
      );
    }
    if (component.stock < item.quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Stok komponen '${component.name}' tidak cukup. Tersedia: ${component.stock}, Diminta: ${item.quantity}`
      );
    }
    // Kurangi stok
    component.stock -= item.quantity;
    await component.save();
  }

  ticket.actions.push(actionBody);
  await ticket.save();
  return ticket;
};

/**
 * Mengubah status tiket.
 * @param {string} ticketId - ID Tiket.
 * @param {string} newStatus - Status baru.
 * @returns {Promise<ServiceTicket>}
 */
const updateTicketStatus = async (ticketId, newStatus) => {
  const ticket = await getServiceTicketById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  if (!TICKET_STATUSES.includes(newStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status tidak valid. Pilihan: ${TICKET_STATUSES.join(", ")}`
    );
  }

  ticket.status = newStatus;
  await ticket.save();
  return ticket;
};

module.exports = {
  createServiceTicket,
  queryServiceTickets,
  getServiceTicketById,
  assignTicket,
  addDiagnosis,
  addAction,
  updateTicketStatus,
};
