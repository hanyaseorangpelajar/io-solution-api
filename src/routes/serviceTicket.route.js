// src/routes/v1/serviceTicket.route.js
const express = require("express");
const { serviceTicketController } = require("../../controllers");

const router = express.Router();

router
  .route("/")
  .post(serviceTicketController.createTicket)
  .get(serviceTicketController.getTickets);

router.route("/:id").get(serviceTicketController.getTicket);

router.route("/:id/assign").put(serviceTicketController.assignTicket);

router.route("/:id/diagnose").put(serviceTicketController.addDiagnosis);

router.route("/:id/action").put(serviceTicketController.addAction);

router.route("/:id/status").put(serviceTicketController.updateTicketStatus);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: ServiceTickets
 *   description: Manajemen Tiket Layanan (Core Workflow)
 */
// ... (Swagger docs akan ditambahkan nanti)
