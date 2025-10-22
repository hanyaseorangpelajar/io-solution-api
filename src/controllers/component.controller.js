const httpStatus = require("http-status");
const { componentService } = require("../services");
const { catchAsync } = require("../utils/catchAsync");
const { ApiError } = require("../utils/ApiError");

const createComponent = catchAsync(async (req, res) => {
  const component = await componentService.createComponent(req.body);
  res.status(httpStatus.CREATED).send(component);
});

const getComponents = catchAsync(async (req, res) => {
  // Di masa depan, Anda bisa menambahkan filter dari req.query
  const filter = {};
  const result = await componentService.getComponents(filter);
  res.send(result);
});

const getComponent = catchAsync(async (req, res) => {
  const component = await componentService.getComponentById(req.params.id);
  if (!component) {
    throw new ApiError(httpStatus.NOT_FOUND, "Komponen tidak ditemukan");
  }
  res.send(component);
});

const updateComponent = catchAsync(async (req, res) => {
  // Hanya izinkan update stok dan harga untuk endpoint ini
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

  const component = await componentService.updateComponentById(
    req.params.id,
    req.body
  );
  res.send(component);
});

const deleteComponent = catchAsync(async (req, res) => {
  await componentService.deleteComponentById(req.params.id);
  // 204 No Content, menandakan berhasil tapi tidak ada body respons
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createComponent,
  getComponents,
  getComponent,
  updateComponent,
  deleteComponent,
};
