const express = require("express");
const router = express.Router();
require("express-async-errors");

const {
  User,
  Ticket,
  Part,
  KnowledgeEntry,
  AuditRecord,
  RmaRecord,
  StockMovement,
} = require("../models");

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
      const r = await User.deleteMany({});
      results.users = `${r.deletedCount} dihapus`;
    }
    if (Ticket) {
      const r = await Ticket.deleteMany({});
      results.tickets = `${r.deletedCount} dihapus`;
    }
    if (Part) {
      const r = await Part.deleteMany({});
      results.parts = `${r.deletedCount} dihapus`;
    }
    if (KnowledgeEntry) {
      const r = await KnowledgeEntry.deleteMany({});
      results.knowledgeEntries = `${r.deletedCount} dihapus`;
    }
    if (AuditRecord) {
      const r = await AuditRecord.deleteMany({});
      results.auditRecords = `${r.deletedCount} dihapus`;
    }
    if (RmaRecord) {
      const r = await RmaRecord.deleteMany({});
      results.rmaRecords = `${r.deletedCount} dihapus`;
    }
    if (StockMovement) {
      const r = await StockMovement.deleteMany({});
      results.stockMovements = `${r.deletedCount} dihapus`;
    }

    res.status(200).json({ message: "Database collections cleared!", results });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting database", error: error.message });
  }
});

module.exports = router;
