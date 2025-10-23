const { verifyToken } = require("../services");
const { User } = require("../models");
const { ApiError, catchAsync } = require("../utils");

/**
 * Middleware untuk memverifikasi token JWT (Autentikasi)
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Akses ditolak. Silakan login.");
  }

  try {
    const payload = await verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "Pengguna tidak ditemukan.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error.message || "Token tidak valid atau kedaluwarsa."
    );
  }
});

/**
 * Middleware untuk memverifikasi peran pengguna (Otorisasi)
 * @param {string[]} roles - Array berisi peran yang diizinkan (e.g., ['Admin', 'SysAdmin'])
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "Anda tidak memiliki hak akses untuk melakukan aksi ini."
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
