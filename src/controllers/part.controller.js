const httpStatus = require("http-status");

const {
  createPart,
  getParts,
  getPartById,
  updatePartById,
  deletePartById,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");

const createPartController = catchAsync(async (req, res) => {
  const part = await createPart(req.body);
  res.status(httpStatus.CREATED).send(part);
});

const getPartsController = catchAsync(async (req, res) => {
  const filter = {};
  const result = await getParts(filter);
  res.send(result);
});

const getPartController = catchAsync(async (req, res) => {
  const part = await getPartById(req.params.id);
  if (!part) {
    throw new ApiError(httpStatus.NOT_FOUND, "Part tidak ditemukan");
  }
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
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Hanya dapat memperbarui field: ${allowedUpdates.join(", ")}`
    );
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
