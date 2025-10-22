const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers dan middlewares
const { knowledgeEntryController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Terapkan 'protect' ke SEMUA rute di file ini
router.use(protect);

// GET bisa untuk semua role
router.get("/", knowledgeEntryController.getKnowledgeEntries);
router.get("/:id", knowledgeEntryController.getKnowledgeEntry);

// GET /drafts hanya untuk Admin/SysAdmin
router.get(
  "/drafts",
  authorize(["Admin", "SysAdmin"]),
  knowledgeEntryController.getDraftKnowledgeEntries
);

// POST dan PUT (create/publish) hanya untuk Admin/SysAdmin
router.post(
  "/",
  authorize(["Admin", "SysAdmin"]),
  knowledgeEntryController.createKnowledgeEntry
);
router.post(
  "/from-ticket/:ticketId",
  authorize(["Admin", "SysAdmin"]),
  knowledgeEntryController.createFromTicket
);
router.put(
  "/:id/publish",
  authorize(["Admin", "SysAdmin"]),
  knowledgeEntryController.publishEntry
);

module.exports = router;
