// src/controllers/knowledgeEntry.controller.js
const httpStatus = require("http-status");
const { knowledgeEntryService } = require("../services");
const { catchAsync } = require("../utils/catchAsync");
const { ApiError } = require("../utils/ApiError");

const createKnowledgeEntry = catchAsync(async (req, res) => {
  const entry = await knowledgeEntryService.createKnowledgeEntry(req.body);
  res.status(httpStatus.CREATED).send(entry);
});

const createFromTicket = catchAsync(async (req, res) => {
  const entry = await knowledgeEntryService.createKnowledgeEntryFromTicket(
    req.params.ticketId
  );
  res.status(httpStatus.CREATED).send(entry);
});

const getKnowledgeEntries = catchAsync(async (req, res) => {
  // Hanya ambil yang sudah di-publish
  const filter = { isPublished: true };
  // Di masa depan, bisa ditambahkan filter pencarian dari req.query
  const result = await knowledgeEntryService.queryKnowledgeEntries(filter);
  res.send(result);
});

const getDraftKnowledgeEntries = catchAsync(async (req, res) => {
  // Hanya ambil yang belum di-publish (draft)
  const filter = { isPublished: false };
  const result = await knowledgeEntryService.queryKnowledgeEntries(filter);
  res.send(result);
});

const getKnowledgeEntry = catchAsync(async (req, res) => {
  const entry = await knowledgeEntryService.getKnowledgeEntryById(
    req.params.id
  );
  res.send(entry);
});

const publishEntry = catchAsync(async (req, res) => {
  const entry = await knowledgeEntryService.publishKnowledgeEntry(
    req.params.id
  );
  res.send(entry);
});

module.exports = {
  createKnowledgeEntry,
  createFromTicket,
  getKnowledgeEntries,
  getDraftKnowledgeEntries,
  getKnowledgeEntry,
  publishEntry,
};
