const express = require("express");
const { userController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.patch("/me", protect, userController.updateProfile);
router.patch("/me/password", protect, userController.changePassword);
router.get("/me/login-history", protect, userController.getLoginHistory);
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

router.post("/", authorize(["Admin"]), userController.createUser);
router.patch("/:id", authorize(["Admin"]), userController.updateUser);
router.delete("/:id", authorize(["Admin"]), userController.deleteUser);
module.exports = router;
