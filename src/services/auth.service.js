const { User } = require("../models");
const tokenService = require("./token.service");
const { ApiError } = require("../utils");
const httpStatus = require("http-status");

/**
 * Registrasi pengguna baru
 * @param {object} userBody - Data pengguna (username, email, password, name, role)
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  const { username, email, password, name, role } = userBody;

  if (!username || !email || !password || !name) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Semua field wajib diisi (username, email, password, name)"
    );
  }

  if (await User.isUsernameTaken(username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan");
  }

  if (await User.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email sudah digunakan");
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
  let user;
  if (identifier.includes("@")) {
    user = await User.findOne({ email: identifier }).select("+password");
  } else {
    user = await User.findOne({ username: identifier }).select("+password");
  }

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Username/Email atau password salah"
    );
  }

  const token = tokenService.generateToken(user._id);

  const userObject = user.toJSON();

  return { user: userObject, token };
};

module.exports = {
  register,
  login,
};
