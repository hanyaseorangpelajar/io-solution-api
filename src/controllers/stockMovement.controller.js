const httpStatus = require("http-status");
const { createStockMovement, queryStockMovements } = require("../services");
const {
  catchAsync,
  ApiError,
  parsePagination,
  parseSort,
} = require("../utils");
const { STOCK_MOVE_TYPES, Part, User } = require("../models");

const createStockMovementController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const moveData = req.body;

  if (!moveData.partId || !moveData.type || !moveData.quantity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "partId, type, dan quantity wajib ada di body request."
    );
  }
  if (!STOCK_MOVE_TYPES.includes(moveData.type)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Tipe pergerakan '${moveData.type}' tidak valid.`
    );
  }

  const stockMovement = await createStockMovement(moveData, userId);
  res.status(httpStatus.CREATED).send(stockMovement);
});

const getStockMovementsController = catchAsync(async (req, res) => {
  const filter = {};
  const { type, partId, userId, q, from, to } = req.query;

  if (type && STOCK_MOVE_TYPES.includes(type)) {
    filter.type = type;
  }

  if (partId && mongoose.Types.ObjectId.isValid(partId)) {
    filter.part = partId;
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.user = userId;
  }

  if (q && typeof q === "string") {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [
      { partNameSnapshot: regex },
      { reference: regex },
      { notes: regex },
    ];
  }

  if (from || to) {
    filter.at = {};
    if (from) {
      const startDate = new Date(from);
      if (!isNaN(startDate)) filter.at.$gte = startDate;
    }
    if (to) {
      const endDate = new Date(to);
      if (!isNaN(endDate)) filter.at.$lte = endDate;
    }
    if (Object.keys(filter.at).length === 0) {
      delete filter.at;
    }
  }

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;
  options.sort = parseSort(req.query) || { at: -1 };

  const result = await queryStockMovements(filter, options);

  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

module.exports = {
  createStockMovement: createStockMovementController,
  getStockMovements: getStockMovementsController,
};
