// src/routes/ticket.route.js
const { Router } = require("express");
const ctrl = require("../controllers/ticket.controller");
const history = require("../controllers/history.controller");

const router = Router();

/**
 * Tickets CRUD + Status + Resolve
 */
router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);
router.put("/:id", ctrl.update);
router.patch("/:id/status", ctrl.updateStatus);
router.patch("/:id/resolve", ctrl.resolve);
router.delete("/:id", ctrl.remove);

/**
 * Ticket History (untuk TicketsHistoryPage)
 */
router.get("/:id/history", history.listHistory);

module.exports = router;
