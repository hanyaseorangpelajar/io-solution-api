// src/services/history.service.js
const { TicketEvent } = require("../models/ticketEvent.model");

async function createEvent({
  ticketId,
  type,
  payload = {},
  actor = null,
  ip = null,
  userAgent = null,
}) {
  const ev = await TicketEvent.create({
    ticketId,
    type,
    payload,
    actor,
    ip,
    userAgent,
  });
  return ev.toObject();
}

async function listEvents(ticketId, query = {}) {
  const limit = Math.min(Math.max(parseInt(query.limit || "50", 10), 1), 200);
  const items = await TicketEvent.find({ ticketId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return items.map((e) => ({
    id: e._id.toString(),
    ticketId: e.ticketId.toString(),
    type: e.type,
    payload: e.payload || {},
    actor: e.actor ?? null,
    createdAt: e.createdAt.toISOString(),
  }));
}

module.exports = { createEvent, listEvents };
