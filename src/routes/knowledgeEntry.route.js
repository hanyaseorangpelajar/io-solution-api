// src/routes/v1/knowledgeEntry.route.js
const express = require("express");
const knowledgeEntryController = require("../controllers/knowledgeEntry.controller");

const router = express.Router();

router
  .route("/")
  .post(knowledgeEntryController.createKnowledgeEntry)
  .get(knowledgeEntryController.getKnowledgeEntries);

router.route("/drafts").get(knowledgeEntryController.getDraftKnowledgeEntries);

router
  .route("/from-ticket/:ticketId")
  .post(knowledgeEntryController.createFromTicket);

router.route("/:id").get(knowledgeEntryController.getKnowledgeEntry);

router.route("/:id/publish").put(knowledgeEntryController.publishEntry);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: KnowledgeBase
 *   description: Manajemen Basis Pengetahuan (KMS)
 */
// ... (Swagger docs akan ditambahkan nanti)
