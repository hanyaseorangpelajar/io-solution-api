// src/controllers/report.controller.js
const httpStatus = require("http-status");
const { reportService } = require("../services");
const { catchAsync } = require("../utils/catchAsync");

const getTicketSummary = catchAsync(async (req, res) => {
  const summary = await reportService.getTicketSummary();
  res.send(summary);
});

const getComponentUsage = catchAsync(async (req, res) => {
  const usage = await reportService.getComponentUsage();
  res.send(usage);
});

const getCommonIssues = catchAsync(async (req, res) => {
  const issues = await reportService.getCommonIssues();
  res.send(issues);
});

module.exports = {
  getTicketSummary,
  getComponentUsage,
  getCommonIssues,
};
