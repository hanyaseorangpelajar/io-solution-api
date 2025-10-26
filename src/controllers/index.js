const authController = require("./auth.controller");
const knowledgeEntryController = require("./knowledgeEntry.controller");
const partController = require("./part.controller");
const logoutController = require("./logout.controller");
const reportController = require("./report.controller");
const rmaRecordController = require("./rmaRecord.controller");
const ticketController = require("./ticket.controller");
const userController = require("./user.controller");

module.exports = {
  authController,
  logoutController,
  knowledgeEntryController,
  partController,
  reportController,
  rmaRecordController,
  ticketController,
  userController,
};
