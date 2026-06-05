const express = require("express");
const { serviceTicketController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    serviceTicketController.createTicketController,
  )
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    serviceTicketController.getTicketsController,
  );

router.get(
  "/history",
  authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
  serviceTicketController.getGlobalHistoryController,
);

router.patch(
  "/:id/status",
  authorize(["TEKNISI"]),
  serviceTicketController.updateStatusController,
);

router.post(
  "/:id/items",
  authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
  serviceTicketController.addItemController,
);

router.post(
  "/:id/complete-teknisi",
  authorize(["TEKNISI"]),
  serviceTicketController.completeByTeknisiController,
);

router.post(
  "/:id/complete",
  authorize(["ADMIN", "SYSADMIN"]),
  serviceTicketController.completeTicketController,
);

router.patch(
  "/:id/assign",
  authorize(["ADMIN", "SYSADMIN"]),
  serviceTicketController.assignTicketController,
);

router
  .route("/:id")
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    serviceTicketController.getTicketController,
  );

module.exports = router;
