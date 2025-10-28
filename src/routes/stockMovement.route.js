const express = require("express");
const { stockMovementController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorize(["Teknisi", "Admin", "SysAdmin"]),
  stockMovementController.getStockMovements
);

router.post(
  "/",
  authorize(["Teknisi", "Admin", "SysAdmin"]),
  stockMovementController.createStockMovement
);

module.exports = router;
