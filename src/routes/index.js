// src/routes/index.js
const { Router } = require("express");
const componentRoute = require("./component.route");
const userRoute = require("./user.route");
const serviceTicketRoute = require("./serviceTicket.route");
const knowledgeEntryRoute = require("./knowledgeEntry.route");
const reportRoute = require("./report.route");
const healthRoute = require("./health.route");
const testRoute = require("./test.route");

const router = Router();

router.use("/components", componentRoute);
router.use("/users", userRoute);
router.use("/tickets", serviceTicketRoute);
router.use("/knowledge", knowledgeEntryRoute);
router.use("/reports", reportRoute);
router.use("/health", healthRoute);
componentRoute.route("/test", testRoute);

module.exports = router;
