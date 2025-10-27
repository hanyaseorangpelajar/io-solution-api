const express = require("express");

const authRoutes = require("./auth.route");
const healthRoutes = require("./health.route");
const knowledgeEntryRoutes = require("./knowledgeEntry.route");
const partRoutes = require("./part.route");
const reportRoutes = require("./report.route");
const rmaRecordRoutes = require("./rmaRecord.route");
const ticketRoutes = require("./ticket.route");
const testRoutes = require("./test.route");
const userRoutes = require("./user.route");
const auditRoute = require("./auditRecord.route");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/knowledge", knowledgeEntryRoutes);
router.use("/parts", partRoutes);
router.use("/reports", reportRoutes);
router.use("/rma", rmaRecordRoutes);
router.use("/tickets", ticketRoutes);
router.use("/users", userRoutes);
router.use("/audits", auditRoute);

if (process.env.NODE_ENV !== "production") {
  router.use("/test", testRoutes);
}

module.exports = router;
