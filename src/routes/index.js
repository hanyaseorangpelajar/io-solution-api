// src/routes/index.js
const { Router } = require("express");
const healthRoute = require("./health.route");
const ticketRoute = require("./ticket.route");
const auditRoute = require("./audit.route");

const router = Router();

router.use("/health", healthRoute);
router.use("/tickets", ticketRoute);
router.use("/audit", auditRoute);

module.exports = router;
