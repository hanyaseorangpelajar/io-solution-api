const express = require("express");
const { auditRecordController } = require("../controllers"); // Asumsi diekspor sbg 'auditRecordController'
const { protect, authorize } = require("../middlewares");

const router = express.Router();

// Lindungi semua rute di bawah ini
router.use(protect);

// Rute utama untuk mengambil log audit
// Kita batasi untuk Admin/SysAdmin
router.get(
  "/",
  authorize(["Admin", "SysAdmin"]),
  auditRecordController.getAuditRecords
);

module.exports = router;
