const { User } = require("../models");
const tokenService = require("./token.service");
const { ApiError } = require("../utils");

/**
 * Registrasi pengguna baru
 * @param {object} userBody - Data pengguna (username, password, fullName, role)
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  // Cek jika username sudah ada (method ini ada di user.model.js)
  if (await User.isUsernameTaken(userBody.username)) {
    throw new ApiError(400, "Username sudah digunakan");
  }

  // User.create() akan otomatis menjalankan hook pre-save di user.model.js
  // yang akan menghash password secara otomatis.
  const user = await User.create(userBody);
  return user;
};

/**
 * Login pengguna
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{user: object, token: string}>}
 */
const login = async (username, password) => {
  // Kita perlu .select('+password') karena di model kita set 'private: true'
  const user = await User.findOne({ username }).select("+password");

  // Cek jika user ada DAN password-nya cocok (menggunakan method comparePassword)
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Username atau password salah");
  }

  // Jika sukses, buatkan token
  const token = tokenService.generateToken(user._id);

  // user.toJSON() akan otomatis menghapus password berkat setting di model
  const userObject = user.toJSON();

  return { user: userObject, token };
};

module.exports = {
  register,
  login,
};
