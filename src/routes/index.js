// src/routes/index.js
const { Router } = require("express");
const healthRoute = require("./health.route");
const ticketRoute = require("./ticket.route");

const router = Router();

/**
 * Semua route v1 di-mount di sini
 */
router.use("/health", healthRoute);
router.use("/tickets", ticketRoute);

module.exports = router;
