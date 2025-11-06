const mongoose = require("mongoose");
const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    noHp: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    alamat: {
      type: String,
      trim: true,
    },
    catatan: {
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
      },
    },
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Customer };
