// src/routes/ticket.route.js
const { Router } = require("express");
const ctrl = require("../controllers/ticket.controller");

const router = Router();

/**
 * @route   POST   /api/v1/tickets
 * @route   GET    /api/v1/tickets
 * @route   GET    /api/v1/tickets/:id
 * @route   PUT    /api/v1/tickets/:id
 * @route   PATCH  /api/v1/tickets/:id/status
 * @route   DELETE /api/v1/tickets/:id
 */
router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);
router.put("/:id", ctrl.update);
router.patch("/:id/status", ctrl.updateStatus);
router.delete("/:id", ctrl.remove);

module.exports = router;
