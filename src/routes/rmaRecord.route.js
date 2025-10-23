const express = require("express");
const { rmaRecordController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(rmaRecordController.getRmas)
  .post(authorize(["Admin", "SysAdmin"]), rmaRecordController.createRma);

router.route("/:id").get(rmaRecordController.getRma);

router
  .route("/:id/actions")
  .put(authorize(["Admin", "SysAdmin"]), rmaRecordController.addAction);

module.exports = router;
