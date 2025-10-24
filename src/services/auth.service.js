const httpStatus = require("http-status");
const { User } = require("../models");
const { generateToken } = require("./token.service");
const { ApiError } = require("../utils");

/**
 * Registrasi pengguna baru
 * @param {object} userBody - Data pengguna (username, email, password, name, role)
 * @returns {Promise<User>} User object (tanpa password)
 */
const register = async (userBody) => {
  const { username, email, password, name, role } = userBody;

  if (!username || !email || !password || !name) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Username, Email, Password, dan Nama wajib diisi."
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
 * Login pengguna
 * @param {string} identifier - Bisa username atau email
 * @param {string} password
 * @returns {Promise<{user: object, token: string}>}
 */
const login = async (identifier, password) => {
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  }).select("+password +active");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Username/Email atau password salah."
    );
  }
  if (!user.active) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Akun Anda tidak aktif. Silakan hubungi administrator."
    );
  }

  const token = generateToken(user._id);

  return { user: user.toJSON(), token };
};

module.exports = {
  register,
  login,
};
