const httpStatus = require("http-status");
const { User } = require("../models/user.model");
const { generateToken } = require("./token.service");
const { ApiError } = require("../utils");
const { LoginAttempt } = require("../models/loginAttempt.model");

/**
 * Registrasi pengguna baru (Admin)
 * @param {object} userBody - Data pengguna (nama, username, password, role)
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  const { nama, username, password, role } = userBody;
  const normalizedUsername = (username || "").toLowerCase();

  if (!nama || !normalizedUsername || !password || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Nama, Username, Password, dan Role wajib diisi."
    );
  }

  if (await User.isUsernameTaken(normalizedUsername)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }

  const user = await User.create({
    nama,
    username: normalizedUsername,
    passwordHash: password,
    role,
  });

  return user;
};

/**
 * Login pengguna
 * @param {string} username - Hanya username
 * @param {string} password
 * @returns {Promise<{user: object, token: string}>}
 */
const login = async (username, password) => {
  const uname = (username || "").toLowerCase();
  const user = await User.findOne({ username: uname }).select(
    "+passwordHash +statusAktif"
  );

  if (!user || !(await user.comparePassword(password))) {
    await LoginAttempt.create({ usernameAttempt: uname, success: false });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Username atau password salah."
    );
  }

  if (!user.statusAktif) {
    throw new ApiError(httpStatus.FORBIDDEN, "Akun Anda telah dinonaktifkan.");
  }

  const token = generateToken(user.id);

  await LoginAttempt.create({
    user: user.id,
    usernameAttempt: uname,
    success: true,
  });

  return { user, token };
};

module.exports = {
  register,
  login,
};
