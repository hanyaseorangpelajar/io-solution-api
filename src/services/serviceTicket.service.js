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
const { KBTag } = require("../models/kbTag.model");

/**
 * Membuat tiket servis baru (alur kerja ternormalisasi).
 * @param {Object} ticketBody - Data dari controller
 * @param {string} createdById - ID User yang membuat (Teknisi/Admin)
 * @returns {Promise<ServiceTicket>}
 */
const createServiceTicket = async (ticketBody, createdById) => {
  const { customer, device, keluhanAwal, priority, assignee } = ticketBody;
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
    priority: priority || "medium",
    teknisiId: assignee || null,
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
 * Memperbarui status tiket (HANYA status progres, bukan Selesai).
 */
const updateServiceTicketStatus = async (ticketId, statusUpdateBody, user) => {
  const { status, catatan } = statusUpdateBody;
  if (!status || !TICKET_STATUSES.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status baru tidak valid.");
  }

  if (status === "Diarsipkan" || status === "Selesai") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Gunakan endpoint 'complete' untuk menyelesaikan atau 'review' untuk mengarsipkan.`
    );
  }

  const ticket = await getServiceTicketById(ticketId);
  if (user.role !== "Teknisi") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Hanya Teknisi yang dapat mengubah status progres."
    );
  }
  const isAssignedTeknisi =
    ticket.teknisiId && ticket.teknisiId.id.toString() === user.id.toString();

  if (!isAssignedTeknisi) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Anda bukan teknisi yang ditugaskan untuk tiket ini."
    );
  }

  if (
    ticket.status === "Selesai" ||
    ticket.status === "Dibatalkan" ||
    ticket.status === "Diarsipkan"
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tiket sudah final (Selesai, Dibatalkan, atau Diarsipkan) dan tidak bisa diubah."
    );
  }

  if (ticket.status === status) {
    return ticket;
  }

  const allowed = {
    Diagnosis: ["DalamProses", "Dibatalkan", "MenungguSparepart"],
    DalamProses: ["MenungguSparepart", "Dibatalkan"],
    MenungguSparepart: ["DalamProses", "Dibatalkan"],
  };

  const nexts = allowed[ticket.status] || [];
  if (!nexts.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Transisi dari '${ticket.status}' ke '${status}' tidak diperbolehkan.`
    );
  }

  ticket.status = status;
  ticket.statusHistory.push({
    statusBaru: status,
    catatan: catatan || `Status diubah oleh ${user.nama} (ID: ${user.id}).`,
  });

  if (status === "Dibatalkan") {
    ticket.tanggalSelesai = new Date();
  }

  await ticket.save();
  return ticket;
};

/**
 * Menyelesaikan tiket (oleh Teknisi).
 * Menyimpan diagnosis dan solusi draft, mengubah status ke 'Selesai'.
 */
