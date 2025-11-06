const express = require("express");
const authController = require("../controllers/auth.controller.js");
const logoutController = require("../controllers/logout.controller.js");
const { protect } = require("../middlewares");
const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", protect, authController.getMe);
router.post("/logout", logoutController);

module.exports = router;
