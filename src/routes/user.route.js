const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers dan middlewares
const { userController } = require("../controllers");
const { protect, authorize } = require("../middlewares");
// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Terapkan middleware 'protect' dan 'authorize' ke SEMUA rute di file ini
router.use(protect);
router.use(authorize(["SysAdmin"]));

// Rute-rute ini sekarang otomatis terproteksi
router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
// (Saya tambahkan delete route yang sepertinya kurang di file Anda sebelumnya)
router.delete("/:id", userController.deleteUser);

module.exports = router;
