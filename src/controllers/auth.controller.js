const httpStatus = require("http-status");
const { register, login } = require("../services");

const { catchAsync, ApiError } = require("../utils");
const { get } = require("mongoose");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrasi pengguna baru
 * @access  Public
 */
const registerController = catchAsync(async (req, res) => {
  const user = await register(req.body);

  res.status(httpStatus.CREATED).json({
    message: "Registrasi berhasil",
    user,
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login pengguna
 * @access  Public
 */
const loginController = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Identifier (username/email) dan password wajib diisi."
    );
  }

  const getMeController = catchAsync(async (req, res) => {
    res.status(httpStatus.OK).json({
      user: req.user,
    });
  });

  const { user, token } = await login(identifier, password);

  res.status(httpStatus.OK).json({
    message: "Login berhasil",
    user,
    token,
  });
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get data pengguna yang sedang login
 * @access  Protected
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
