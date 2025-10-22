// src/middlewares/error.js
const httpStatus = require("http-status");
const { ApiError } = require("../utils/ApiError");

/**
 * Middleware untuk menangani rute yang tidak ditemukan (404).
 */
const notFound = (req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND, "Rute tidak ditemukan");
  next(error);
};

/**
 * Middleware penanganan error utama.
 */
const errorHandler = (err, req, res, next) => {
  // Ambil message & statusCode
  let message = err.message || "Terjadi kesalahan";
  let statusCode = err.statusCode || err.status || 500;

  // Pastikan statusCode valid integer antara 100–599
  if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
  }

  // Jika error bukan ApiError, bungkus jadi 500
  if (!(err instanceof ApiError)) {
    if (process.env.NODE_ENV === "production") {
      message = "Terjadi kesalahan pada server";
    }
  }

  // Log error ke konsol
  console.error(`[${req.method}] ${req.originalUrl} → ${statusCode}`, err);

  // Response JSON standar
  const response = {
    status: "error",
    message,
  };

  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  if (res.headersSent) return next(err);
  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
