const express = require("express");

const authRoutes = require("./auth.route");
const healthRoutes = require("./health.route");
const kbEntryRoute = require("./kbEntry.route");
const serviceTicketRoute = require("./serviceTicket.route");
const testRoutes = require("./test.route");
const userRoutes = require("./user.route");
const customerRoute = require("./customer.route");
const uploadRoute = require("./upload.route");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/kb-entry", kbEntryRoute);
router.use("/tickets", serviceTicketRoute);
router.use("/users", userRoutes);
router.use("/customers", customerRoute);
router.use("/upload", uploadRoute);

if (process.env.NODE_ENV !== "production") {
  router.use("/test", testRoutes);
}

module.exports = router;
