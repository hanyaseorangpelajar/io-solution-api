const express = require("express");
const router = express.Router();
require("express-async-errors");

const { User, ServiceTicket, Component, KnowledgeEntry } = require("../models");

/**
 * @route   POST /api/test/reset-db
 * @desc    (DEV ONLY) Menghapus semua data dari koleksi utama untuk testing
 * @access  Public (Hanya di environment non-production)
 */
router.post("/reset-db", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res
      .status(403)
      .json({ message: "Operasi ini dilarang di production." });
  }

  try {
    const results = {};

    if (User) {
      const userRes = await User.deleteMany({});
      results.users = `${userRes.deletedCount} dihapus`;
    }
    if (ServiceTicket) {
      const ticketRes = await ServiceTicket.deleteMany({});
      results.serviceTickets = `${ticketRes.deletedCount} dihapus`;
    }
    if (Component) {
      const compRes = await Component.deleteMany({});
      results.components = `${compRes.deletedCount} dihapus`;
    }
    if (KnowledgeEntry) {
      const keRes = await KnowledgeEntry.deleteMany({});
      results.knowledgeEntries = `${keRes.deletedCount} dihapus`;
    }

    res.status(200).json({ message: "Database collections cleared!", results });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting database", error: error.message });
  }
});

module.exports = router;