const completeByTeknisi = async (ticketId, completionBody, user) => {
  const { diagnosis, solusi } = completionBody;
  if (!diagnosis || !solusi) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Diagnosis dan Solusi wajib diisi."
    );
  }

  const ticket = await getServiceTicketById(ticketId);

  if (user.role !== "Teknisi") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Hanya Teknisi yang dapat menyelesaikan tiket."
    );
  }
  const isAssignedTeknisi =
    ticket.teknisiId && ticket.teknisiId.id.toString() === user.id.toString();
  if (!isAssignedTeknisi) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Anda bukan teknisi yang ditugaskan untuk tiket ini."
    );
  }

  if (
    ticket.status === "Selesai" ||
    ticket.status === "Dibatalkan" ||
    ticket.status === "Diarsipkan"
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Tiket ini sudah dalam status final."
    );
  }

  ticket.diagnosisTeknisi = diagnosis;
  ticket.solusiTeknisi = solusi;
  ticket.status = "Selesai";
  ticket.tanggalSelesai = new Date();

  ticket.statusHistory.push({
    statusBaru: "Selesai",
    catatan: `Diselesaikan oleh Teknisi (${user.nama}). Menunggu review Admin.`,
  });

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
  if (
    ticket.status === "Selesai" ||
    ticket.status === "Dibatalkan" ||
    ticket.status === "Diarsipkan"
  ) {
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
 * Mencari tag yang ada atau membuat baru, lalu mengembalikan ID-nya.
 * @param {string[]} tagNames - Array nama tag
 * @returns {Promise<mongoose.Types.ObjectId[]>} Array ID Tag
 */
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
 * Me-review dan mengarsipkan tiket (oleh Admin) DAN membuat KB Entry.
 */
const completeTicketAndCreateKB = async (ticketId, kbBody, userId) => {
  const { diagnosis, solusi, tags } = kbBody;

  if (!diagnosis || !solusi) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Diagnosis dan Solusi (yang sudah di-review) wajib diisi."
    );
  }

  const ticket = await getServiceTicketById(ticketId);

  if (ticket.status === "Diarsipkan") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Tiket ini sudah diarsipkan.");
  }

  if (ticket.status !== "Selesai" && ticket.status !== "Dibatalkan") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya tiket yang berstatus 'Selesai' atau 'Dibatalkan' yang bisa di-review."
    );
  }

  const gejala = ticket.keluhanAwal;
  const modelPerangkat = `${ticket.deviceId.brand || ""} ${
    ticket.deviceId.model || ""
  }`.trim();

  const tagObjectIds = await findOrCreateTags(tags);

  const kbEntry = await KBEntry.create({
    gejala,
    modelPerangkat,
    diagnosis,
    solusi,
    sourceTicketId: ticket._id,
    dibuatOleh: userId,
    tags: tagObjectIds,
  });

  ticket.status = "Diarsipkan";
  if (!ticket.tanggalSelesai) {
    ticket.tanggalSelesai = new Date();
  }

  ticket.statusHistory.push({
    statusBaru: "Diarsipkan",
    catatan: `Tiket di-review & diarsipkan. KB (ID: ${kbEntry._id}) dibuat oleh Admin (ID: ${userId}).`,
  });

  await ticket.save();
  return { ticket, kbEntry };
};

/**
 * Mengambil riwayat status global (log tiket).
 * @param {object} filter - Filter query (q, from, to)
 * @param {User} user - Pengguna yang terotentikasi
 */
const getGlobalStatusHistory = async (filter, user) => {
  const { q, from, to } = filter;
  const pipeline = [];

  const matchStage = {};
  if (user.role === "Teknisi") {
    matchStage.teknisiId = user._id;
  }
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({ $unwind: "$statusHistory" });

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  if (Object.keys(dateFilter).length > 0) {
    pipeline.push({ $match: { "statusHistory.waktu": dateFilter } });
  }

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "teknisiId",
      foreignField: "_id",
      as: "teknisiInfo",
    },
  });

  if (q) {
    const searchQuery = { $regex: q, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { nomorTiket: searchQuery },
          { "statusHistory.catatan": searchQuery },
          { "statusHistory.statusBaru": searchQuery },
          { "teknisiInfo.nama": searchQuery },
        ],
      },
    });
  }

  pipeline.push({ $sort: { "statusHistory.waktu": -1 } });

  pipeline.push({ $limit: 200 });

  pipeline.push({
    $project: {
      _id: "$statusHistory._id",
      at: "$statusHistory.waktu",
      note: "$statusHistory.catatan",
      newStatus: "$statusHistory.statusBaru",
      ticketCode: "$nomorTiket",
      ticketId: "$_id",
      teknisiName: { $arrayElemAt: ["$teknisiInfo.nama", 0] },
    },
  });

  const historyLogs = await ServiceTicket.aggregate(pipeline);

  return {
    results: historyLogs,
    page: 1,
    limit: historyLogs.length,
    totalResults: historyLogs.length,
    totalPages: 1,
  };
};

module.exports = {
  createServiceTicket,
  getServiceTickets,
  getServiceTicketById,
  assignServiceTicket,
  updateServiceTicketStatus,
  completeByTeknisi,
  addReplacementItem,
  completeTicketAndCreateKB,
  getGlobalStatusHistory,
};
