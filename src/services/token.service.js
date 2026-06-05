const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const { ApiError } = require("../utils");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("JWT_SECRET harus di-set di production");
      })()
    : "rahasia-super-rahasia-default");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

/**
 * Generate JWT token
 * @param {string} userId - ID pengguna dari Mongoose
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
  if (!userId) {
    throw new Error("UserId diperlukan untuk generate token.");
  }
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token and return payload
 * @param {string} token
 * @returns {Promise<object>} Payload token (berisi 'sub' dan 'iat', 'exp')
 * @throws {ApiError} Jika token tidak valid atau kedaluwarsa
 */
const verifyToken = async (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Token telah kedaluwarsa, silakan login kembali."
      );
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Token tidak valid.");
    }
    console.error("Unexpected error verifying token:", error);
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Token tidak dapat diverifikasi."
    );
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
