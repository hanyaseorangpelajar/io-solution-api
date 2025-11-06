const mongoose = require("mongoose");
const { Schema } = mongoose;

const deviceSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
      index: true,
    },
    tipe: {
      type: String,
      trim: true,
    },
    deskripsi: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "dibuatPada", updatedAt: "diperbaruiPada" },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;

        const cid = ret.customerId;
        if (cid && typeof cid === "object" && !mongoose.isValidObjectId(cid)) {
          ret.customer = cid;
          ret.customerId = cid.id || (cid._id && cid._id.toString());
        }
      },
    },
  }
);

const Device = mongoose.model("Device", deviceSchema);

module.exports = { Device };
