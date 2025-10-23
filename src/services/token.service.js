const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-rahasia-default";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token
 * @param {string} userId - ID pengguna dari Mongoose
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Promise<object>} Payload token (berisi 'sub' dan 'iat')
 */
const verifyToken = async (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    throw new Error("Token tidak valid atau kedaluwarsa");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
