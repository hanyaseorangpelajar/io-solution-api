const express = require("express");
const { reportController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);
router.use(authorize(["Admin", "SysAdmin"]));

router.get("/ticket-summary", reportController.getTicketSummary);
router.get("/inventory-summary", reportController.getInventorySummary);
router.get("/part-usage", reportController.getPartUsage);
router.get("/common-issues", reportController.getCommonIssues);
router.get(
  "/dashboard-summary",
  // authMiddleware, // <-- Aktifkan ini jika admin harus login
  reportController.getDashboardSummary // <-- Memanggil controller baru kita
);

module.exports = router;
