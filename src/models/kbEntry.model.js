const mongoose = require("mongoose");
const { Schema } = mongoose;

const kbEntrySchema = new Schema(
  {
    symptom: {
      type: String,
      required: [true, "Gejala wajib diisi"],
      trim: true,
      index: true,
    },
    deviceModel: {
      type: String,
      required: [true, "Model perangkat wajib diisi"],
      trim: true,
      index: true,
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis wajib diisi"],
      trim: true,
    },
    solution: {
      type: String,
      required: [true, "Solusi wajib diisi"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    sourceTicketId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceTicket",
      required: [true, "Tiket sumber wajib ada"],
      unique: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pembuat entri wajib diisi"],
      index: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "KBTag",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const toKBEntryDto = (doc) => ({
  kbId: doc._id.toString(),
  symptom: doc.symptom,
  deviceModel: doc.deviceModel,
  diagnosis: doc.diagnosis,
  solution: doc.solution,
  imageUrl: doc.imageUrl || null,

  sourceTicket: doc.sourceTicketId?._id
    ? {
        ticketId: doc.sourceTicketId._id.toString(),
        ticketNumber: doc.sourceTicketId.ticketNumber,
        technicianId: doc.sourceTicketId.technicianId?.toString(),
      }
    : doc.sourceTicketId,

  createdBy: doc.createdBy?._id
    ? {
        userId: doc.createdBy._id.toString(),
        name: doc.createdBy.name,
      }
    : doc.createdBy,

  tags: (doc.tags || []).map((t) => ({
    tagId: t._id?.toString() || t,
    name: t.name || "",
  })),

  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const KBEntry = mongoose.model("KBEntry", kbEntrySchema);

module.exports = { KBEntry, toKBEntryDto };
