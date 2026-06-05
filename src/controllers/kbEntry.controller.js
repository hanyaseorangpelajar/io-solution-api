const httpStatus = require("http-status");
const { kbEntryService } = require("../services");
const { catchAsync } = require("../utils");
const { toKBEntryDto } = require("../models/kbEntry.model");

const getEntriesController = catchAsync(async (req, res) => {
  const result = await kbEntryService.getKBEntries(req.query);
  res.send({
    ...result,
    results: result.results.map(toKBEntryDto),
  });
});

const getEntryController = catchAsync(async (req, res) => {
  const entry = await kbEntryService.getKBEntryById(req.params.id);
  res.send(toKBEntryDto(entry));
});

const updateEntryController = catchAsync(async (req, res) => {
  const updateData = {
    symptom: req.body.symptom,
    deviceModel: req.body.deviceModel,
    diagnosis: req.body.diagnosis,
    solution: req.body.solution,
    tags: req.body.tags,
    imageUrl: req.body.imageUrl,
  };

  const entry = await kbEntryService.updateKBEntry(
    req.params.id,
    updateData,
    req.user,
  );
  res.send(toKBEntryDto(entry));
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
