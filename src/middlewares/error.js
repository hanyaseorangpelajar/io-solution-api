const httpStatus = require("http-status");
const { ApiError } = require("../utils");

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
  let { statusCode, message } = err;

  if (!(err instanceof ApiError) || !err.isOperational) {
    const originalMessage = message;
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Terjadi kesalahan internal pada server.";
    if (process.env.NODE_ENV === "development" && originalMessage) {
      message = originalMessage;
    }
    console.error(`[NON-API ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  const finalStatusCode =
    Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599
      ? statusCode
      : httpStatus.INTERNAL_SERVER_ERROR;

  if (process.env.NODE_ENV === "development") {
    console.error(
      `[ERROR] ${finalStatusCode} - ${message} (${req.method} ${req.originalUrl}) \n Stack: ${err.stack}`
    );
  } else {
    console.error(
      `[ERROR] ${finalStatusCode} - ${message} (${req.method} ${req.originalUrl})`
    );
  }

  const response = {
    status: "error",
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err.toString(),
    }),
  };

  if (res.headersSent) {
    return next(err);
  }
  res.status(finalStatusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
