const mongoose = require("mongoose");
const { Schema } = mongoose;

const STOCK_MOVE_TYPES = ["in", "out", "adjust"];

const StockMovementSchema = new Schema(
  {
    part: {
      type: Schema.Types.ObjectId,
      ref: "Part",
      required: true,
      index: true,
    },
    partNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: STOCK_MOVE_TYPES,
        message: "Tipe pergerakan stok tidak valid ({VALUE})",
      },
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Kuantitas minimal 1"],
    },
    reference: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "at", updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.part) {
          ret.partId =
            typeof ret.part === "object"
              ? ret.part._id?.toString()
              : ret.part.toString();
          ret.partName = ret.partNameSnapshot;
        }
        if (ret.user) {
          ret.by =
            typeof ret.user === "object"
              ? ret.user._id?.toString()
              : ret.user.toString();
        }
        if (ret.reference !== undefined) {
          ret.ref = ret.reference;
        }
        if (ret.notes !== undefined) {
          ret.note = ret.notes;
        }
        if (ret.quantity !== undefined) {
          ret.qty = ret.quantity;
        }
        delete ret._id;
        delete ret.part;
        delete ret.user;
        delete ret.partNameSnapshot;
        delete ret.reference;
        delete ret.quantity;
        delete ret.notes;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        if (ret.part) {
          ret.partId =
            typeof ret.part === "object"
              ? ret.part._id?.toString()
              : ret.part.toString();
          ret.partName = ret.partNameSnapshot;
        }
        if (ret.user) {
          ret.by =
            typeof ret.user === "object"
              ? ret.user._id?.toString()
              : ret.user.toString();
        }
        if (ret.reference !== undefined) {
          ret.ref = ret.reference;
        }
        if (ret.notes !== undefined) {
          ret.note = ret.notes;
        }
        if (ret.quantity !== undefined) {
          ret.qty = ret.quantity;
        }
        delete ret._id;
        delete ret.part;
        delete ret.user;
        delete ret.partNameSnapshot;
        delete ret.reference;
        delete ret.quantity;
        delete ret.notes;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const StockMovement =
  mongoose.models.StockMovement ||
  mongoose.model("StockMovement", StockMovementSchema);

module.exports = { StockMovement, STOCK_MOVE_TYPES };
