const authController = require("./auth.controller");
const kbEntryController = require("./kbEntry.controller");
const logoutController = require("./logout.controller");
const serviceTicketController = require("./serviceTicket.controller");
const userController = require("./user.controller");
const customerController = require("./customer.controller");
const uploadController = require("./upload.controller");

module.exports = {
  authController,
  kbEntryController,
  serviceTicketController,
  uploadController,
  userController,
  logoutController,
  customerController,
};
