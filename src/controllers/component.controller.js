const httpStatus = require("http-status");

// --- PERBAIKAN ---
// Impor fungsi langsung dari barrel services dan utils
const {
  createComponent,
  getComponents,
  getComponentById,
  updateComponentById,
  deleteComponentById,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");
// --- AKHIR PERBAIKAN ---

const createComponentController = catchAsync(async (req, res) => {
  const component = await createComponent(req.body);
  res.status(httpStatus.CREATED).send(component);
});

const getComponentsController = catchAsync(async (req, res) => {
  const filter = {};
  const result = await getComponents(filter);
  res.send(result);
});

const getComponentController = catchAsync(async (req, res) => {
  const component = await getComponentById(req.params.id);
  if (!component) {
    throw new ApiError(httpStatus.NOT_FOUND, "Komponen tidak ditemukan");
  }
  res.send(component);
});

const updateComponentController = catchAsync(async (req, res) => {
  const allowedUpdates = ["stock", "price"];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya dapat memperbarui stok dan harga"
    );
  }

  const component = await updateComponentById(req.params.id, req.body);
  res.send(component);
});

const deleteComponentController = catchAsync(async (req, res) => {
  await deleteComponentById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createComponent: createComponentController,
  getComponents: getComponentsController,
  getComponent: getComponentController,
  updateComponent: updateComponentController,
  deleteComponent: deleteComponentController,
};
