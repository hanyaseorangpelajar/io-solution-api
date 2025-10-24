const authService = require("./auth.service");
const partService = require("./part.service");
const knowledgeEntryService = require("./knowledgeEntry.service");
const reportService = require("./report.service");
const rmaRecordService = require("./rmaRecord.service");
const ticketService = require("./ticket.service");
const tokenService = require("./token.service");
const userService = require("./user.service");

module.exports = {
  ...authService,
  ...partService,
  ...knowledgeEntryService,
  ...reportService,
  ...rmaRecordService,
  ...ticketService,
  ...tokenService,
  ...userService,
};
