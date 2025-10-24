const httpStatus = require("http-status");
const {
  createRmaRecord,
  queryRmaRecords,
  getRmaRecordById,
  addRmaAction,
} = require("../services");
const {
  catchAsync,
  ApiError,
  parsePagination,
  parseSort,
} = require("../utils");
const { RMA_STATUSES } = require("../models");

const createRmaController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const rmaRecord = await createRmaRecord(req.body, userId);
  res.status(httpStatus.CREATED).send(rmaRecord);
});

const getRmasController = catchAsync(async (req, res) => {
  const filter = {};
  const { status, q } = req.query;

  if (status) {
    if (RMA_STATUSES.includes(status)) {
      filter.status = status;
    } else {
      console.warn(`Ignoring invalid RMA status filter: ${status}`);
    }
  }
  if (q && typeof q === "string") {
    filter.q = q;
  }

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;
  options.sort = parseSort(req.query) || { createdAt: -1 };

  const result = await queryRmaRecords(filter, options);

  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

const getRmaController = catchAsync(async (req, res) => {
  const rmaRecord = await getRmaRecordById(req.params.id);
  res.send(rmaRecord);
});

const addActionController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const rmaRecord = await addRmaAction(req.params.id, req.body, userId);
  res.send(rmaRecord);
});

module.exports = {
  createRma: createRmaController,
  getRmas: getRmasController,
  getRma: getRmaController,
  addAction: addActionController,
};
