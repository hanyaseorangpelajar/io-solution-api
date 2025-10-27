const express = require("express");
const { userController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.patch("/me", protect, userController.updateProfile);

router.use(protect);
router.use(authorize(["SysAdmin"]));

router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
