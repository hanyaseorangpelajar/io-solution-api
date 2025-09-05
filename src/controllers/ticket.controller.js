// src/controllers/ticket.controller.js
const { STATUS, PRIORITY } = require("../models/ticket.model");
const service = require("../services/ticket.service");

function assertEnum(value, allowed, field) {
  if (value === undefined) return;
  if (!allowed.includes(value)) {
    const list = allowed.join(", ");
    const err = new Error(`${field} harus salah satu dari: ${list}`);
    err.status = 400;
    throw err;
  }
}

async function create(req, res) {
  const {
    title,
    description = "",
    status, // optional
    priority, // optional
    requesterName,
    requesterEmail,
    assignee = "",
    tags = [],
    attachments = [],
    slaDueAt = null,
  } = req.body || {};

  if (!title || !requesterName || !requesterEmail) {
    res.status(400);
    throw new Error("title, requesterName, dan requesterEmail wajib diisi");
  }

  assertEnum(status, STATUS, "status");
  assertEnum(priority, PRIORITY, "priority");

  const ticket = await service.createTicket({
    title,
    description,
    status,
    priority,
    requesterName,
    requesterEmail,
    assignee,
    tags,
    attachments,
    slaDueAt,
  });

  res.status(201).json(ticket);
}

async function list(req, res) {
  const result = await service.getTickets(req.query);
  res.json(result);
}

async function detail(req, res) {
  const { id } = req.params;
  const ticket = await service.getTicketById(id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json(ticket);
}

async function update(req, res) {
  const { id } = req.params;
  const { status, priority } = req.body || {};
  assertEnum(status, STATUS, "status");
  assertEnum(priority, PRIORITY, "priority");

  const updated = await service.updateTicketById(id, req.body);
  if (!updated) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json(updated);
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) {
    res.status(400);
    throw new Error("status wajib diisi");
  }
  assertEnum(status, STATUS, "status");

  const updated = await service.updateTicketStatus(id, status);
  if (!updated) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json(updated);
}

async function remove(req, res) {
  const { id } = req.params;
  const deleted = await service.deleteTicketById(id);
  if (!deleted) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json({ message: "Ticket dihapus", id });
}

module.exports = {
  create,
  list,
  detail,
  update,
  updateStatus,
  remove,
};
