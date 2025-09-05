// src/services/audit.service.js
const { AuditLog } = require("../models/auditLog.model");

function mapAudit(a) {
  return {
    id: a._id.toString(),
    rid: a.rid,
    method: a.method,
    path: a.path,
    routeKey: a.routeKey,
    status: a.status,
    durationMs: a.durationMs,
    actor: a.actor,
    ip: a.ip,
    userAgent: a.userAgent,
    resourceType: a.resourceType,
    resourceId: a.resourceId,
    query: a.query || {},
    bodyKeys: a.bodyKeys || [],
    message: a.message,
    createdAt: a.createdAt.toISOString(),
  };
}

function parsePaginate(q) {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const limitRaw = Math.max(parseInt(q.limit || "20", 10), 1);
  const limit = Math.min(limitRaw, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function listAudit(query) {
  const { page, limit, skip } = parsePaginate(query);
  const filters = {};

  if (query.method) filters.method = query.method.toUpperCase();
  if (query.status) filters.status = parseInt(query.status, 10);
  if (query.routeKey) filters.routeKey = query.routeKey;
  if (query.actor) filters.actor = query.actor;
  if (query.resourceType) filters.resourceType = query.resourceType;
  if (query.resourceId) filters.resourceId = query.resourceId;

  if (query.from || query.to) {
    filters.createdAt = {};
    if (query.from) filters.createdAt.$gte = new Date(query.from);
    if (query.to) filters.createdAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filters),
  ]);

  return {
    data: items.map(mapAudit),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function getAuditById(id) {
  const a = await AuditLog.findById(id).lean();
  return a ? mapAudit(a) : null;
}

module.exports = { listAudit, getAuditById };
