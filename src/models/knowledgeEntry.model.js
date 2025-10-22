// src/models/knowledgeEntry.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const KnowledgeEntrySchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Judul wajib diisi"],
      trim: true,
      index: true,
    },
    symptom: {
      type: String,
      required: [true, "Gejala (symptom) wajib diisi"],
      trim: true,
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
    relatedComponents: [{ type: Schema.Types.ObjectId, ref: "Component" }],
    sourceTicket: {
      type: Schema.Types.ObjectId,
      ref: "ServiceTicket",
      required: [true, "Tiket sumber wajib ada untuk traceability"],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// --- BARIS INI DIUBAH ---
const KnowledgeEntry =
  mongoose.models.KnowledgeEntry ||
  mongoose.model("KnowledgeEntry", KnowledgeEntrySchema);

module.exports = { KnowledgeEntry };
