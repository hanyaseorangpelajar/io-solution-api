// src/routes/index.js
const { Router } = require("express");
const componentRoute = require("./v1/component.route");
const userRoute = require("./v1/user.route");

const router = Router();

router.use("/components", componentRoute);
router.use("/users", userRoute);

module.exports = router;
