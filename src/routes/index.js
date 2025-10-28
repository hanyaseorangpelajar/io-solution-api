const express = require("express");

const auditRoute = require("./auditRecord.route");
const authRoutes = require("./auth.route");
const healthRoutes = require("./health.route");
const knowledgeEntryRoutes = require("./knowledgeEntry.route");
const partRoutes = require("./part.route");
const reportRoutes = require("./report.route");
const rmaRecordRoutes = require("./rmaRecord.route");
const stockMovementRoute = require("./stockMovement.route");
const testRoutes = require("./test.route");
const ticketRoutes = require("./ticket.route");
const userRoutes = require("./user.route");

const router = express.Router();

router.use("/audits", auditRoute);
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/knowledge", knowledgeEntryRoutes);
router.use("/parts", partRoutes);
router.use("/reports", reportRoutes);
router.use("/rma", rmaRecordRoutes);
router.use("/stock-movements", stockMovementRoute);
router.use("/tickets", ticketRoutes);
router.use("/users", userRoutes);

if (process.env.NODE_ENV !== "production") {
  router.use("/test", testRoutes);
}

module.exports = router;
