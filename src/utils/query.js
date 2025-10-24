/**
 * Mem-parsing parameter pagination (page, limit) dari query string request.
 * Memberikan nilai default dan batas maksimum untuk limit.
 * @param {object} query - Objek req.query.
 * @returns {{page: number, limit: number, skip: number}}
 */
function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limitRaw = Math.max(parseInt(query.limit || "10", 10), 1);
  const limit = Math.min(limitRaw, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Mem-parsing parameter sorting (sortBy, order) dari query string request.
 * Menggunakan allowlist untuk field yang boleh disortir.
 * @param {object} query - Objek req.query.
 * @param {string[]} [allowedSortFields=['createdAt', 'updatedAt']] - Array field yang diizinkan untuk sorting.
 * @param {object} [defaultSort={ createdAt: -1 }] - Objek sorting default jika tidak ada di query.
 * @returns {object} Objek sorting Mongoose (e.g., { createdAt: -1 }).
 */
function parseSort(
  query = {},
  allowedSortFields = ["createdAt", "updatedAt"],
  defaultSort = { createdAt: -1 }
) {
  const sortBy = query.sortBy?.toString();
  const order = (query.order || "desc").toString().toLowerCase();
  const dir = order === "asc" ? 1 : -1;

  if (sortBy && allowedSortFields.includes(sortBy)) {
    return { [sortBy]: dir };
  }

  return defaultSort;
}

module.exports = { parsePagination, parseSort };
