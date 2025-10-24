const authController = require("./auth.controller");
const knowledgeEntryController = require("./knowledgeEntry.controller");
const partController = require("./part.controller");
const reportController = require("./report.controller");
const rmaRecordController = require("./rmaRecord.controller");
const ticketController = require("./ticket.controller");
const userController = require("./user.controller");

module.exports = {
  authController,
  knowledgeEntryController,
  partController,
  reportController,
  rmaRecordController,
  ticketController,
  userController,
};
