const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers
const { authController } = require("../controllers");
// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Rute-rute ini publik (tidak perlu 'protect')
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
