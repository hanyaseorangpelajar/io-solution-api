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
    relatedComponents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Part",
      },
    ],
    sourceTicket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Tiket sumber wajib ada untuk traceability"],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (Array.isArray(ret.relatedComponents)) {
          ret.relatedComponentIds = ret.relatedComponents
            .map((comp) =>
              typeof comp === "object" ? comp._id?.toString() : comp.toString()
            )
            .filter((id) => id);
        } else {
          ret.relatedComponentIds = [];
        }
        if (ret.sourceTicket) {
          ret.sourceTicketId =
            typeof ret.sourceTicket === "object"
              ? ret.sourceTicket._id?.toString()
              : ret.sourceTicket.toString();
        } else {
          ret.sourceTicketId = null;
        }
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();

        delete ret._id;
        delete ret.relatedComponents;
        delete ret.sourceTicket;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (Array.isArray(ret.relatedComponents)) {
          ret.relatedComponentIds = ret.relatedComponents
            .map((comp) =>
              typeof comp === "object" ? comp._id?.toString() : comp.toString()
            )
            .filter((id) => id);
        } else {
          ret.relatedComponentIds = [];
        }
        if (ret.sourceTicket) {
          ret.sourceTicketId =
            typeof ret.sourceTicket === "object"
              ? ret.sourceTicket._id?.toString()
              : ret.sourceTicket.toString();
        } else {
          ret.sourceTicketId = null;
        }
        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();
        delete ret._id;
        delete ret.relatedComponents;
        delete ret.sourceTicket;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const KnowledgeEntry =
  mongoose.models.KnowledgeEntry ||
  mongoose.model("KnowledgeEntry", KnowledgeEntrySchema);

module.exports = { KnowledgeEntry };
