const { verifyToken } = require("../services");
const { User } = require("../models");
const { ApiError, catchAsync } = require("../utils");
const httpStatus = require("http-status-codes");

/**
 * Middleware untuk memverifikasi token JWT (Autentikasi) - Protect Route
 */
const protect = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Akses ditolak. Token tidak ditemukan."
    );
  }

  try {
    const payload = await verifyToken(token);

    const user = await User.findById(payload.sub).select("-password");

    if (!user) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Pengguna pemilik token ini tidak lagi ditemukan."
      );
    }
    if (!user.active) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Akun pengguna ini tidak aktif."
      );
    }

    req.user = user;

    next();
  } catch (error) {
    const statusCode =
      error instanceof ApiError ? error.statusCode : httpStatus.UNAUTHORIZED;
    const message =
      error.message || "Token tidak valid atau terjadi kesalahan autentikasi.";
    throw new ApiError(statusCode, message);
  }
});

/**
 * Middleware untuk memverifikasi peran pengguna (Otorisasi)
 * HARUS dijalankan SETELAH middleware 'protect'.
 * @param {string[]} requiredRoles - Array berisi nama peran (case-sensitive) yang diizinkan.
 */
const authorize = (requiredRoles = []) => {
  const rolesToCheck = Array.isArray(requiredRoles)
    ? requiredRoles
    : [requiredRoles];

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Data pengguna tidak ditemukan setelah autentikasi."
      );
    }

    if (!rolesToCheck.includes(req.user.role)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        `Akses ditolak. Hanya role berikut yang diizinkan: ${rolesToCheck.join(
          ", "
        )}.`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
