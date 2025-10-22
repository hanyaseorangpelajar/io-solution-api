const httpStatus = require("http-status");

// --- PERBAIKAN ---
const {
  createServiceTicket,
  queryServiceTickets,
  getServiceTicketById,
  assignTicket,
  addDiagnosis,
  addAction,
  updateTicketStatus,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");
// Menggunakan barrel models
const { TICKET_STATUSES } = require("../models");
// --- AKHIR PERBAIKAN ---

const createTicketController = catchAsync(async (req, res) => {
  // Tambahkan createdBy dari user yang terotentikasi
  const ticketBody = { ...req.body, createdBy: req.user.id };
  const ticket = await createServiceTicket(ticketBody);
  res.status(httpStatus.CREATED).send(ticket);
});

const getTicketsController = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const result = await queryServiceTickets(filter);
  res.send(result);
});

const getTicketController = catchAsync(async (req, res) => {
  const ticket = await getServiceTicketById(req.params.id);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  res.send(ticket);
});

const assignTicketController = catchAsync(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID Teknisi wajib diisi");
  }
  const ticket = await assignTicket(req.params.id, userId);
  res.send(ticket);
});

const addDiagnosisController = catchAsync(async (req, res) => {
  const { symptom, diagnosis } = req.body;
  if (!symptom || !diagnosis) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Gejala dan diagnosis wajib diisi"
    );
  }
  const ticket = await addDiagnosis(req.params.id, {
    symptom,
    diagnosis,
  });
  res.send(ticket);
});

const addActionController = catchAsync(async (req, res) => {
  const { actionTaken, componentsUsed } = req.body;
  if (!actionTaken) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Deskripsi tindakan wajib diisi"
    );
  }
  if (componentsUsed && !Array.isArray(componentsUsed)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "componentsUsed harus berupa array"
    );
  }

  const ticket = await addAction(req.params.id, {
    actionTaken,
    componentsUsed: componentsUsed || [],
  });
  res.send(ticket);
});

const updateTicketStatusController = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status baru wajib diisi");
  }
  if (!TICKET_STATUSES.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status tidak valid. Pilihan: ${TICKET_STATUSES.join(", ")}`
    );
  }

  const ticket = await updateTicketStatus(req.params.id, status);
  res.send(ticket);
});

module.exports = {
  createTicket: createTicketController,
  getTickets: getTicketsController,
  getTicket: getTicketController,
  assignTicket: assignTicketController,
  addDiagnosis: addDiagnosisController,
  addAction: addActionController,
  updateTicketStatus: updateTicketStatusController,
};
