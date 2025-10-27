const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { User, ROLES } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat pengguna baru (oleh SysAdmin).
 * @param {Object} userBody - Data pengguna (username, email, password, name, role).
 * @returns {Promise<User>}
 */

/**
 * Membuat pengguna baru (oleh SysAdmin).
 * @param {Object} userBody - Data pengguna (username, email, password, fullName, role). // <-- (Doc diperbarui)
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const { username, email, password, fullName, role } = userBody;

  if (!username || !email || !password || !fullName || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Username, Email, Password, Nama Lengkap, dan Role wajib diisi."
    );
  }
  if (!ROLES.includes(role)) {
  }

  if (await User.isUsernameTaken(username)) {
  }
  if (await User.isEmailTaken(email)) {
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    role,
  });
  return user;
};

/**
 * Mendapatkan semua pengguna dengan filter.
 * @param {Object} filter - Filter query Mongoose (misal { role: 'Teknisi', active: true }).
 * @param {Object} options - Opsi query (limit, skip, sort).
 * @returns {Promise<{results: User[], totalResults: number}>}
 */
const getUsers = async (filter, options = {}) => {
  // Mulai dengan filter yang masuk, TANPA default { active: true }
  const queryFilter = { ...filter };

  // Logika filter baru:
  // Jika 'all' atau 'undefined' (default), hapus filter 'active' = tampilkan semua.
  if (filter.active === "all" || filter.active === undefined) {
    delete queryFilter.active;
  } else {
    // Jika 'true' atau 'false', terapkan filter tersebut.
    queryFilter.active = filter.active;
  }

  const { limit = 10, skip = 0, sort = { fullName: 1 } } = options;

  const users = await User.find(queryFilter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalResults = await User.countDocuments(queryFilter);

  const results = users.map((user) => {
    user.id = user._id.toString();
    user.name = user.fullName;
    delete user._id;
    delete user.fullName;
    delete user.__v;
    delete user.password;
    return user;
  });

  return { results, totalResults };
};

/**
 * Mendapatkan satu pengguna berdasarkan ID.
 * @param {string} id - ID Pengguna.
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID Pengguna tidak valid.");
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  return user;
};

/**
 * Memperbarui pengguna berdasarkan ID (oleh SysAdmin).
 * @param {string} userId - ID Pengguna.
 * @param {Object} updateBody - Data untuk pembaruan (misal { fullName, role, active }).
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  const allowedUpdates = ["fullName", "role", "active"];
  const filteredUpdateBody = {};
  Object.keys(updateBody).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      filteredUpdateBody[key] = updateBody[key];
    }
  });

  if (filteredUpdateBody.role && !ROLES.includes(filteredUpdateBody.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role '${filteredUpdateBody.role}' tidak valid.`
    );
  }
  if (
    filteredUpdateBody.active !== undefined &&
    typeof filteredUpdateBody.active !== "boolean"
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Field 'active' harus boolean.");
  }

  Object.assign(user, filteredUpdateBody);
  await user.save();
  return user;
};

/**
 * Menghapus pengguna berdasarkan ID (oleh SysAdmin).
 * Sebaiknya soft delete (set active=false) daripada hard delete.
 * @param {string} userId - ID Pengguna.
 * @returns {Promise<User>} User yang dinonaktifkan
 */
// src/services/user.service.js
const deleteUserById = async (userId) => {
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }

  console.log(`User ${user.username} (ID: ${userId}) telah DIHAPUS.`);
  return user; // Controller akan mengirim 204 jadi ini tidak masalah
};

/**
 * Memperbarui profil dan pengaturan pengguna yang sedang login.
 * @param {string} userId - ID pengguna dari req.user.
 * @param {Object} updateBody - Data untuk pembaruan (name, email, phone, department, avatarUrl, settings).
 * @returns {Promise<User>}
 */
const updateUserProfile = async (userId, updateBody) => {
  const user = await getUserById(userId).select(
    "+securitySettings +notificationSettings"
  );

  const allowedUpdates = [
    "name",
    "email",
    "securitySettings",
    "notificationSettings",
  ];

  const filteredUpdateBody = {};
  Object.keys(updateBody).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      if (key === "name") {
        filteredUpdateBody["fullName"] = updateBody[key];
      } else {
        if (key === "securitySettings" || key === "notificationSettings") {
          if (!user[key]) user[key] = {};
          Object.assign(user[key], updateBody[key]);
        } else {
          filteredUpdateBody[key] = updateBody[key];
        }
      }
    }
  });

  if (filteredUpdateBody.email && filteredUpdateBody.email !== user.email) {
    if (await User.isEmailTaken(filteredUpdateBody.email, userId)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Email sudah digunakan oleh pengguna lain."
      );
    }
    user.email = filteredUpdateBody.email;
  }

  Object.keys(filteredUpdateBody).forEach((key) => {
    if (
      key !== "email" &&
      key !== "securitySettings" &&
      key !== "notificationSettings"
    ) {
      user[key] = filteredUpdateBody[key];
    }
  });

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
};
