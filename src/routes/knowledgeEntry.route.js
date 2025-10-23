const express = require("express");
const { knowledgeEntryController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router.get("/", knowledgeEntryController.getKnowledgeEntries);
router.get("/:id", knowledgeEntryController.getKnowledgeEntry);

router.get(
  "/drafts",
  authorize(["Admin", "SysAdmin"]),
  knowledgeEntryController.getDraftKnowledgeEntries
);

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
