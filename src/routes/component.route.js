const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers dan middlewares
const { componentController } = require("../controllers");
const { protect, authorize } = require("../middlewares");
// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Terapkan 'protect' ke SEMUA rute di file ini
router.use(protect);

// Rute di bawah ini bisa diakses oleh SEMUA ROLE yang sudah login
router.get("/", componentController.getComponents);
router.get("/:id", componentController.getComponent);

// Rute di bawah ini HANYA bisa diakses oleh 'Admin' dan 'SysAdmin'
router.post(
  "/",
  authorize(["Admin", "SysAdmin"]),
  componentController.createComponent
);
router.put(
  "/:id",
  authorize(["Admin", "SysAdmin"]),
  componentController.updateComponent
);
router.delete(
  "/:id",
  authorize(["Admin", "SysAdmin"]),
  componentController.deleteComponent
);

module.exports = router;
