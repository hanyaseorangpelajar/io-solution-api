const httpStatus = require("http-status");
const {
  createKnowledgeEntry,
  createKnowledgeEntryFromTicket,
  queryKnowledgeEntries,
  getKnowledgeEntryById,
  publishKnowledgeEntry,
  unpublishKnowledgeEntry,
  updateKnowledgeEntryById,
  deleteKnowledgeEntryById,
} = require("../services");
const {
  catchAsync,
  ApiError,
  parsePagination,
  parseSort,
} = require("../utils");

const createKnowledgeEntryController = catchAsync(async (req, res) => {
  const entry = await createKnowledgeEntry(req.body);
  res.status(httpStatus.CREATED).send(entry);
});

const createFromTicketController = catchAsync(async (req, res) => {
  const entry = await createKnowledgeEntryFromTicket(req.params.ticketId);
  res.status(httpStatus.CREATED).send(entry);
});

const getKnowledgeEntriesController = catchAsync(async (req, res) => {
  const filter = { isPublished: true };
  const { tags, q } = req.query;
  if (tags) filter.tags = tags;
  if (q) filter.q = q;

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;
  options.sort = parseSort(req.query) || { createdAt: -1 };

  const result = await queryKnowledgeEntries(filter, options);

  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

const getDraftKnowledgeEntriesController = catchAsync(async (req, res) => {
  const filter = { isPublished: false };
  const { tags, q } = req.query;
  if (tags) filter.tags = tags;
  if (q) filter.q = q;

  const options = {};
  const { page, limit, skip } = parsePagination(req.query);
  options.limit = limit;
  options.skip = skip;
  options.sort = parseSort(req.query) || { createdAt: -1 };

  const result = await queryKnowledgeEntries(filter, options);

  res.send({
    results: result.results,
    page,
    limit,
    totalPages: Math.ceil(result.totalResults / limit),
    totalResults: result.totalResults,
  });
});

const getKnowledgeEntryController = catchAsync(async (req, res) => {
  const entry = await getKnowledgeEntryById(req.params.id);
  res.send(entry);
});

const publishEntryController = catchAsync(async (req, res) => {
  const entry = await publishKnowledgeEntry(req.params.id);
  res.send(entry);
});

const unpublishEntryController = catchAsync(async (req, res) => {
  const entry = await unpublishKnowledgeEntry(req.params.id);
  res.send(entry);
});

const updateKnowledgeEntryController = catchAsync(async (req, res) => {
  const entry = await updateKnowledgeEntryById(req.params.id, req.body);
  res.send(entry);
});

const deleteKnowledgeEntryController = catchAsync(async (req, res) => {
  await deleteKnowledgeEntryById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createKnowledgeEntry: createKnowledgeEntryController,
  createFromTicket: createFromTicketController,
  getKnowledgeEntries: getKnowledgeEntriesController,
  getDraftKnowledgeEntries: getDraftKnowledgeEntriesController,
  getKnowledgeEntry: getKnowledgeEntryController,
  publishEntry: publishEntryController,
  unpublishEntry: unpublishEntryController,
  updateKnowledgeEntry: updateKnowledgeEntryController,
  deleteKnowledgeEntry: deleteKnowledgeEntryController,
};
