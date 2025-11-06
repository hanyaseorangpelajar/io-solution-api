const express = require("express");
const { kbEntryController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(authorize(["Admin", "Teknisi"]), kbEntryController.getEntriesController);

router
  .route("/:id")
  .get(authorize(["Admin", "Teknisi"]), kbEntryController.getEntryController);

router
  .route("/:id")
  .get(authorize(["Admin", "Teknisi"]), kbEntryController.getEntryController)
  .patch(authorize(["Admin"]), kbEntryController.updateEntryController)
  .delete(authorize(["Admin"]), kbEntryController.deleteEntryController);

module.exports = router;
