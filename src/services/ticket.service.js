// src/services/ticket.service.js
const { Ticket } = require("../models/ticket.model");
const {
  parsePagination,
  parseSort,
  buildTicketFilters,
} = require("../utils/query");

async function createTicket(payload) {
  const ticket = await Ticket.create(payload);
  return ticket.toObject();
}

async function getTickets(query) {
  const filters = buildTicketFilters(query);
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query);

  const [items, total] = await Promise.all([
    Ticket.find(filters).sort(sort).skip(skip).limit(limit).lean(),
    Ticket.countDocuments(filters),
  ]);

  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getTicketById(id) {
  return Ticket.findById(id).lean();
}

async function updateTicketById(id, payload) {
  const updated = await Ticket.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
  return updated;
}

async function updateTicketStatus(id, status) {
  const updated = await Ticket.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).lean();
  return updated;
}

async function deleteTicketById(id) {
  const deleted = await Ticket.findByIdAndDelete(id).lean();
  return deleted;
}

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketById,
  updateTicketStatus,
  deleteTicketById,
};
