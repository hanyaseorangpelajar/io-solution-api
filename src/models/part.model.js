const mongoose = require("mongoose");
const { Schema } = mongoose;

const PART_STATUSES = ["active", "inactive", "discontinued"];

const PART_CATEGORIES = [
  "cpu",
  "motherboard",
  "ram",
  "storage",
  "gpu",
  "psu",
  "case",
  "cooler",
  "nic",
  "others",
];

const PartSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nama part wajib diisi"],
      trim: true,
      maxlength: 150,
      index: true,
    },
    sku: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      index: true,
      default: null,
      enum: {
        values: PART_CATEGORIES,
        message: "Kategori part tidak valid ({VALUE})",
      },
    },
    vendor: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    unit: {
      type: String,
      required: [true, "Satuan wajib diisi"],
      trim: true,
      lowercase: true,
      default: "pcs",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stok tidak boleh negatif"],
    },
    minStock: {
      type: Number,
      default: 0,
      min: [0, "Stok minimum tidak boleh negatif"],
    },
    location: {
      type: String,
      trim: true,
      default: null,
    },
    price: {
      type: Number,
      default: null,
      min: [0, "Harga tidak boleh negatif"],
    },
    status: {
      type: String,
      enum: {
        values: PART_STATUSES,
        message: "Status part tidak valid ({VALUE})",
      },
      default: "active",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Part = mongoose.models.Part || mongoose.model("Part", PartSchema);

module.exports = { Part, PART_STATUSES, PART_CATEGORIES };
