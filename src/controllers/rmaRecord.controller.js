const httpStatus = require("http-status");
const { RmaRecordService } = require("../services");
const { catchAsync, ApiError } = require("../utils");

const {
  createRmaRecord,
  queryRmaRecords,
  getRmaRecordById,
  addRmaAction,
} = require("../services");

const createRmaController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const rmaRecord = await createRmaRecord(req.body, userId);
  res.status(httpStatus.CREATED).send(rmaRecord);
});

const getRmasController = catchAsync(async (req, res) => {
  const filter = {};
  const result = await queryRmaRecords(filter);
  res.send(result);
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
