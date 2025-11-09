const { Customer } = require("../models/customer.model");
const { parsePagination } = require("../utils");

/**
 * Mengambil daftar pelanggan dengan pagenisasi dan pencarian.
 */
const getCustomers = async (filter) => {
  const { page, limit, skip } = parsePagination(filter, 10);
  const safe = {};

  if (filter.q) {
    safe.$or = [
      { nama: { $regex: filter.q, $options: "i" } },
      { noHp: { $regex: filter.q, $options: "i" } },
    ];
  }

  const [results, totalResults] = await Promise.all([
    Customer.find(safe)
      .select("nama noHp dibuatPada diperbaruiPada")
      .sort({ nama: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(safe),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;

  return {
    results,
    page,
    limit,
    totalResults,
    totalPages,
  };
};

/**
 * Mengambil satu pelanggan berdasarkan ID.
 */
const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pelanggan tidak ditemukan");
  }
  return customer;
};

/**
 * Mengupdate pelanggan berdasarkan ID.
 * (Hanya field yang diizinkan: nama, noHp, alamat, catatan)
 */
const updateCustomer = async (customerId, updateBody) => {
  const customer = await getCustomerById(customerId);

  if (updateBody.noHp && updateBody.noHp !== customer.noHp) {
    const existing = await Customer.findOne({
      noHp: updateBody.noHp,
      _id: { $ne: customerId },
    });
    if (existing) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Nomor HP sudah digunakan oleh pelanggan lain."
      );
    }
  }

  if (updateBody.nama) customer.nama = updateBody.nama;
  if (updateBody.noHp) customer.noHp = updateBody.noHp;
  if (typeof updateBody.alamat === "string")
    customer.alamat = updateBody.alamat;
  if (typeof updateBody.catatan === "string")
    customer.catatan = updateBody.catatan;

  await customer.save();
  return customer;
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
};
