const mongoose = require("mongoose");
const { Schema } = mongoose;

const kbEntrySchema = new Schema(
  {
    gejala: {
      type: String,
      required: [true, "Gejala wajib diisi"],
      trim: true,
      index: true,
    },
    modelPerangkat: {
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
    solusi: {
      type: String,
      required: [true, "Solusi wajib diisi"],
      trim: true,
    },
    sourceTicketId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceTicket",
      required: [true, "Tiket sumber wajib ada"],
      unique: true,
      index: true,
    },
    dibuatOleh: {
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

const KBEntry = mongoose.model("KBEntry", kbEntrySchema);

module.exports = { KBEntry };
