const httpStatus = require("http-status");
const {
  ServiceTicket,
  TICKET_STATUSES,
} = require("../models/serviceTicket.model");
const { Customer } = require("../models/customer.model");
const { Device } = require("../models/device.model");
const { KBEntry } = require("../models/kbEntry.model");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils");

/**
 * Membuat tiket servis baru (alur kerja ternormalisasi).
 * @param {Object} ticketBody - Data dari controller
 * @param {string} createdById - ID User yang membuat (Teknisi/Admin)
 * @returns {Promise<ServiceTicket>}
 */
const createServiceTicket = async (ticketBody, createdById) => {
  const { customer, device, keluhanAwal } = ticketBody;

  if (!customer || !customer.nama || !customer.noHp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Data 'customer' (nama dan noHp) wajib diisi."
    );
  }
  if (!device || !device.model) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Data 'device' (model) wajib diisi."
    );
  }
  if (!keluhanAwal) {
    throw new ApiError(httpStatus.BAD_REQUEST, "'keluhanAwal' wajib diisi.");
  }

  let customerDoc = await Customer.findOneAndUpdate(
    { noHp: customer.noHp },
    { $set: { nama: customer.nama, ...customer } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let deviceDoc;
  if (device.serialNumber) {
    deviceDoc = await Device.findOne({
      serialNumber: device.serialNumber,
      customerId: customerDoc._id,
    });
  } else {
    deviceDoc = await Device.findOne({
      model: device.model,
      brand: device.brand,
      customerId: customerDoc._id,
    });
  }

  if (!deviceDoc) {
    deviceDoc = await Device.create({
      ...device,
      customerId: customerDoc._id,
    });
  }

  const serviceTicket = await ServiceTicket.create({
    customerId: customerDoc._id,
    deviceId: deviceDoc._id,
    keluhanAwal,
    status: "Diagnosis",
    tanggalMasuk: new Date(),
  });

  return serviceTicket.populate([
    { path: "customerId", select: "nama noHp" },
    { path: "deviceId", select: "brand model serialNumber" },
  ]);
};

/**
 * Mengambil daftar semua tiket servis.
 */
const getServiceTickets = async (filter) => {
  const safe = {};
  if (filter?.status) safe.status = filter.status;
  if (filter?.teknisiId) safe.teknisiId = filter.teknisiId;
  if (filter?.customerId) safe.customerId = filter.customerId;
  if (filter?.q) {
    safe.$or = [
      { nomorTiket: { $regex: filter.q, $options: "i" } },
      { keluhanAwal: { $regex: filter.q, $options: "i" } },
    ];
  }
  const page = Math.max(1, parseInt(filter?.page ?? 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(filter?.limit ?? 20, 10)));
  const skip = (page - 1) * limit;

  const [tickets, totalResults] = await Promise.all([
    ServiceTicket.find(safe)
      .populate("customerId", "nama noHp")
      .populate("deviceId", "brand model serialNumber")
      .populate("teknisiId", "nama")
      .sort({ tanggalMasuk: -1 })
      .skip(skip)
      .limit(limit),
    ServiceTicket.countDocuments(safe),
  ]);
  return { results: tickets, totalResults, page, limit };
};

/**
 * Mengambil satu tiket servis berdasarkan ID.
 */
const getServiceTicketById = async (ticketId) => {
  const ticket = await ServiceTicket.findById(ticketId)
    .populate("customerId")
    .populate("deviceId")
    .populate("teknisiId", "nama role");

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket Servis tidak ditemukan");
  }
  return ticket;
};

/**
 * Menugaskan tiket ke seorang teknisi.
 */
const assignServiceTicket = async (ticketId, teknisiId, adminId) => {
  const ticket = await getServiceTicketById(ticketId);
  const teknisi = await User.findById(teknisiId);

  if (!teknisi || teknisi.role !== "Teknisi") {
    throw new ApiError(httpStatus.NOT_FOUND, "User Teknisi tidak ditemukan.");
  }
  if (ticket.status !== "Diagnosis") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya tiket berstatus 'Diagnosis' yang bisa ditugaskan."
    );
  }

  ticket.teknisiId = teknisi._id;
  ticket.status = "DalamProses";

  ticket.statusHistory.push({
    statusBaru: "DalamProses",
    catatan: `Ditugaskan ke ${teknisi.nama} oleh Admin (ID: ${adminId}).`,
  });

  await ticket.save();
  return ticket;
};

