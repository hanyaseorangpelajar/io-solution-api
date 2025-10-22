// src/routes/v1/report.route.js
const express = require("express");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.get("/ticket-summary", reportController.getTicketSummary);
router.get("/component-usage", reportController.getComponentUsage);
router.get("/common-issues", reportController.getCommonIssues);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Laporan dan Analitik Data (Agregasi)
 */
// ... (Swagger docs akan ditambahkan nanti)
