const httpStatus = require("http-status");
const { queryAuditRecords } = require("../services");
const { catchAsync, parsePagination, parseSort } = require("../utils");
const { AUDIT_STATUSES } = require("../models"); //

const getAuditRecordsController = catchAsync(async (req, res) => {
  const filter = {};
  const { status, q } = req.query;

  // Filter berdasarkan status audit (approved, rejected, dll)
  if (status && AUDIT_STATUSES.includes(status)) {
    filter.status = status;
  }

  // Filter berdasarkan pencarian (kode tiket, catatan)
  if (q && typeof q === "string") {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [{ ticketCode: regex }, { notes: regex }];
  }

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;
  options.sort = parseSort(req.query) || { reviewedAt: -1, createdAt: -1 };

  const result = await queryAuditRecords(filter, options);

  // Kirim respons dengan format paginasi
  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

module.exports = {
  getAuditRecords: getAuditRecordsController,
};
