const httpStatus = require("http-status");
const { User } = require("../models/user.model");
const { generateToken } = require("./token.service");
const { ApiError } = require("../utils");
const { LoginAttempt } = require("../models/loginAttempt.model");

const register = async (userBody) => {
  const { name, username, password, role } = userBody;
  const normalizedUsername = (username || "").toLowerCase();

  if (!name || !normalizedUsername || !password || !role) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Nama, Username, Password, dan Role wajib diisi.",
    );
  }

  if (await User.isUsernameTaken(normalizedUsername)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username sudah digunakan.");
  }

  const user = await User.create({
    name,
    username: normalizedUsername,
    passwordHash: password,
    role,
  });

  return user;
};

const login = async (username, password, req) => {
  const uname = (username || "").toLowerCase();

  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  const user = await User.findOne({ username: uname }).select(
    "+passwordHash +isActive",
  );

  if (!user || !(await user.comparePassword(password))) {
    await LoginAttempt.create({
      usernameAttempt: uname,
      success: false,
      ip: ip,
      userAgent: userAgent,
    });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Username atau password salah.",
    );
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Akun Anda telah dinonaktifkan.");
  }

  const token = generateToken(user.id);

  await LoginAttempt.create({
    user: user.id,
    usernameAttempt: uname,
    success: true,
    ip: ip,
    userAgent: userAgent,
  });

  return { user, token };
};

module.exports = {
  register,
  login,
};
