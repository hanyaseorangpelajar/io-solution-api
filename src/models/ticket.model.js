const mongoose = require("mongoose");
const { Schema } = mongoose;

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];
const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];

const DiagnosticSchema = new Schema(
  {
    symptom: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PartUsedInActionSchema = new Schema(
  {
    part: {
      type: Schema.Types.ObjectId,
      ref: "Part",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const ActionSchema = new Schema(
  {
    actionTaken: { type: String, required: true, trim: true },
    partsUsed: [PartUsedInActionSchema],
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PartUsageSchema = new Schema(
  {
    partId: { type: Schema.Types.ObjectId, ref: "Part", required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CustomCostSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TicketResolutionSchema = new Schema(
  {
    rootCause: { type: String, required: true, trim: true },
    solution: { type: String, required: true, trim: true },
    parts: { type: [PartUsageSchema], default: [] },
    photos: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    extraCosts: { type: [CustomCostSchema], default: [] },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedAt: { type: Date, required: true },
  },
  { _id: false }
);

const TicketSchema = new Schema(
  {
    code: { type: String, unique: true, index: true },
    subject: {
      type: String,
      required: [true, "Subjek wajib diisi"],
      trim: true,
    },
    requester: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: {
        values: TICKET_PRIORITIES,
        message: "Prioritas tidak valid ({VALUE})",
      },
      default: "medium",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUSES,
        message: "Status tidak valid ({VALUE})",
      },
      default: "open",
      required: true,
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    description: { type: String, trim: true, default: "" },

    diagnostics: { type: [DiagnosticSchema], default: [], select: false },
    actions: { type: [ActionSchema], default: [], select: false },

    resolution: { type: TicketResolutionSchema, default: null, select: false },

    deviceInfo: { type: String, trim: true, select: false },
    initialComplaint: { type: String, trim: true, select: false },
    finalResult: { type: String, trim: true, default: "", select: false },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;

        if (ret.assignee) {
          ret.assignee =
            typeof ret.assignee === "object"
              ? ret.assignee._id?.toString()
              : ret.assignee.toString();
        } else {
          ret.assignee = null;
        }

        ret.createdAt = ret.createdAt?.toISOString();
        ret.updatedAt = ret.updatedAt?.toISOString();

        if (ret.resolution && ret.resolution.resolvedAt) {
          ret.resolution.resolvedAt = ret.resolution.resolvedAt.toISOString();
        }
        if (ret.resolution && ret.resolution.resolvedBy) {
          ret.resolution.resolvedBy =
            typeof ret.resolution.resolvedBy === "object"
              ? ret.resolution.resolvedBy._id?.toString()
              : ret.resolution.resolvedBy.toString();
        }

        delete ret._id;
        delete ret.__v;
        delete ret.diagnostics;
        delete ret.actions;
        delete ret.deviceInfo;
        delete ret.initialComplaint;
        delete ret.finalResult;
        delete ret.createdBy;

        return ret;
      },
    },
  }
);

TicketSchema.pre("save", async function (next) {
  if (!this.isNew || this.code) {
    return next();
  }
  try {
    const year = new Date().getFullYear();
    const lastTicket = await this.constructor
      .findOne({ code: new RegExp(`^TCK-${year}-`) })
      .sort({ code: -1 })
      .select("code")
      .lean();

    let sequence = 1;
    if (lastTicket && lastTicket.code) {
      const lastSeq = parseInt(lastTicket.code.split("-")[2], 10);
      sequence = lastSeq + 1;
    }
    this.code = `TCK-${year}-${String(sequence).padStart(7, "0")}`;
    next();
  } catch (error) {
    next(error);
  }
});

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);

module.exports = { Ticket, TICKET_STATUSES, TICKET_PRIORITIES };
