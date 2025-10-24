const { Part, PART_STATUSES, PART_CATEGORIES } = require("./part.model");
const {
  Ticket,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} = require("./ticket.model");
const { User, ROLES } = require("./user.model");
const { KnowledgeEntry } = require("./knowledgeEntry.model");
const { AuditRecord, AUDIT_STATUSES } = require("./auditRecord.model");
const { StockMovement, STOCK_MOVE_TYPES } = require("./stockMovement.model");
const {
  RmaRecord,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
} = require("./rmaRecord.model");

module.exports = {
  Part,
  PART_STATUSES,
  PART_CATEGORIES,
  Ticket,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  User,
  ROLES,
  KnowledgeEntry,
  AuditRecord,
  AUDIT_STATUSES,
  StockMovement,
  STOCK_MOVE_TYPES,
  RmaRecord,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
};
