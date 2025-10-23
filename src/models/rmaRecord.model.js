// src/models/rmaRecord.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

// --- Konstanta Enums ---
const RMA_STATUSES = [
  "new",
  "received",
  "sent_to_vendor",
  "in_vendor",
  "replaced",
  "repaired",
  "returned",
  "rejected",
  "cancelled",
];

const RMA_ACTION_TYPES = [
  "receive_unit",
  "send_to_vendor",
  "vendor_update",
  "replace",
  "repair",
  "return_to_customer",
  "reject",
  "cancel",
];

// --- Sub-schema ---

const WarrantyInfoSchema = new Schema(
  {
    purchaseDate: { type: Date, default: null },
    warrantyMonths: { type: Number, min: 0, default: null },
    serial: { type: String, trim: true, default: null },
    vendor: { type: String, trim: true, default: null },
    invoiceNo: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const RmaActionSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: RMA_ACTION_TYPES,
        message: "Tipe aksi RMA tidak valid ({VALUE})",
      },
      required: true,
    },
    note: { type: String, trim: true, default: "" },
    // User yang melakukan aksi
    by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Waktu aksi (timestamp dibuat otomatis oleh Mongoose)
    at: { type: Date, default: Date.now }, // Frontend mengirim 'at', kita gunakan default Date.now
    // Payload fleksibel untuk data tambahan (resi, biaya, dll.)
    payload: { type: Schema.Types.Mixed, default: null },
  },
  {
    // _id: false, // Mungkin perlu _id jika frontend butuh ID unik per aksi? Frontend punya 'id' di RmaAction.
    timestamps: { createdAt: "at", updatedAt: false }, // Gunakan 'at'
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id; // Frontend punya 'id' per action
        if (ret.by) {
          // Jika frontend hanya butuh ID string, bukan objek user
          ret.by =
            typeof ret.by === "object"
              ? ret.by._id?.toString()
              : ret.by.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.by) {
          ret.by =
            typeof ret.by === "object"
              ? ret.by._id?.toString()
              : ret.by.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// --- Skema Utama ---

const RmaRecordSchema = new Schema(
  {
    code: { type: String, unique: true, index: true }, // RMA-YYYY-XXXXX
    title: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: null },
    productName: { type: String, required: true, trim: true },
    productSku: { type: String, trim: true, default: null, index: true },
    // Relasi opsional ke ServiceTicket
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "ServiceTicket",
      default: null,
      index: true,
    },
    issueDesc: { type: String, trim: true, default: "" },
    warranty: { type: WarrantyInfoSchema, default: () => ({}) }, // Embedded schema
    status: {
      type: String,
      enum: {
        values: RMA_STATUSES,
        message: "Status RMA tidak valid ({VALUE})",
      },
      default: "new",
      required: true,
      index: true,
    },
    actions: { type: [RmaActionSchema], default: [] }, // Array of sub-documents
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        // Map relasi ticket -> ticketId
        if (ret.ticket) {
          ret.ticketId =
            typeof ret.ticket === "object"
              ? ret.ticket._id?.toString()
              : ret.ticket.toString();
        }
        // Pastikan tanggal diformat ISO string
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        if (ret.warranty?.purchaseDate) {
          ret.warranty.purchaseDate = ret.warranty.purchaseDate.toISOString();
        }
        // Hapus field asli
        delete ret._id;
        delete ret.ticket;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.ticket) {
          ret.ticketId =
            typeof ret.ticket === "object"
              ? ret.ticket._id?.toString()
              : ret.ticket.toString();
        }
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        if (ret.warranty?.purchaseDate) {
          ret.warranty.purchaseDate = ret.warranty.purchaseDate.toISOString();
        }
        delete ret._id;
        delete ret.ticket;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook untuk generate kode RMA unik
RmaRecordSchema.pre("save", async function (next) {
  if (!this.isNew || this.code) {
    return next();
  }
  try {
    const year = new Date().getFullYear();
    // Cari RMA terakhir di tahun ini untuk mendapatkan nomor urut
    const lastRma = await this.constructor
      .findOne({ code: new RegExp(`^RMA-${year}-`) })
      .sort({ code: -1 }) // Sort descending
      .select("code")
      .lean();

    let sequence = 1;
    if (lastRma) {
      const lastSeq = parseInt(lastRma.code.split("-")[2], 10);
      sequence = lastSeq + 1;
    }
    // Format: RMA-YYYY-NNNNN (5 digit sequence)
    this.code = `RMA-${year}-${String(sequence).padStart(5, "0")}`;
    next();
  } catch (error) {
    next(error); // Pass error ke Mongoose
  }
});

const RmaRecord =
  mongoose.models.RmaRecord || mongoose.model("RmaRecord", RmaRecordSchema);

module.exports = { RmaRecord, RMA_STATUSES, RMA_ACTION_TYPES };
