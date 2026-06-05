const express = require("express");
const { kbEntryController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    kbEntryController.getEntriesController,
  );

router
  .route("/:id")
  .get(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    kbEntryController.getEntryController,
  )
  .patch(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    kbEntryController.updateEntryController,
  )
  .delete(
    authorize(["ADMIN", "TEKNISI", "SYSADMIN"]),
    kbEntryController.deleteEntryController,
  );

module.exports = router;
