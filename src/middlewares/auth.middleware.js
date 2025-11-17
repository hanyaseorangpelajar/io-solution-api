const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { tokenService } = require("../services");
const { User } = require("../models/user.model"); // <-- TAMBAHKAN IMPORT USER
const httpStatus = require("http-status-codes");

/**
 * Middleware untuk memverifikasi token JWT (Autentikasi) - Protect Route
 */
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Please authenticate");
    }

    // 1. Verifikasi token untuk mendapatkan payload { sub: userId, ... }
    const decoded = await tokenService.verifyToken(token);

    // 2. --- PERBAIKAN DI SINI ---
    // Ambil user dari DB berdasarkan ID di dalam token
    const user = await User.findById(decoded.sub);

    // 3. Cek jika user ada dan aktif
    if (!user || !user.statusAktif) {
      throw new ApiError(
        401,
        "User not found or disabled. Please authenticate"
      );
    }

    // 4. Lampirkan OBJEK USER LENGKAP ke request, bukan payload token
    req.user = user;
    // --- AKHIR PERBAIKAN ---

    next();
  } catch (error) {
    // Tangkap error kustom dari verifyToken atau findById
    const statusCode = error.statusCode || 401;
    const message = error.message || "Please authenticate";
    next(new ApiError(statusCode, message));
  }
};

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
    // req.user sekarang adalah objek User utuh
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
