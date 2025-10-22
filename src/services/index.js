const componentService = require("./component.service");
const knowledgeEntryService = require("./knowledgeEntry.service");
const reportService = require("./report.service");
const serviceTicketService = require("./serviceTicket.service");
const userService = require("./user.service");
const authService = require("./auth.service");
const tokenService = require("./token.service");

module.exports = {
  ...componentService,
  ...knowledgeEntryService,
  ...reportService,
  ...serviceTicketService,
  ...userService,
  ...authService,
  ...tokenService,
};
