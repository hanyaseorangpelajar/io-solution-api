// src/services/ticket.service.js
const { Ticket } = require("../models/ticket.model");
const {
  parsePagination,
  parseSort,
  buildTicketFilters,
} = require("../utils/query");
const { createEvent } = require("./history.service");
const { diffFields } = require("../utils/diff");
const { mapTicket, mapTickets } = require("../utils/dto");

async function createTicket(payload, context = {}) {
  const ticket = await Ticket.create({
    ...payload,
    createdBy: context.actor || null,
    updatedBy: context.actor || null,
  });

  await createEvent({
    ticketId: ticket._id,
    type: "created",
    payload: {
      code: ticket.code,
      subject: ticket.subject,
      priority: ticket.priority,
      status: ticket.status,
    },
    actor: context.actor || null,
    ip: context.ip || null,
    userAgent: context.userAgent || null,
  });

  return mapTicket(ticket);
}

async function getTickets(query) {
  const filters = buildTicketFilters(query);
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query);

  const [items, total] = await Promise.all([
    Ticket.find(filters).sort(sort).skip(skip).limit(limit),
    Ticket.countDocuments(filters),
  ]);

  return {
    data: mapTickets(items),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getTicketById(id) {
  const t = await Ticket.findById(id);
  return mapTicket(t);
}

async function updateTicketById(id, payload, context = {}) {
  const before = await Ticket.findById(id).lean();
  if (!before) return null;

  const updated = await Ticket.findByIdAndUpdate(
    id,
    { ...payload, updatedBy: context.actor || null },
    { new: true, runValidators: true }
  );
  if (!updated) return null;

  const changed = diffFields(before, updated.toObject(), [
    "subject",
    "description",
    "status",
    "priority",
    "assignee",
    "tags",
    "attachments",
    "slaDueAt",
    "requester",
    "requesterEmail",
  ]);
  if (Object.keys(changed).length) {
    await createEvent({
      ticketId: updated._id,
      type: "updated",
      payload: { changed },
      actor: context.actor || null,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
    });
  }

  return mapTicket(updated);
}

async function updateTicketStatus(id, status, context = {}) {
  const before = await Ticket.findById(id);
  if (!before) return null;
  if (before.status === status) return mapTicket(before);

  before.status = status;
  before.updatedBy = context.actor || null;
  await before.save();

  await createEvent({
    ticketId: before._id,
    type: "status_changed",
    payload: { from: before.$__.priorDoc?.status || "unknown", to: status },
    actor: context.actor || null,
    ip: context.ip || null,
    userAgent: context.userAgent || null,
  });

  return mapTicket(before);
}

async function resolveTicket(id, resolution, context = {}) {
  const t = await Ticket.findById(id);
  if (!t) return null;

  t.status = "resolved";
  t.resolution = {
    note: resolution?.note || "",
    cause: resolution?.cause || "",
    solution: resolution?.solution || "",
    resolvedAt: resolution?.resolvedAt
      ? new Date(resolution.resolvedAt)
      : new Date(),
  };
  t.updatedBy = context.actor || null;
  await t.save();

  await createEvent({
    ticketId: t._id,
    type: "resolved",
    payload: { note: t.resolution.note, cause: t.resolution.cause },
    actor: context.actor || null,
    ip: context.ip || null,
    userAgent: context.userAgent || null,
  });

  return mapTicket(t);
}

async function deleteTicketById(id, context = {}) {
  const deleted = await Ticket.findByIdAndDelete(id);
  if (deleted) {
    await createEvent({
      ticketId: deleted._id,
      type: "deleted",
      payload: { code: deleted.code },
      actor: context.actor || null,
      ip: context.ip || null,
      userAgent: context.userAgent || null,
    });
  }
  return deleted ? mapTicket(deleted) : null;
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketById,
  updateTicketStatus,
  resolveTicket,
  deleteTicketById,
};
