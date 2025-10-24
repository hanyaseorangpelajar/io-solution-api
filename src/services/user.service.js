const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { User, ROLES } = require("../models");
const { ApiError } = require("../utils");

/**
 * Membuat pengguna baru (oleh SysAdmin).
 * @param {Object} userBody - Data pengguna (username, email, password, name, role).
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const { username, email, password, name, role } = userBody;

  if (!username || !email || !password || !name || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Username, Email, Password, Nama, dan Role wajib diisi."
    );
  }
  if (!ROLES.includes(role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role '${role}' tidak valid. Pilihan: ${ROLES.join(", ")}`
    );
  }

  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }
  if (await User.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email sudah digunakan.");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName: name,
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
  const queryFilter = { active: true, ...filter };
  if (filter.active === "all" || filter.active === false) {
    delete queryFilter.active;
    if (filter.active === false) queryFilter.active = false;
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

  const allowedUpdates = [
    "fullName",
    "role",
    "active",
    "phone",
    "department",
    "avatarUrl",
  ];
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
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);

  if (!user.active) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Pengguna ini sudah tidak aktif."
    );
  }
  user.active = false;
  await user.save();
  console.log(`User ${user.username} (ID: ${userId}) dinonaktifkan.`);
  return user;
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
    "phone",
    "department",
    "avatarUrl",
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
