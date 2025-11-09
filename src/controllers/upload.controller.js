const httpStatus = require("http-status");
const { catchAsync, ApiError } = require("../utils");

const handleUpload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Tidak ada file yang diunggah.");
  }

  const fileUrl = req.file.path.replace(/\\/g, "/").replace("public/", "/");

  res.status(httpStatus.CREATED).json({
    message: "File berhasil diunggah",
    url: fileUrl,
  });
});

module.exports = {
  handleUpload,
};
