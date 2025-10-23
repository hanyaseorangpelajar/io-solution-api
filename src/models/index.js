const { AuditRecord, AUDIT_STATUSES } = require("./auditRecord.model");
const { KnowledgeEntry } = require("./knowledgeEntry.model");
const { Part, PART_STATUSES } = require("./part.model");
const {
  RmaRecord,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
} = require("./rmaRecord.model");
const {
  ServiceTicket,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} = require("./serviceTicket.model");
const { StockMovement, STOCK_MOVE_TYPES } = require("./stockMovement.model");
const { User, ROLES } = require("./user.model");

module.exports = {
  AUDIT_STATUSES,
  AuditRecord,
  KnowledgeEntry,
  PART_STATUSES,
  Part,
  RMA_ACTION_TYPES,
  RMA_ACTION_TYPES,
  RMA_STATUSES,
  RMA_STATUSES,
  RmaRecord,
  ROLES,
  ServiceTicket,
  STOCK_MOVE_TYPES,
  StockMovement,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  User,
};
