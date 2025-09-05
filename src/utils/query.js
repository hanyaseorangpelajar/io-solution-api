// src/utils/query.js

function parsePagination(query) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limitRaw = Math.max(parseInt(query.limit || "10", 10), 1);
  const limit = Math.min(limitRaw, 100); // hard cap
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseSort(query) {
  // e.g. ?sortBy=createdAt&order=desc
  const sortBy = (query.sortBy || "createdAt").toString();
  const order = (query.order || "desc").toString().toLowerCase();
  const dir = order === "asc" ? 1 : -1;
  return { [sortBy]: dir };
}

function buildTicketFilters(query) {
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.priority) filters.priority = query.priority;
  if (query.assignee) filters.assignee = query.assignee;

  if (query.tag) {
    // match tag dalam array
    filters.tags = { $in: [query.tag] };
  }

  if (query.q) {
    const regex = new RegExp(query.q, "i");
    filters.$or = [{ title: regex }, { description: regex }, { code: regex }];
  }

  if (query.from || query.to) {
    filters.createdAt = {};
    if (query.from) filters.createdAt.$gte = new Date(query.from);
    if (query.to) filters.createdAt.$lte = new Date(query.to);
  }

  return filters;
}

module.exports = { parsePagination, parseSort, buildTicketFilters };
