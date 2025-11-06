const httpStatus = require("http-status");
const { User, ROLES } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat pengguna baru (oleh Admin).
 * @param {Object} userBody - Data pengguna (nama, username, password, role).
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const { nama, username, password, role } = userBody;

  if (!nama || !username || !password || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Nama, Username, Password, dan Role wajib diisi."
    );
  }
  if (!ROLES.includes(role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role tidak valid. Pilihan: ${ROLES.join(", ")}`
    );
  }

  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }

  const user = await User.create({
    nama,
    username,
    passwordHash: password,
    role,
  });
  return user;
};

/**
 * Mengambil daftar semua pengguna.
 */
const getUsers = async (filter) => {
  const safe = {};
  if (typeof filter?.statusAktif === "boolean")
    safe.statusAktif = filter.statusAktif;
  if (filter?.role) safe.role = filter.role;
  if (filter?.q) {
    safe.$or = [
      { nama: { $regex: filter.q, $options: "i" } },
      { username: { $regex: filter.q, $options: "i" } },
    ];
  }
  const page = Math.max(1, parseInt(filter?.page ?? 1, 10));
  const limit = Math.min(100, Math.max(1, parseInt(filter?.limit ?? 20, 10)));
  const skip = (page - 1) * limit;

  const [users, totalResults] = await Promise.all([
    User.find(safe).sort({ dibuatPada: -1 }).skip(skip).limit(limit),
    User.countDocuments(safe),
  ]);
  return {
    results: users,
    totalResults,
    page,
    limit,
  };
};

/**
 * Mengambil pengguna berdasarkan ID.
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  return user;
};

/**
 * Update pengguna berdasarkan ID (oleh Admin).
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (updateBody.nama) user.nama = updateBody.nama;
  if (updateBody.role) {
    if (!ROLES.includes(updateBody.role)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Role tidak valid. Pilihan: ${ROLES.join(", ")}`
      );
    }
    user.role = updateBody.role;
  }
  if (typeof updateBody.statusAktif === "boolean") {
    user.statusAktif = updateBody.statusAktif;
  }

  if (
    updateBody.username &&
    updateBody.username.toLowerCase() !== user.username
  ) {
    const newUsername = updateBody.username.toLowerCase();
    if (await User.isUsernameTaken(newUsername, userId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
    }
    user.username = newUsername;
  }

  if (updateBody.password) {
    user.passwordHash = updateBody.password;
  }

  await user.save();
  return user;
};

/**
 * Hapus pengguna berdasarkan ID.
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.deleteOne();
  return user;
};

/**
 * Update profil pengguna (oleh pengguna sendiri).
 */
const updateUserProfile = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (updateBody.nama) {
    user.nama = updateBody.nama;
  }

  await user.save();
  return user;
};

/**
 * Ganti password (oleh pengguna sendiri).
 */
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("passwordHash");

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Password saat ini tidak cocok."
    );
  }

  user.passwordHash = newPassword;
  await user.save();

  return user;
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  updateUserProfile,
  changeUserPassword,
};
