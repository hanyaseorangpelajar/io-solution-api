const express = require("express");
const { customerController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    customerController.getCustomersController,
  );

router
  .route("/:id")
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    customerController.getCustomerController,
  )
  .patch(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    customerController.updateCustomerController,
  );

module.exports = router;
