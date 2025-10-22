const jwt = require("jsonwebtoken");

// Pastikan Anda menambahkan variabel ini di file .env Anda!
// Jika belum ada, .env akan kita siapkan di langkah terakhir.
const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-rahasia-default";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // Token berlaku 7 hari

/**
 * Generate JWT token
 * @param {string} userId - ID pengguna dari Mongoose
 * @returns {string} Token JWT
 */
const generateToken = (userId) => {
  const payload = {
    sub: userId, // 'sub' (subject) adalah standar JWT untuk menyimpan ID user
    iat: Math.floor(Date.now() / 1000), // 'iat' (issued at)
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
    // Error ini bisa 'TokenExpiredError' atau 'JsonWebTokenError'
    throw new Error("Token tidak valid atau kedaluwarsa");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
