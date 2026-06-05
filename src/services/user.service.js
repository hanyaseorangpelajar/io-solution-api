const httpStatus = require("http-status");
const { User, ROLES } = require("../models/user.model");
const { ApiError, parsePagination } = require("../utils");
const { LoginAttempt } = require("../models/loginAttempt.model");

const createUser = async (userBody) => {
  const { name, username, password, role } = userBody;

  if (!name || !username || !password || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Name, Username, Password, dan Role wajib diisi.",
    );
  }
  if (!ROLES.includes(role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role tidak valid. Pilihan: ${ROLES.join(", ")}`,
    );
  }

  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }

  const user = await User.create({
    name,
    username,
    passwordHash: password,
    role,
    isActive: userBody.isActive ?? true,
  });

  return user;
};

const getUsers = async (filter) => {
  const { page, limit, skip } = parsePagination(filter, 10);
  const safe = {};

  if (filter.q) {
    safe.$or = [
      { name: { $regex: filter.q, $options: "i" } },
      { username: { $regex: filter.q, $options: "i" } },
    ];
  }

  if (filter.role && filter.role !== "all") {
    safe.role = filter.role;
  }
  if (filter.isActive !== undefined && filter.isActive !== "all") {
    safe.isActive = filter.isActive === "true" || filter.isActive === true;
  }

  const [results, totalResults] = await Promise.all([
    User.find(safe).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(safe),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;

  return { results, page, limit, totalResults, totalPages };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  return user;
};

const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (
    updateBody.username &&
    (await User.isUsernameTaken(updateBody.username, userId))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }

  if (updateBody.name) user.name = updateBody.name;
  if (updateBody.username) user.username = updateBody.username;
  if (updateBody.role) user.role = updateBody.role;
  if (updateBody.password) user.passwordHash = updateBody.password;
  if (updateBody.isActive !== undefined) user.isActive = updateBody.isActive;

  await user.save();
  return user;
};

const updateUserProfile = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (updateBody.name) {
    user.name = updateBody.name;
  }
  await user.save();
  return user;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user)
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch)
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Password saat ini tidak cocok.",
    );

  user.passwordHash = newPassword;
  await user.save();
  return user;
};

const getLoginHistoryByUserId = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query, 10);
  const queryFilter = { user: userId };

  const [logs, totalResults] = await Promise.all([
    LoginAttempt.find(queryFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginAttempt.countDocuments(queryFilter),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;
  return { results: logs, page, limit, totalResults, totalPages };
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  await user.deleteOne();
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
  getLoginHistoryByUserId,
};
