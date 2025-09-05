// src/models/ticket.model.js
const mongoose = require("mongoose");

const STATUS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY = ["low", "medium", "high", "urgent"];

const TicketSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: STATUS,
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: PRIORITY,
      default: "medium",
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    requesterEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    assignee: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    attachments: {
      type: [String], // URL/filepath
      default: [],
    },
    slaDueAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// generate code sederhana TCK-YYYYMMDD-<6hex>
TicketSchema.pre("save", function (next) {
  if (this.code) return next();
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  this.code = `TCK-${y}${m}${day}-${rand}`;
  next();
});

module.exports = {
  Ticket: mongoose.model("Ticket", TicketSchema),
  STATUS,
  PRIORITY,
};
