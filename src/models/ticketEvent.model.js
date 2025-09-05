// src/models/ticketEvent.model.js
const mongoose = require("mongoose");

const EVENT_TYPES = [
  "created",
  "updated",
  "status_changed",
  "resolved",
  "deleted",
];

const TicketEventSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    type: { type: String, enum: EVENT_TYPES, required: true, index: true },
    payload: { type: Object, default: {} },
    actor: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = {
  TicketEvent: mongoose.model("TicketEvent", TicketEventSchema),
  EVENT_TYPES,
};
