const httpStatus = require("http-status");
const { catchAsync } = require("../utils");

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout pengguna dan hapus cookie
 * @access  Public
 */
const logoutController = catchAsync(async (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  // Send a success response instead of a redirect
  res.status(httpStatus.OK).json({ message: "Logout successful" });
});

module.exports = logoutController;
