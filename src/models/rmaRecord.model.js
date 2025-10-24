const mongoose = require("mongoose");
const { Schema } = mongoose;

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
    by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    at: { type: Date, default: Date.now },
    payload: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "at", updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.by) {
          ret.by =
            typeof ret.by === "object"
              ? ret.by._id?.toString()
              : ret.by.toString();
        }
        ret.at = ret.at?.toISOString();
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
        ret.at = ret.at?.toISOString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const RmaRecordSchema = new Schema(
  {
    code: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    contact: { type: String, trim: true, default: null },
    productName: { type: String, required: true, trim: true },
    productSku: { type: String, trim: true, default: null, index: true },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
      index: true,
    },
    issueDesc: { type: String, trim: true, default: "" },
    warranty: { type: WarrantyInfoSchema, default: () => ({}) },
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
    actions: { type: [RmaActionSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.ticket) {
          ret.ticketId =
            typeof ret.ticket === "object"
              ? ret.ticket._id?.toString()
              : ret.ticket.toString();
        } else {
          ret.ticketId = null;
        }
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        if (ret.warranty?.purchaseDate) {
          try {
            ret.warranty.purchaseDate = new Date(
              ret.warranty.purchaseDate
            ).toISOString();
          } catch (e) {
            ret.warranty.purchaseDate = null;
          }
        }
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
        } else {
          ret.ticketId = null;
        }
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        if (ret.warranty?.purchaseDate) {
          try {
            ret.warranty.purchaseDate = new Date(
              ret.warranty.purchaseDate
            ).toISOString();
          } catch (e) {
            ret.warranty.purchaseDate = null;
          }
        }
        delete ret._id;
        delete ret.ticket;
        delete ret.__v;
        return ret;
      },
    },
  }
);

RmaRecordSchema.pre("save", async function (next) {
  if (!this.isNew || this.code) {
    return next();
  }

  try {
    const year = new Date().getFullYear();
    const RmaModel = this.constructor;
    if (!RmaModel || typeof RmaModel.findOne !== "function") {
      throw new Error("Tidak dapat menemukan konstruktor model RMA.");
    }

    const lastRma = await RmaModel.findOne({
      code: new RegExp(`^RMA-${year}-`),
    })
      .sort({ code: -1 })
      .select("code")
      .lean();

    let sequence = 1;
    if (lastRma && lastRma.code) {
      const codeParts = lastRma.code.split("-");
      if (codeParts.length === 3) {
        const lastSeq = parseInt(codeParts[2], 10);
        if (!isNaN(lastSeq)) {
          sequence = lastSeq + 1;
        } else {
          console.warn(
            `[RMA Hook] Gagal parse sequence dari code: ${lastRma.code}. Menggunakan sequence 1.`
          );
        }
      } else {
        console.warn(
          `[RMA Hook] Format kode RMA terakhir tidak dikenali: ${lastRma.code}. Menggunakan sequence 1.`
        );
      }
    }

    this.code = `RMA-${year}-${String(sequence).padStart(5, "0")}`;
    console.log(`[RMA Hook] Generated code: ${this.code}`);
    next();
  } catch (error) {
    console.error("❌ Error dalam hook pre-save RMA code generator:", error);
    next(error);
  }
});

const RmaRecord =
  mongoose.models.RmaRecord || mongoose.model("RmaRecord", RmaRecordSchema);

module.exports = { RmaRecord, RMA_STATUSES, RMA_ACTION_TYPES };
