const httpStatus = require("http-status");
const { register, login } = require("../services");
const { catchAsync, ApiError } = require("../utils");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrasi pengguna baru (oleh Admin)
 */
const registerController = catchAsync(async (req, res) => {
  const userBody = {
    nama: req.body.name || req.body.nama || req.body.fullName,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  };

  const user = await register(userBody);
  res.status(httpStatus.CREATED).json({
    message: "Registrasi berhasil",
    user,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login pengguna
 */
const loginController = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Username dan password wajib diisi."
    );
  }

  const { user, token } = await login(username, password);

  res.status(httpStatus.OK).json({
    message: "Login berhasil",
    user,
    token,
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Mendapatkan info user yang sedang login
 */
const getMeController = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    user: req.user,
  });
});

module.exports = {
  register: registerController,
  login: loginController,
  getMe: getMeController,
};
