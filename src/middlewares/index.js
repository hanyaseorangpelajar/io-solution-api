const { protect, authorize } = require("./auth.middleware");
const { notFound, errorHandler } = require("./error");

module.exports = {
  protect,
  authorize,
  notFound,
  errorHandler,
};
