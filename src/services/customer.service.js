const httpStatus = require("http-status");
const { Customer } = require("../models/customer.model");
const { parsePagination, ApiError } = require("../utils");

const getCustomers = async (filter) => {
  const { page, limit, skip } = parsePagination(filter, 10);
  const safe = {};

  if (filter.q) {
    safe.$or = [
      { name: { $regex: filter.q, $options: "i" } },
      { phone: { $regex: filter.q, $options: "i" } },
    ];
  }

  const [results, totalResults] = await Promise.all([
    Customer.find(safe).sort({ name: 1 }).skip(skip).limit(limit),
    Customer.countDocuments(safe),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;

  return { results, page, limit, totalResults, totalPages };
};

const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pelanggan tidak ditemukan");
  }
  return customer;
};

const updateCustomer = async (customerId, updateBody) => {
  const customer = await getCustomerById(customerId);

  if (updateBody.phone && updateBody.phone !== customer.phone) {
    const existing = await Customer.findOne({
      phone: updateBody.phone,
      _id: { $ne: customerId },
    });
    if (existing) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Nomor HP sudah digunakan oleh pelanggan lain.",
      );
    }
  }

  if (updateBody.name) customer.name = updateBody.name;
  if (updateBody.phone) customer.phone = updateBody.phone;
  if (updateBody.address !== undefined) customer.address = updateBody.address;
  if (updateBody.note !== undefined) customer.note = updateBody.note;

  await customer.save();
  return customer;
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
};
