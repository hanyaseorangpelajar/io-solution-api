const express = require("express");

// Impor rute yang sudah ada
const componentRoutes = require("./component.route");
const healthRoutes = require("./health.route");
const knowledgeEntryRoutes = require("./knowledgeEntry.route");
const reportRoutes = require("./report.route");
const serviceTicketRoutes = require("./serviceTicket.route");
const userRoutes = require("./user.route");
const testRoutes = require("./test.route");

// Impor rute auth yang BARU
const authRoutes = require("./auth.route"); // <-- BARIS BARU

const router = express.Router();

// Daftarkan rute auth yang BARU
router.use("/auth", authRoutes); // <-- BARIS BARU

// Daftarkan rute-rute yang sudah ada
router.use("/components", componentRoutes);
router.use("/health", healthRoutes);
router.use("/knowledge", knowledgeEntryRoutes);
router.use("/reports", reportRoutes);
router.use("/tickets", serviceTicketRoutes);
router.use("/users", userRoutes);

// Daftarkan rute tes (jika Anda masih menggunakannya)
if (process.env.NODE_ENV !== "production") {
  router.use("/test", testRoutes);
}

module.exports = router;
