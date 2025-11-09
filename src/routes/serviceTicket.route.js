const express = require("express");
const { serviceTicketController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    authorize(["Admin", "Teknisi"]),
    serviceTicketController.createTicketController
  )
  .get(
    authorize(["Admin", "Teknisi"]),
    serviceTicketController.getTicketsController
  );

router.get(
  "/history",
  authorize(["Admin", "Teknisi"]),
  serviceTicketController.getGlobalHistoryController
);

router.patch(
  "/:id/status",
  authorize(["Teknisi"]),
  serviceTicketController.updateStatusController
);

router.post(
  "/:id/items",
  authorize(["Admin", "Teknisi"]),
  serviceTicketController.addItemController
);

router.post(
  "/:id/complete-teknisi",
  authorize(["Teknisi"]),
  serviceTicketController.completeByTeknisiController
);

router.post(
  "/:id/complete",
  authorize(["Admin"]),
  serviceTicketController.completeTicketController
);

router.patch(
  "/:id/assign",
  authorize(["Admin"]),
  serviceTicketController.assignTicketController
);

router
  .route("/:id")
  .get(
    authorize(["Admin", "Teknisi"]),
    serviceTicketController.getTicketController
  );

module.exports = router;
