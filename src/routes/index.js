const authRoutes = require("./auth.route");
const express = require("express");
const healthRoutes = require("./health.route");
const knowledgeEntryRoutes = require("./knowledgeEntry.route");
const partRoutes = require("./part.route");
const reportRoutes = require("./report.route");
const rmaRecordRoutes = require("./rmaRecord.route");
const router = express.Router();
const serviceTicketRoutes = require("./serviceTicket.route");
const testRoutes = require("./test.route");
const userRoutes = require("./user.route");

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/knowledge", knowledgeEntryRoutes);
router.use("/parts", partRoutes);
router.use("/reports", reportRoutes);
router.use("/rma", rmaRecordRoutes);
router.use("/tickets", serviceTicketRoutes);
router.use("/users", userRoutes);

if (process.env.NODE_ENV !== "production") {
  router.use("/test", testRoutes);
}

module.exports = router;
