// src/models/ticket.model.js
const mongoose = require("mongoose");

const STATUS = ["open", "in_progress", "resolved", "closed"];
const PRIORITY = ["low", "medium", "high", "urgent"];

const ResolutionSchema = new mongoose.Schema(
  {
    note: { type: String, default: "" },
    cause: { type: String, default: "" },
    solution: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { _id: false }
);

const TicketSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: { type: String, default: "", maxlength: 5000 },
    status: { type: String, enum: STATUS, default: "open", index: true },
    priority: { type: String, enum: PRIORITY, default: "medium", index: true },
    requester: { type: String, required: true, trim: true, maxlength: 120 },
    requesterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },
    assignee: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    attachments: { type: [String], default: [] },
    slaDueAt: { type: Date, default: null, index: true },
    resolution: { type: ResolutionSchema, default: null },

    // hook untuk Auth nanti (placeholder)
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// generate code: TCK-YYYYMMDD-<6hex>
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
