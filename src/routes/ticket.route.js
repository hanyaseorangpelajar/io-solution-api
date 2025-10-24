const express = require("express");
const { ticketController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(ticketController.getTickets)
  .post(authorize(["Admin", "SysAdmin"]), ticketController.createTicket);

router.route("/:id").get(ticketController.getTicket);

router.put(
  "/:id/assign",
  authorize(["Admin", "SysAdmin"]),
  ticketController.assignTicket
);
router.put("/:id/diagnose", ticketController.addDiagnosis);
router.put("/:id/action", ticketController.addAction);

router.put("/:id/resolve", ticketController.resolveTicket);

router.put(
  "/:id/status",
  authorize(["Admin", "SysAdmin"]),
  ticketController.updateTicketStatus
);

module.exports = router;

/**
 * @swagger (Perlu diupdate)
 * tags:
 * name: Tickets
 * description: Manajemen Tiket Layanan
 */
