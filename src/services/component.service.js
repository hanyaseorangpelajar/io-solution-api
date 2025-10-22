const { Component } = require("../models");
const { ApiError } = require("../utils");
const httpStatus = require("http-status");

/**
 * Membuat komponen baru.
 * @param {Object} componentBody - Data komponen dari request body.
 * @returns {Promise<Component>}
 */
const createComponent = async (componentBody) => {
  return Component.create(componentBody);
};

/**
 * Mendapatkan semua komponen dengan filter.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<Component[]>}
 */
const getComponents = async (filter) => {
  return Component.find(filter);
};

/**
 * Mendapatkan satu komponen berdasarkan ID.
 * @param {string} id - ID Komponen.
 * @returns {Promise<Component>}
 */
const getComponentById = async (id) => {
  return Component.findById(id);
};

/**
 * Memperbarui komponen berdasarkan ID.
 * @param {string} componentId - ID Komponen.
 * @param {Object} updateBody - Data untuk pembaruan.
 * @returns {Promise<Component>}
 */
const updateComponentById = async (componentId, updateBody) => {
  const component = await getComponentById(componentId);
  if (!component) {
    throw new ApiError(httpStatus.NOT_FOUND, "Komponen tidak ditemukan");
  }
  Object.assign(component, updateBody);
  await component.save();
  return component;
};

/**
 * Menghapus komponen berdasarkan ID.
 * @param {string} componentId - ID Komponen.
 * @returns {Promise<void>}
 */
const deleteComponentById = async (componentId) => {
  const component = await getComponentById(componentId);
  if (!component) {
    throw new ApiError(httpStatus.NOT_FOUND, "Komponen tidak ditemukan");
  }
  await component.deleteOne();
};

module.exports = {
  createComponent,
  getComponents,
  getComponentById,
  updateComponentById,
  deleteComponentById,
};
