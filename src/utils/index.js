// Mengimpor semua utilitas dari file-filenya
const ApiError = require("./ApiError");
const catchAsync = require("./catchAsync");
const diff = require("./diff");
const dto = require("./dto");
const query = require("./query");

// Mengekspor ulang semuanya sebagai satu objek
module.exports = {
  ...ApiError,
  ...catchAsync,
  ...diff,
  ...dto,
  ...query,
};
