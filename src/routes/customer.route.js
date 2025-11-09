const express = require("express");
const { customerController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    authorize(["Admin", "Teknisi"]),
    customerController.getCustomersController
  );

router
  .route("/:id")
  .get(
    authorize(["Admin", "Teknisi"]),
    customerController.getCustomerController
  )
  .patch(
    authorize(["Admin", "Teknisi"]),
    customerController.updateCustomerController
  );
module.exports = router;
