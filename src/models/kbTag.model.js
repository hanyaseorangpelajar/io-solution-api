const mongoose = require("mongoose");
const { Schema } = mongoose;

const kbTagSchema = new Schema(
  {
    nama: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const KBTag = mongoose.model("KBTag", kbTagSchema);

module.exports = { KBTag };
