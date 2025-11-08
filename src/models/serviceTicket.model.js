const mongoose = require("mongoose");
const { Schema } = mongoose;

const TICKET_STATUSES = [
  "Diagnosis",
  "DalamProses",
  "MenungguSparepart",
  "Selesai",
  "Dibatalkan",
];

const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];

const StatusHistorySchema = new Schema(
  {
    waktu: {
      type: Date,
      default: Date.now,
    },
    statusBaru: {
      type: String,
      enum: TICKET_STATUSES,
      required: true,
    },
    catatan: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const ReplacementItemSchema = new Schema(
  {
    namaKomponen: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    keterangan: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const serviceTicketSchema = new Schema(
  {
    nomorTiket: {
      type: String,
      unique: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      required: true,
      index: true,
    },
    teknisiId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    keluhanAwal: {
      type: String,
      required: [true, "Keluhan awal wajib diisi"],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: TICKET_PRIORITIES,
        message: "Prioritas tidak valid ({VALUE})",
      },
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUSES,
        message: "Status tiket tidak valid ({VALUE})",
      },
      required: true,
      default: "Diagnosis",
      index: true,
    },
    tanggalMasuk: {
      type: Date,
      default: Date.now,
    },
    tanggalSelesai: {
      type: Date,
      default: null,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    replacementItems: { type: [ReplacementItemSchema], default: [] },
  },
  {
    timestamps: { createdAt: "dibuatPada", updatedAt: "diperbaruiPada" },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

serviceTicketSchema.pre("save", async function (next) {
  if (!this.isNew || this.nomorTiket) {
    return next();
  }

  if (
    this.isNew &&
    (!Array.isArray(this.statusHistory) || this.statusHistory.length === 0)
  ) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      statusBaru: this.status,
      catatan: "Tiket dibuat oleh sistem.",
    });
  }

  try {
    const year = new Date().getFullYear();
    const prefix = `SRV-${year}-`;

    const lastTicket = await this.constructor
      .findOne({ nomorTiket: new RegExp(`^${prefix}`) })
      .sort({ nomorTiket: -1 })
      .select("nomorTiket")
      .lean();

    let sequence = 1;
    if (lastTicket && lastTicket.nomorTiket) {
      const lastSeq = parseInt(lastTicket.nomorTiket.split("-")[2], 10);
      sequence = lastSeq + 1;
    }

    this.nomorTiket = `${prefix}${String(sequence).padStart(6, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

const ServiceTicket = mongoose.model("ServiceTicket", serviceTicketSchema);

module.exports = { ServiceTicket, TICKET_STATUSES, TICKET_PRIORITIES };