/**
 * Memperbarui status tiket (oleh Teknisi).
 * Ini adalah fungsi inti untuk mencatat progres.
 */
const updateServiceTicketStatus = async (ticketId, statusUpdateBody, user) => {
  const { status, catatan } = statusUpdateBody;
  if (!status || !TICKET_STATUSES.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status baru tidak valid.");
  }

  const ticket = await getServiceTicketById(ticketId);

  if (ticket.status === "Selesai" || ticket.status === "Dibatalkan") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tiket sudah final (Selesai/Dibatalkan) dan tidak bisa diubah."
    );
  }

  if (ticket.status === status) {
    return ticket;
  }

  const allowed = {
    Diagnosis: ["DalamProses", "Dibatalkan", "Selesai", "MenungguSparepart"],
    DalamProses: ["MenungguSparepart", "Selesai", "Dibatalkan"],
    MenungguSparepart: ["DalamProses", "Selesai", "Dibatalkan"],
  };
  const nexts = allowed[ticket.status] || [];
  if (!nexts.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Transisi dari '${ticket.status}' ke '${status}' tidak diperbolehkan.`
    );
  }

  if (ticket.status === status) {
    return ticket;
  }

  ticket.status = status;
  ticket.statusHistory.push({
    statusBaru: status,
    catatan: catatan || `Status diubah oleh Teknisi (ID: ${userId}).`,
  });

  if (status === "Selesai" || status === "Dibatalkan") {
    ticket.tanggalSelesai = new Date();
  }

  await ticket.save();
  return ticket;
};

/**
 * Menambah item/komponen pengganti ke tiket.
 */
const addReplacementItem = async (ticketId, itemBody) => {
  const { namaKomponen, qty, keterangan } = itemBody;
  if (!namaKomponen || !qty || qty < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Nama Komponen dan Kuantitas (qty) wajib diisi."
    );
  }

  const ticket = await getServiceTicketById(ticketId);
  if (ticket.status === "Selesai" || ticket.status === "Dibatalkan") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tiket sudah final, tidak bisa menambah item."
    );
  }

  ticket.replacementItems.push({
    namaKomponen,
    qty,
    keterangan: keterangan || "",
  });

  await ticket.save();
  return ticket;
};

/**
 * Menyelesaikan tiket DAN membuat Knowledge Base Entry.
 * Ini adalah 'Use Case 6' dari skripsi Anda.
 */
const completeTicketAndCreateKB = async (ticketId, kbBody, userId) => {
  const { diagnosis, solusi } = kbBody;
  if (!diagnosis || !solusi) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Diagnosis dan Solusi wajib diisi untuk membuat Knowledge Base."
    );
  }

  const ticket = await getServiceTicketById(ticketId);
  if (ticket.status === "Selesai") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tiket ini sudah dibuatkan Knowledge Base Entry."
    );
  }

  const gejala = ticket.keluhanAwal;
  const modelPerangkat = `${ticket.deviceId.brand || ""} ${
    ticket.deviceId.model || ""
  }`.trim();

  const kbEntry = await KBEntry.create({
    gejala,
    modelPerangkat,
    diagnosis,
    solusi,
    sourceTicketId: ticket._id,
    dibuatOleh: userId,
  });

  ticket.status = "Selesai";
  ticket.tanggalSelesai = new Date();
  ticket.statusHistory.push({
    statusBaru: "Selesai",
    catatan: `Tiket diselesaikan. Knowledge Base (ID: ${kbEntry._id}) dibuat oleh (ID: ${userId}).`,
  });

  await ticket.save();
  return { ticket, kbEntry };
};

module.exports = {
  createServiceTicket,
  getServiceTickets,
  getServiceTicketById,
  assignServiceTicket,
  updateServiceTicketStatus,
  addReplacementItem,
  completeTicketAndCreateKB,
};
