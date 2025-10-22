// src/models/serviceTicket.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- Constants for Enums ---
const TICKET_STATUSES = [
  "Baru",
  "Dialokasikan",
  "Dalam Pengerjaan",
  "Menunggu Komponen",
  "Selesai",
  "Dibatalkan",
  "Ditutup",
];

// --- Sub-Schemas ---
// ... (Skema DiagnosticSchema, ComponentUsedSchema, ActionSchema tetap sama) ...
const DiagnosticSchema = new Schema(
  {
    symptom: {
      type: String,
      required: [true, "Gejala (symptom) wajib diisi"],
      trim: true,
    },
    diagnosis: {
      type: String,
      required: [true, "Hasil diagnosis wajib diisi"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ComponentUsedSchema = new Schema(
  {
    component: {
      type: Schema.Types.ObjectId,
      ref: "Component",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Kuantitas minimal adalah 1"],
      default: 1,
    },
  },
  { _id: false }
);

const ActionSchema = new Schema(
  {
    actionTaken: {
      type: String,
      required: [true, "Deskripsi tindakan wajib diisi"],
      trim: true,
    },
    componentsUsed: [ComponentUsedSchema],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// --- Main Schema ---

const ServiceTicketSchema = new Schema(
  {
    ticketNumber: { type: String, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    deviceInfo: { type: String, required: true, trim: true },
    initialComplaint: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "Baru",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    diagnostics: { type: [DiagnosticSchema], default: [] },
    actions: { type: [ActionSchema], default: [] },
    finalResult: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// ... (Pre-save hook tetap sama) ...
ServiceTicketSchema.pre("save", function (next) {
  if (!this.isNew || this.ticketNumber) {
    return next();
  }
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  this.ticketNumber = `SRV-${y}${m}${day}-${rand}`;
  next();
});

const ServiceTicket =
  mongoose.models.ServiceTicket ||
  mongoose.model("ServiceTicket", ServiceTicketSchema);

module.exports = { ServiceTicket, TICKET_STATUSES };
