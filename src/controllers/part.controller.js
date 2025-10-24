const httpStatus = require("http-status");
const {
  createPart,
  getParts,
  getPartById,
  updatePartById,
  deletePartById,
} = require("../services");
const {
  catchAsync,
  ApiError,
  parsePagination,
  parseSort,
} = require("../utils");
const { PART_CATEGORIES, PART_STATUSES } = require("../models");

const createPartController = catchAsync(async (req, res) => {
  if (req.body.category && !PART_CATEGORIES.includes(req.body.category)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Kategori '${req.body.category}' tidak valid.`
    );
  }
  if (req.body.status && !PART_STATUSES.includes(req.body.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status '${req.body.status}' tidak valid.`
    );
  }

  const part = await createPart(req.body);
  res.status(httpStatus.CREATED).send(part);
});

const getPartsController = catchAsync(async (req, res) => {
  const filter = {};
  const { category, status, q } = req.query;

  if (category) {
    if (PART_CATEGORIES.includes(category)) {
      filter.category = category;
    } else {
      console.warn(`Ignoring invalid category filter: ${category}`);
    }
  }

  if (status) {
    if (PART_STATUSES.includes(status)) {
      filter.status = status;
    } else {
      console.warn(`Ignoring invalid status filter: ${status}`);
    }
  } else {
    filter.status = "active";
  }

  if (q && typeof q === "string") {
    const regex = new RegExp(q.trim(), "i");
    filter.$or = [{ name: regex }, { sku: regex }];
  }

  const options = {};

  const result = await getParts(filter);
  res.send(result);
});

const getPartController = catchAsync(async (req, res) => {
  const part = await getPartById(req.params.id);
  res.send(part);
});

const updatePartController = catchAsync(async (req, res) => {
  const allowedUpdates = [
    "name",
    "sku",
    "category",
    "vendor",
    "unit",
    "minStock",
    "location",
    "price",
    "status",
  ];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    const invalidFields = updates.filter(
      (update) => !allowedUpdates.includes(update)
    );
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Field tidak valid: ${invalidFields.join(", ")}`
    );
  }

  if (req.body.category && !PART_CATEGORIES.includes(req.body.category)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Kategori tidak valid.`);
  }
  if (req.body.status && !PART_STATUSES.includes(req.body.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Status tidak valid.`);
  }

  const part = await updatePartById(req.params.id, req.body);
  res.send(part);
});

const deletePartController = catchAsync(async (req, res) => {
  await deletePartById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPart: createPartController,
  getParts: getPartsController,
  getPart: getPartController,
  updatePart: updatePartController,
  deletePart: deletePartController,
};
