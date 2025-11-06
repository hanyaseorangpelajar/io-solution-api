const httpStatus = require("http-status");
const {
  getKBEntries,
  getKBEntryById,
  updateKBEntry,
  deleteKBEntry,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");

const getEntriesController = catchAsync(async (req, res) => {
  const result = await getKBEntries(req.query);
  res.send(result);
});

const getEntryController = catchAsync(async (req, res) => {
  const entry = await getKBEntryById(req.params.id);
  res.send(entry);
});

const updateEntryController = catchAsync(async (req, res) => {
  const entry = await updateKBEntry(req.params.id, req.body);
  res.send(entry);
});

const deleteEntryController = catchAsync(async (req, res) => {
  await deleteKBEntry(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getEntriesController,
  getEntryController,
  updateEntryController,
  deleteEntryController,
};
