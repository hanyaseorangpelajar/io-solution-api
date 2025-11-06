const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const { tokenService } = require("../services");
const { User } = require("../models");
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

    const decoded = await tokenService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    next(new ApiError(401, "Please authenticate"));
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
