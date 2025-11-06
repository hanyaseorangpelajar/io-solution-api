const httpStatus = require("http-status");
const {
  createServiceTicket,
  getServiceTickets,
  getServiceTicketById,
  assignServiceTicket,
  updateServiceTicketStatus,
  addReplacementItem,
  completeTicketAndCreateKB,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");

const createTicketController = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const ticket = await createServiceTicket(req.body, createdById);
  res.status(httpStatus.CREATED).send(ticket);
});

const getTicketsController = catchAsync(async (req, res) => {
  const result = await getServiceTickets(req.query);
  res.send(result);
});

const getTicketController = catchAsync(async (req, res) => {
  const ticket = await getServiceTicketById(req.params.id);
  res.send(ticket);
});

const assignTicketController = catchAsync(async (req, res) => {
  const { teknisiId } = req.body;
  if (!teknisiId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "teknisiId wajib diisi.");
  }
  const ticket = await assignServiceTicket(
    req.params.id,
    teknisiId,
    req.user.id
  );
  res.send(ticket);
});

const updateStatusController = catchAsync(async (req, res) => {
  const { status, catatan } = req.body;
  const ticket = await updateServiceTicketStatus(
    req.params.id,
    { status, catatan },
    req.user.id
  );
  res.send(ticket);
});

const addItemController = catchAsync(async (req, res) => {
  const ticket = await addReplacementItem(req.params.id, req.body);
  res.send(ticket);
});

const completeTicketController = catchAsync(async (req, res) => {
  const { diagnosis, solusi } = req.body;
  const result = await completeTicketAndCreateKB(
    req.params.id,
    { diagnosis, solusi },
    req.user.id
  );
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  createTicketController,
  getTicketsController,
  getTicketController,
  assignTicketController,
  updateStatusController,
  addItemController,
  completeTicketController,
};
