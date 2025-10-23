const { Part } = require("../models");
const { ApiError } = require("../utils");
const httpStatus = require("http-status");

/**
 * Membuat part baru.
 * @param {Object} partBody - Data part dari request body.
 * @returns {Promise<Part>}
 */
const createPart = async (partBody) => {
  return Part.create(partBody);
};

/**
 * Mendapatkan semua parts dengan filter.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<Part[]>}
 */
const getParts = async (filter) => {
  return Part.find(filter);
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
