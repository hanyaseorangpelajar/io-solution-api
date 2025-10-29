const httpStatus = require("http-status");
const {
  createTicket,
  queryTickets,
  getTicketById,
  assignTicket,
  addDiagnosis,
  addAction,
  updateTicketStatus,
  resolveTicket,
} = require("../services");
const {
  catchAsync,
  ApiError,
  parsePagination,
  parseSort,
} = require("../utils");
const { TICKET_STATUSES, TICKET_PRIORITIES } = require("../models");

const createTicketController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  if (req.body.priority && !TICKET_PRIORITIES.includes(req.body.priority)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Prioritas tidak valid.`);
  }
  const ticket = await createTicket(req.body, userId);
  res.status(httpStatus.CREATED).send(ticket);
});

const getTicketsController = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignee) filter.assignee = req.query.assignee;

  if (req.query.q) {
    const searchQuery = { $regex: req.query.q, $options: "i" };
    filter.$or = [
      { code: searchQuery },
      { subject: searchQuery },
      { requester: searchQuery },
    ];
  }

  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) {
      filter.createdAt.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.createdAt.$lte = new Date(req.query.to);
    }
  }

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;

  options.sort = parseSort(req.query);

  const result = await queryTickets(filter, options);

  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

const getTicketController = catchAsync(async (req, res) => {
  const ticket = await getTicketById(req.params.id);
  res.send(ticket);
});

const assignTicketController = catchAsync(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ID User (userId) wajib diisi");
  }
  const ticket = await assignTicket(req.params.id, userId);
  res.send(ticket);
});

const addDiagnosisController = catchAsync(async (req, res) => {
  const { symptom, diagnosis } = req.body;
  if (!symptom || !diagnosis) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Gejala dan diagnosis wajib diisi"
    );
  }
  const userId = req.user.id;
  const ticket = await addDiagnosis(
    req.params.id,
    { symptom, diagnosis },
    userId
  );
  res.send(ticket);
});

const addActionController = catchAsync(async (req, res) => {
  const { actionTaken, partsUsed } = req.body;
  if (!actionTaken) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Deskripsi tindakan (actionTaken) wajib diisi"
    );
  }
  if (partsUsed && !Array.isArray(partsUsed)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "partsUsed harus berupa array");
  }
  const userId = req.user.id;
  const ticket = await addAction(
    req.params.id,
    { actionTaken, partsUsed: partsUsed || [] },
    userId
  );
  res.send(ticket);
});

const updateTicketStatusController = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Status baru wajib diisi");
  }
  if (!TICKET_STATUSES.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Status tidak valid. Pilihan: ${TICKET_STATUSES.join(", ")}`
    );
  }

  const ticket = await updateTicketStatus(req.params.id, status);
  res.send(ticket);
});

const resolveTicketController = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { rootCause, solution } = req.body;
  if (!rootCause || !solution) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Root Cause dan Solution wajib diisi dalam body request."
    );
  }

  const ticket = await resolveTicket(req.params.id, req.body, userId);
  res.send(ticket);
});

module.exports = {
  createTicket: createTicketController,
  getTickets: getTicketsController,
  getTicket: getTicketController,
  assignTicket: assignTicketController,
  addDiagnosis: addDiagnosisController,
  addAction: addActionController,
  updateTicketStatus: updateTicketStatusController,
  resolveTicket: resolveTicketController,
};
