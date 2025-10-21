const mongoose = require("mongoose");

const ComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama komponen wajib diisi"],
      trim: true,
      maxlength: 150,
      index: true,
    },
    type: {
      type: String,
      required: [true, "Tipe komponen wajib diisi"],
      trim: true,
      index: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stok tidak boleh negatif"],
    },
    price: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Harga tidak boleh negatif"],
    },
  },
  { timestamps: true }
);

const Component = mongoose.model("Component", ComponentSchema);

module.exports = { Component };
