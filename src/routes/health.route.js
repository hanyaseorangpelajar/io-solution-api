// src/routes/health.route.js
const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  const pkg = require("../../package.json");
  res.json({
    status: "ok",
    service: pkg.name,
    version: pkg.version,
    env: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
