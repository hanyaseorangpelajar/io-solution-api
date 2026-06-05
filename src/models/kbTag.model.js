const mongoose = require("mongoose");
const { Schema } = mongoose;

const kbTagSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nama tag wajib diisi"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const KBTag = mongoose.model("KBTag", kbTagSchema);

module.exports = { KBTag };
