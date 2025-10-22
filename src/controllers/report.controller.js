const httpStatus = require("http-status");

// --- PERBAIKAN ---
const {
  getTicketSummary,
  getComponentUsage,
  getCommonIssues,
} = require("../services");
const { catchAsync } = require("../utils");
// --- AKHIR PERBAIKAN ---

const getTicketSummaryController = catchAsync(async (req, res) => {
  const summary = await getTicketSummary();
  res.send(summary);
});

const getComponentUsageController = catchAsync(async (req, res) => {
  const usage = await getComponentUsage();
  res.send(usage);
});

const getCommonIssuesController = catchAsync(async (req, res) => {
  const issues = await getCommonIssues();
  res.send(issues);
});

module.exports = {
  getTicketSummary: getTicketSummaryController,
  getComponentUsage: getComponentUsageController,
  getCommonIssues: getCommonIssuesController,
};
