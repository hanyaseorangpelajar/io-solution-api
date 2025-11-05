const express = require("express");
const { userController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.patch("/me", protect, userController.updateProfile);
router.patch("/me/password", protect, userController.changePassword);
router.use(protect);

router.get(
  "/",
  authorize(["SysAdmin", "Admin", "Teknisi"]),
  userController.getUsers
);
router.get(
  "/:id",
  authorize(["SysAdmin", "Admin", "Teknisi"]),
  userController.getUser
);

router.post("/", authorize(["SysAdmin"]), userController.createUser);
router.patch("/:id", authorize(["SysAdmin"]), userController.updateUser);
router.delete("/:id", authorize(["SysAdmin"]), userController.deleteUser);

module.exports = router;
