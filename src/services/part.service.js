const httpStatus = require("http-status");
const { Part, PART_CATEGORIES } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat part baru.
 * @param {Object} partBody - Data part dari request body.
 * @returns {Promise<Part>}
 */
const createPart = async (partBody) => {
  if (partBody.category && !PART_CATEGORIES.includes(partBody.category)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Kategori '${partBody.category}' tidak valid.`
    );
  }
  return Part.create(partBody);
};

/**
 * Mendapatkan semua parts dengan filter dan sorting.
 * @param {Object} filter - Filter query Mongoose (misal { category: 'ram' }).
 * @returns {Promise<Part[]>}
 */
const getParts = async (filter) => {
  return Part.find(filter).sort({ name: 1 });
};

/**
 * Mendapatkan satu part berdasarkan ID.
 * @param {string} id - ID Part.
 * @returns {Promise<Part>}
 */
const getPartById = async (id) => {
  return Part.findById(id);
};

/**
 * Memperbarui part berdasarkan ID.
 * @param {string} partId - ID Part.
 * @param {Object} updateBody - Data untuk pembaruan.
 * @returns {Promise<Part>}
 */
const updatePartById = async (partId, updateBody) => {
  const part = await getPartById(partId);
  if (!part) {
    throw new ApiError(httpStatus.NOT_FOUND, "Part tidak ditemukan");
  }
  if (updateBody.category && !PART_CATEGORIES.includes(updateBody.category)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Kategori '${updateBody.category}' tidak valid.`
    );
  }

  Object.assign(part, updateBody);
  await part.save();
  return part;
};

/**
 * Menghapus part berdasarkan ID.
 * @param {string} partId - ID Part.
 * @returns {Promise<void>}
 */
const deletePartById = async (partId) => {
  const part = await getPartById(partId);
  if (!part) {
    throw new ApiError(httpStatus.NOT_FOUND, "Part tidak ditemukan");
  }
  await part.deleteOne();
};

module.exports = {
  createPart,
  getParts,
  getPartById,
  updatePartById,
  deletePartById,
};
