const express = require("express");
const { partController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.use(protect);

router.get("/", partController.getParts);
router.get("/:id", partController.getPart);

router.post("/", authorize(["Admin", "SysAdmin"]), partController.createPart);
router.put("/:id", authorize(["Admin", "SysAdmin"]), partController.updatePart);
router.delete(
  "/:id",
  authorize(["Admin", "SysAdmin"]),
  partController.deletePart
);

module.exports = router;
