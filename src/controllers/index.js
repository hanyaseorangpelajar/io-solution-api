const auditRecordController = require("./auditRecord.controller");
const authController = require("./auth.controller");
const knowledgeEntryController = require("./knowledgeEntry.controller");
const logoutController = require("./logout.controller");
const partController = require("./part.controller");
const reportController = require("./report.controller");
const rmaRecordController = require("./rmaRecord.controller");
const ticketController = require("./ticket.controller");
const userController = require("./user.controller");
const stockMovementController = require("./stockMovement.controller");

module.exports = {
  auditRecordController,
  authController,
  knowledgeEntryController,
  logoutController,
  partController,
  reportController,
  rmaRecordController,
  ticketController,
  userController,
  stockMovementController,
};
