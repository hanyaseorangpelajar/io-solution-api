// --- PERBAIKAN ---
// Impor fungsi langsung dari barrel services dan utils
const { register, login } = require("../services");
const { catchAsync } = require("../utils");
// --- AKHIR PERBAIKAN ---

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrasi pengguna baru
 * @access  Public
 */
const registerController = catchAsync(async (req, res) => {
  // Panggil fungsi register langsung
  const user = await register(req.body);

  // Kirim respons
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

  // Panggil fungsi login langsung
  const { user, token } = await login(username, password);

  // Kirim respons
  res.status(200).json({
    message: "Login berhasil",
    user,
    token,
  });
});

module.exports = {
  // Ganti nama agar tidak konflik dengan fungsi service
  register: registerController,
  login: loginController,
};
