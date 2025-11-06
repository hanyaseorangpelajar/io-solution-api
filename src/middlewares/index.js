const { protect, authorize } = require("./auth.middleware");
// Impor error handler dari file error.js
const { notFound, errorHandler } = require("./error.js");

module.exports = {
  protect,
  authorize,
  notFound, // Ekspor notFound
  errorHandler, // Ekspor errorHandler
};
