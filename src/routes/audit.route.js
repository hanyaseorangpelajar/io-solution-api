// src/routes/audit.route.js
const { Router } = require("express");
const ctrl = require("../controllers/audit.controller");

const router = Router();

/**
 * @route GET /api/v1/audit/logs
 *        ?method=GET&status=200&routeKey=/api/v1/tickets/:id&actor=...&resourceType=ticket&resourceId=...&from=...&to=...&page=1&limit=20
 * @route GET /api/v1/audit/logs/:id
 */
router.get("/logs", ctrl.list);
router.get("/logs/:id", ctrl.detail);

module.exports = router;
