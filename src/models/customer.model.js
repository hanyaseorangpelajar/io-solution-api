const mongoose = require("mongoose");
const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const toCustomerDto = (doc) => ({
  customerId: doc._id.toString(),
  name: doc.name,
  phone: doc.phone,
  address: doc.address || null,
  note: doc.note || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = { Customer, toCustomerDto };
