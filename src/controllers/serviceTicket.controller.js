// src/controllers/serviceTicket.controller.js
const httpStatus = require("http-status");
const { serviceTicketService } = require("../services");
const { catchAsync } = require("../utils/catchAsync");
const { ApiError } = require("../utils/ApiError");
const { TICKET_STATUSES } = require("../models/serviceTicket.model");

const createTicket = catchAsync(async (req, res) => {
  // req.body.createdBy diharapkan berisi ID Admin yang membuat tiket
  const ticket = await serviceTicketService.createServiceTicket(req.body);
  res.status(httpStatus.CREATED).send(ticket);
});

const getTickets = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const result = await serviceTicketService.queryServiceTickets(filter);
  res.send(result);
});

const getTicket = catchAsync(async (req, res) => {
  const ticket = await serviceTicketService.getServiceTicketById(req.params.id);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tiket tidak ditemukan");
  }
  res.send(ticket);
});

const assignTicket = catchAsync(async (req, res) => {
  const { userId } = req.body; // ID Teknisi
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID Teknisi wajib diisi");
  }
  const ticket = await serviceTicketService.assignTicket(req.params.id, userId);
  res.send(ticket);
});

const addDiagnosis = catchAsync(async (req, res) => {
  const { symptom, diagnosis } = req.body;
  if (!symptom || !diagnosis) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Gejala dan diagnosis wajib diisi"
    );
  }
  const ticket = await serviceTicketService.addDiagnosis(req.params.id, {
    symptom,
    diagnosis,
  });
  res.send(ticket);
});

const addAction = catchAsync(async (req, res) => {
  const { actionTaken, componentsUsed } = req.body;
  if (!actionTaken) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Deskripsi tindakan wajib diisi"
    );
  }
  // componentsUsed bisa kosong, tapi jika ada, harus array
  if (componentsUsed && !Array.isArray(componentsUsed)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "componentsUsed harus berupa array"
    );
  }

  const ticket = await serviceTicketService.addAction(req.params.id, {
    actionTaken,
    componentsUsed: componentsUsed || [],
  });
  res.send(ticket);
});

const updateTicketStatus = catchAsync(async (req, res) => {
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

  const ticket = await serviceTicketService.updateTicketStatus(
    req.params.id,
    status
  );
  res.send(ticket);
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  assignTicket,
  addDiagnosis,
  addAction,
  updateTicketStatus,
};
