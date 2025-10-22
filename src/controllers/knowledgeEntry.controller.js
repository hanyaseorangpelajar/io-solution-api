const httpStatus = require("http-status");

// --- PERBAIKAN ---
const {
  createKnowledgeEntry,
  createKnowledgeEntryFromTicket,
  queryKnowledgeEntries,
  getKnowledgeEntryById,
  publishKnowledgeEntry,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");
// --- AKHIR PERBAIKAN ---

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
  const result = await queryKnowledgeEntries(filter);
  res.send(result);
});

const getDraftKnowledgeEntriesController = catchAsync(async (req, res) => {
  const filter = { isPublished: false };
  const result = await queryKnowledgeEntries(filter);
  res.send(result);
});

const getKnowledgeEntryController = catchAsync(async (req, res) => {
  const entry = await getKnowledgeEntryById(req.params.id);
  res.send(entry);
});

const publishEntryController = catchAsync(async (req, res) => {
  const entry = await publishKnowledgeEntry(req.params.id);
  res.send(entry);
});

module.exports = {
  createKnowledgeEntry: createKnowledgeEntryController,
  createFromTicket: createFromTicketController,
  getKnowledgeEntries: getKnowledgeEntriesController,
  getDraftKnowledgeEntries: getDraftKnowledgeEntriesController,
  getKnowledgeEntry: getKnowledgeEntryController,
  publishEntry: publishEntryController,
};
