const authController = require("./auth.controller");
const kbEntryController = require("./kbEntry.controller");
const logoutController = require("./logout.controller");
const serviceTicketController = require("./serviceTicket.controller");
const userController = require("./user.controller");

module.exports = {
  authController,
  kbEntryController,
  serviceTicketController,
  userController,
  logoutController,
};
