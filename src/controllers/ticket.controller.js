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

function buildContext(req) {
  return {
    actor: null, // plug-in Auth nanti
    ip: req.ip || null,
    userAgent: req.headers["user-agent"] || null,
  };
}

// helper untuk fallback field lama → baru
function pickTicketCreatePayload(body = {}) {
  // fallback: title → subject, requesterName → requester
  const subject = body.subject ?? body.title;
  const requester = body.requester ?? body.requesterName;

  return {
    subject,
    requester,
    requesterEmail: body.requesterEmail ?? "",
    description: body.description ?? "",
    status: body.status,
    priority: body.priority,
    assignee: body.assignee ?? "",
    tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : [],
    attachments: Array.isArray(body.attachments)
      ? body.attachments
      : body.attachments
      ? [body.attachments]
      : [],
    slaDueAt: body.slaDueAt ?? null,
  };
}

async function create(req, res) {
  const payload = pickTicketCreatePayload(req.body || {});
  const { subject, requester, status, priority } = payload;

  if (!subject || !requester) {
    res.status(400);
    throw new Error("subject dan requester wajib diisi");
  }
  assertEnum(status, STATUS, "status");
  assertEnum(priority, PRIORITY, "priority");

  const ticket = await service.createTicket(payload, buildContext(req));
  res.status(201).json(ticket);
}

async function list(req, res) {
  const result = await service.getTickets(req.query);
  res.json(result);
}

// untuk update, kita tetap izinkan field baru; kalau ada body lama, tangkap seperlunya
function pickTicketUpdatePayload(body = {}) {
  const patch = { ...body };

  // normalisasi nama lama → baru jika user masih mengirim
  if (patch.title && !patch.subject) patch.subject = patch.title;
  if (patch.requesterName && !patch.requester)
    patch.requester = patch.requesterName;

  // jaga array
  if (patch.tags && !Array.isArray(patch.tags)) patch.tags = [patch.tags];
  if (patch.attachments && !Array.isArray(patch.attachments))
    patch.attachments = [patch.attachments];

  return patch;
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
  const body = pickTicketUpdatePayload(req.body || {});
  assertEnum(body.status, STATUS, "status");
  assertEnum(body.priority, PRIORITY, "priority");

  const updated = await service.updateTicketById(id, body, buildContext(req));
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

  const updated = await service.updateTicketStatus(
    id,
    status,
    buildContext(req)
  );
  if (!updated) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json(updated);
}

async function resolve(req, res) {
  const { id } = req.params;
  const resolution = req.body || {}; // note, cause, solution, resolvedAt?
  const updated = await service.resolveTicket(
    id,
    resolution,
    buildContext(req)
  );
  if (!updated) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  res.json(updated);
}

async function remove(req, res) {
  const { id } = req.params;
  const deleted = await service.deleteTicketById(id, buildContext(req));
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
  resolve,
  remove,
};
