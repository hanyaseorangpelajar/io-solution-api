// Mengimpor semua model
const { Component } = require("./component.model");
const { ServiceTicket, TICKET_STATUSES } = require("./serviceTicket.model");
const { User, ROLES } = require("./user.model");
const { KnowledgeEntry } = require("./knowledgeEntry.model");

// Mengekspor ulang semuanya dalam satu objek
module.exports = {
  Component,
  ServiceTicket,
  TICKET_STATUSES, // <-- Jangan lupa konstanta ini
  User,
  ROLES, // <-- dan ini
  KnowledgeEntry,
};
