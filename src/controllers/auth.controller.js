const { register, login } = require("../services");
const { catchAsync } = require("../utils");

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrasi pengguna baru
 * @access  Public
 */
const registerController = catchAsync(async (req, res) => {
  const user = await register(req.body);

  res.status(201).json({
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
  const { username, password } = req.body;

  const { user, token } = await login(username, password);

  res.status(200).json({
    message: "Login berhasil",
    user,
    token,
  });
});

module.exports = {
  register: registerController,
  login: loginController,
};
