const authService = require("./auth.service");
const componentService = require("./part.service");
const knowledgeEntryService = require("./knowledgeEntry.service");
const reportService = require("./report.service");
const rmaRecordService = require("./rmaRecord.service");
const serviceTicketService = require("./serviceTicket.service");
const tokenService = require("./token.service");
const userService = require("./user.service");

module.exports = {
  ...authService,
  ...componentService,
  ...knowledgeEntryService,
  ...reportService,
  ...rmaRecordService,
  ...serviceTicketService,
  ...tokenService,
  ...userService,
};
