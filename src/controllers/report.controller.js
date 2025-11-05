const httpStatus = require("http-status");
const {
  getTicketSummaryMonthly,
  getInventorySummary,
  getPartUsageFromTickets,
  getCommonIssues,
  getTicketSummary, // <-- [BARU] Impor fungsi baru dari service
} = require("../services");
const { catchAsync } = require("../utils");

// --- FUNGSI LAMA ANDA ---
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

// --- [BARU] FUNGSI BARU UNTUK DASHBOARD ADMIN ---
const getDashboardSummaryController = catchAsync(async (req, res) => {
  // Memanggil fungsi 'getTicketSummary' (yang simpel) dari service
  const summary = await getTicketSummary();
  res.status(httpStatus.OK).json(summary);
});

module.exports = {
  getTicketSummary: getTicketSummaryController,
  getInventorySummary: getInventorySummaryController,
  getPartUsage: getPartUsageController,
  getCommonIssues: getCommonIssuesController,
  getDashboardSummary: getDashboardSummaryController, // <-- [BARU] Ekspor fungsi baru
};
