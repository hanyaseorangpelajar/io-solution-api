const mongoose = require("mongoose");
const { Schema } = mongoose;

const TICKET_STATUSES = [
  "Baru",
  "Dialokasikan",
  "Dalam Pengerjaan",
  "Menunggu Komponen",
  "Selesai",
  "Dibatalkan",
  "Ditutup",
];

const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

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
      ref: "Part",
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

const ServiceTicketSchema = new Schema(
  {
    ticketNumber: { type: String, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    deviceInfo: { type: String, required: true, trim: true },
    initialComplaint: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUSES,
        message: "Status tiket tidak valid ({VALUE})",
      },
      default: "Baru",
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: TICKET_PRIORITIES,
        message: "Prioritas tiket tidak valid ({VALUE})",
      },
      default: "Medium",
      required: true,
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
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.assignedTo) ret.assignedToId = ret.assignedTo.toString();
        if (ret.createdBy) ret.createdById = ret.createdBy.toString();
        delete ret._id;
        delete ret.assignedTo;
        delete ret.createdBy;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.assignedTo) ret.assignedToId = ret.assignedTo.toString();
        if (ret.createdBy) ret.createdById = ret.createdBy.toString();
        delete ret._id;
        delete ret.assignedTo;
        delete ret.createdBy;
        delete ret.__v;
        return ret;
      },
    },
  }
);

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

module.exports = { ServiceTicket, TICKET_STATUSES, TICKET_PRIORITIES };
