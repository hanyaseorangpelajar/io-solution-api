const express = require("express");
const { userController } = require("../controllers");
const { protect, authorize } = require("../middlewares");

const router = express.Router();

router.patch("/me", protect, userController.updateProfileController);
router.patch("/me/password", protect, userController.changePasswordController);
router.get("/me/login-history", protect, userController.getLoginHistory);

router.use(protect);

router.get(
  "/",
  authorize(["SYSADMIN", "ADMIN", "TEKNISI"]),
  userController.getUsersController,
);
router.get(
  "/:id",
  authorize(["SYSADMIN", "ADMIN", "TEKNISI"]),
  userController.getUserController,
);

router.post(
  "/",
  authorize(["ADMIN", "SYSADMIN"]),
  userController.createUserController,
);
router.patch(
  "/:id",
  authorize(["ADMIN", "SYSADMIN"]),
  userController.updateUserController,
);
router.delete(
  "/:id",
  authorize(["ADMIN", "SYSADMIN"]),
  userController.deleteUserController,
);

module.exports = router;
