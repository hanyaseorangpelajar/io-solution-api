const httpStatus = require("http-status");
const {
  getTicketSummaryMonthly,
  getInventorySummary,
  getPartUsageFromTickets,
  getCommonIssues,
} = require("../services");
const { catchAsync } = require("../utils");

const getTicketSummaryController = catchAsync(async (req, res) => {
  const summary = await getTicketSummaryMonthly();
  res.send(summary);
});

const getInventorySummaryController = catchAsync(async (req, res) => {
  const summary = await getInventorySummary();
  res.send(summary);
});

const getPartUsageController = catchAsync(async (req, res) => {
  const usage = await getPartUsageFromTickets();
  res.send(usage);
});

const getCommonIssuesController = catchAsync(async (req, res) => {
  const issues = await getCommonIssues();
  res.send(issues);
});

module.exports = {
  getTicketSummary: getTicketSummaryController,
  getInventorySummary: getInventorySummaryController,
  getPartUsage: getPartUsageController,
  getCommonIssues: getCommonIssuesController,
};
