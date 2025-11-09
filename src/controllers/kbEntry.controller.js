const httpStatus = require("http-status");
const { kbEntryService } = require("../services");
const { catchAsync, ApiError } = require("../utils");

const getEntriesController = catchAsync(async (req, res) => {
  const result = await kbEntryService.getKBEntries(req.query);
  res.send(result);
});

const getEntryController = catchAsync(async (req, res) => {
  const entry = await kbEntryService.getKBEntryById(req.params.id);
  res.send(entry);
});

const updateEntryController = catchAsync(async (req, res) => {
  const updateData = {
    gejala: req.body.gejala,
    modelPerangkat: req.body.modelPerangkat,
    diagnosis: req.body.diagnosis,
    solusi: req.body.solusi,
    tags: req.body.tags,
    imageUrl: req.body.imageUrl,
  };

  const entry = await kbEntryService.updateKBEntry(
    req.params.id,
    updateData,
    req.user
  );
  res.send(entry);
});

const deleteEntryController = catchAsync(async (req, res) => {
  await kbEntryService.deleteKBEntry(req.params.id, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getEntriesController,
  getEntryController,
  updateEntryController,
  deleteEntryController,
};
