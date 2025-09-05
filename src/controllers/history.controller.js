// src/controllers/history.controller.js
const { Ticket } = require("../models/ticket.model");
const { listEvents } = require("../services/history.service");

async function listHistory(req, res) {
  const { id } = req.params;
  const t = await Ticket.findById(id).lean();
  if (!t) {
    res.status(404);
    throw new Error("Ticket tidak ditemukan");
  }
  const events = await listEvents(t._id, req.query);
  res.json(events);
}

module.exports = { listHistory };
