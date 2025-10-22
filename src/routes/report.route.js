const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers dan middlewares
const { reportController } = require("../controllers");
const { protect, authorize } = require("../middlewares");
// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Laporan HANYA bisa diakses oleh Admin dan SysAdmin
router.use(protect);
router.use(authorize(["Admin", "SysAdmin"]));

// Rute-rute ini sekarang otomatis terproteksi
router.get("/ticket-summary", reportController.getTicketSummary);
router.get("/component-usage", reportController.getComponentUsage);
router.get("/common-issues", reportController.getCommonIssues);

module.exports = router;
