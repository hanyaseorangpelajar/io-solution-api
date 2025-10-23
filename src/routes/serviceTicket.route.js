const express = require("express");
const { serviceTicketController } = require("../controllers");
const { protect } = require("../middlewares");

const router = express.Router();

router.use(protect);

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
