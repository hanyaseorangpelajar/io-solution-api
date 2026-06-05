const authService = require("./auth.service");
const kbEntryService = require("./kbEntry.service");
const tokenService = require("./token.service");
const userService = require("./user.service");
const serviceTicketService = require("./serviceTicket.service");
const customerService = require("./customer.service");

module.exports = {
  authService,
  tokenService,
  kbEntryService,
  serviceTicketService,
  userService,
  customerService,
};
