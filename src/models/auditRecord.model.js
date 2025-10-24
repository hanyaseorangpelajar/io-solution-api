const mongoose = require("mongoose");
const { Schema } = mongoose;

const AUDIT_STATUSES = ["draft", "approved", "rejected"];

const AuditRecordSchema = new Schema(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Referensi tiket wajib diisi"],
      index: true,
    },
    ticketCode: {
      type: String,
      required: [true, "Kode tiket wajib diisi"],
      trim: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer wajib diisi"],
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: AUDIT_STATUSES,
        message: "Status audit tidak valid ({VALUE})",
      },
      default: "draft",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Skor wajib diisi"],
      min: [0, "Skor minimal 0"],
      max: [100, "Skor maksimal 100"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    tags: {
      type: [String],
      required: true,
      validate: [
        (v) =>
          Array.isArray(v) &&
          v.length > 0 &&
          v.every((tag) => typeof tag === "string" && tag.trim().length > 0),
        "Minimal harus ada 1 tag dan tidak boleh kosong",
      ],
      default: [],
    },
    publish: {
      type: Boolean,
      default: false,
    },
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
        }
        if (ret.reviewer) {
          ret.reviewerId =
            typeof ret.reviewer === "object"
              ? ret.reviewer._id?.toString()
              : ret.reviewer.toString();
        }

        delete ret._id;
        delete ret.ticket;
        delete ret.reviewer;
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
        if (ret.reviewer) {
          ret.reviewerId =
            typeof ret.reviewer === "object"
              ? ret.reviewer._id?.toString()
              : ret.reviewer.toString();
        }
        delete ret._id;
        delete ret.ticket;
        delete ret.reviewer;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const AuditRecord =
  mongoose.models.AuditRecord ||
  mongoose.model("AuditRecord", AuditRecordSchema);

module.exports = { AuditRecord, AUDIT_STATUSES };
