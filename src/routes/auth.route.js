const express = require("express");
const { authController, logoutController } = require("../controllers");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", logoutController);

module.exports = router;
