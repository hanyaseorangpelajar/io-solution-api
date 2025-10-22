const { User } = require("../models");
const { ApiError } = require("../utils");
const httpStatus = require("http-status");

/**
 * Membuat pengguna baru.
 * @param {Object} userBody - Data pengguna dari request body.
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isUsernameTaken(userBody.username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan");
  }
  return User.create(userBody);
};

/**
 * Mendapatkan semua pengguna dengan filter.
 * @param {Object} filter - Filter query Mongoose.
 * @returns {Promise<User[]>}
 */
const getUsers = async (filter) => {
  return User.find(filter);
};

/**
 * Mendapatkan satu pengguna berdasarkan ID.
 * @param {string} id - ID Pengguna.
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Memperbarui pengguna berdasarkan ID.
 * @param {string} userId - ID Pengguna.
 * @param {Object} updateBody - Data untuk pembaruan.
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  // Mencegah perubahan username jika ada di updateBody
  if (updateBody.username && updateBody.username !== user.username) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username tidak dapat diubah");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Menghapus pengguna berdasarkan ID.
 * @param {string} userId - ID Pengguna.
 * @returns {Promise<void>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  // Kita gunakan deleteOne() atau remove() pada instance Mongoose
  await user.deleteOne(); // atau user.remove() tergantung versi Mongoose
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
