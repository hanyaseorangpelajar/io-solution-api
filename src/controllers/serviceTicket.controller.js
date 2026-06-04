const httpStatus = require("http-status");
const { serviceTicketService } = require("../services");
const { catchAsync, ApiError } = require("../utils");
const { toTicketDto } = require("../models/serviceTicket.model");

const createTicketController = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const ticket = await serviceTicketService.createServiceTicket(
    req.body,
    createdById,
  );
  res.status(httpStatus.CREATED).send(toTicketDto(ticket));
});

const getTicketsController = catchAsync(async (req, res) => {
  const filter = { ...req.query };
  const { user } = req;

  if (user.role === "Teknisi") {
    filter.technicianId = user.id;
  }

  const result = await serviceTicketService.getServiceTickets(filter);

  res.send({
    ...result,
    results: result.results.map(toTicketDto),
  });
});

const getTicketController = catchAsync(async (req, res) => {
  const ticket = await serviceTicketService.getServiceTicketById(req.params.id);
  res.send(toTicketDto(ticket));
});

const assignTicketController = catchAsync(async (req, res) => {
  const { technicianId } = req.body;
  if (!technicianId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "technicianId is required.");
  }
  const ticket = await serviceTicketService.assignServiceTicket(
    req.params.id,
    technicianId,
    req.user.id,
  );
  res.send(toTicketDto(ticket));
});

const updateStatusController = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  const updatedTicket = await serviceTicketService.updateServiceTicketStatus(
    req.params.id,
    { status, note },
    req.user,
  );
  res.send(toTicketDto(updatedTicket));
});

const addItemController = catchAsync(async (req, res) => {
  const ticket = await serviceTicketService.addReplacementItem(
    req.params.id,
    req.body,
  );
  res.send(toTicketDto(ticket));
});

const completeByTeknisiController = catchAsync(async (req, res) => {
  const { diagnosis, solution } = req.body;
  const ticket = await serviceTicketService.completeByTeknisi(
    req.params.id,
    { diagnosis, solution },
    req.user,
  );
  res.status(httpStatus.OK).send(toTicketDto(ticket));
});

const completeTicketController = catchAsync(async (req, res) => {
  const { diagnosis, solution, tags } = req.body;
  const result = await serviceTicketService.completeTicketAndCreateKB(
    req.params.id,
    { diagnosis, solution, tags },
    req.user.id,
  );
  res.status(httpStatus.OK).send({
    ticket: toTicketDto(result.ticket),
    kbEntry: result.kbEntry,
  });
});

const getGlobalHistoryController = catchAsync(async (req, res) => {
  const result = await serviceTicketService.getGlobalStatusHistory(
    req.query,
    req.user,
  );
  res.send(result);
});

module.exports = {
  createTicketController,
  getTicketsController,
  getTicketController,
  assignTicketController,
  updateStatusController,
  addItemController,
  completeByTeknisiController,
  completeTicketController,
  getGlobalHistoryController,
};
