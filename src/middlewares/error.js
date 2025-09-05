// src/middlewares/error.js

function notFound(req, res, next) {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
  });
}

function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  const code = res.statusCode !== 200 ? res.statusCode : 500;
  const isProd = (process.env.NODE_ENV || "development") === "production";

  console.error("🔴 Error:", err);

  res.status(code).json({
    status: "error",
    message: err.message || "Internal Server Error",
    ...(isProd ? null : { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
