// src/utils/query.js

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limitRaw = Math.max(parseInt(query.limit || "10", 10), 1);
  const limit = Math.min(limitRaw, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseSort(query) {
  // allowlist sederhana
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "priority",
    "status",
    "subject",
  ]);
  const sortBy = (query.sortBy || "createdAt").toString();
  const field = allowed.has(sortBy) ? sortBy : "createdAt";
  const order = (query.order || "desc").toString().toLowerCase();
  const dir = order === "asc" ? 1 : -1;
  return { [field]: dir };
}

function buildTicketFilters(query) {
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.assignee) filters.assignee = query.assignee;
  if (query.tag) filters.tags = { $in: [query.tag] };

  if (query.q) {
    const regex = new RegExp(query.q, "i");
    filters.$or = [
      { subject: regex },
      { description: regex },
      { code: regex },
      { requester: regex },
    ];
  }

  if (query.from || query.to) {
    filters.createdAt = {};
    if (query.from) filters.createdAt.$gte = new Date(query.from);
    if (query.to) filters.createdAt.$lte = new Date(query.to);
  }

  return filters;
}

module.exports = { parsePagination, parseSort, buildTicketFilters };
