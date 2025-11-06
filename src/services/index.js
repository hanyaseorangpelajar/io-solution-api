const authService = require("./auth.service");
const kbEntryService = require("./kbEntry.service");
const tokenService = require("./token.service");
const userService = require("./user.service");
const serviceTicketService = require("./serviceTicket.service");

module.exports = {
  authService,
  tokenService,
  kbEntryService,
  serviceTicketService,
  userService,
};
