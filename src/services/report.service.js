const {
  ServiceTicket,
  Part,
  StockMovement,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} = require("../models");
const mongoose = require("mongoose");

/**
 * Menghasilkan ringkasan laporan tiket per bulan, sesuai format TicketAgg.
 * @returns {Promise<TicketAgg[]>}
 */
const getTicketSummaryMonthly = async () => {
  const results = await ServiceTicket.aggregate([
    {
      $project: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        status: 1,
        priority: 1,
        isResolved: { $in: ["$status", ["Selesai", "Ditutup"]] },
      },
    },
    {
      $group: {
        _id: {
          year: "$year",
          month: "$month",
        },
        created: { $sum: 1 },
        resolved: { $sum: { $cond: ["$isResolved", 1, 0] } },
        statuses: { $push: "$status" },
        priorities: { $push: "$priority" },
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            { $toString: "$_id.month" },
          ],
        },
        created: 1,
        resolved: 1,
        byStatus: {
          $arrayToObject: {
            $map: {
              input: TICKET_STATUSES,
              as: "status",
              in: {
                k: "$$status",
                v: {
                  $size: {
                    $filter: {
                      input: "$statuses",
                      cond: { $eq: ["$$this", "$$status"] },
                    },
                  },
                },
              },
            },
          },
        },
        byPriority: {
          $arrayToObject: {
            $map: {
              input: TICKET_PRIORITIES,
              as: "priority",
              in: {
                k: "$$priority",
                v: {
                  $size: {
                    $filter: {
                      input: "$priorities",
                      cond: { $eq: ["$$this", "$$priority"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    { $sort: { month: -1 } },
  ]);

  return results;
};

/**
 * Menghasilkan ringkasan laporan inventaris, sesuai format InventoryAgg.
 * @returns {Promise<InventoryAgg>}
 */
const getInventorySummary = async () => {
  const stockByCategoryAgg = await Part.aggregate([
    { $match: { status: "active" } },
    {
      $group: {
        _id: "$category",
        totalStock: { $sum: "$stock" },
      },
    },
    {
      $project: {
        _id: 0,
        k: { $ifNull: ["$_id", "Uncategorized"] },
        v: "$totalStock",
      },
    },
    { $sort: { k: 1 } },
  ]);
  const byCategory = stockByCategoryAgg.reduce((acc, item) => {
    acc[item.k] = item.v;
    return acc;
  }, {});

  const movementsInAgg = await StockMovement.aggregate([
    { $match: { type: "in" } },
    {
      $group: {
        _id: null,
        totalIn: { $sum: "$quantity" },
      },
    },
  ]);
  const movementsIn = movementsInAgg.length > 0 ? movementsInAgg[0].totalIn : 0;

  const movementsOutAgg = await StockMovement.aggregate([
    { $match: { type: "out" } },
    {
      $group: {
        _id: null,
        totalOut: { $sum: "$quantity" },
      },
    },
  ]);
  const movementsOut =
    movementsOutAgg.length > 0 ? movementsOutAgg[0].totalOut : 0;

  return {
    byCategory,
    movementsIn,
    movementsOut,
  };
};

/**
 * Menghasilkan laporan penggunaan part (dari tiket).
 * @returns {Promise<Object[]>}
 */
const getPartUsageFromTickets = async () => {
  return ServiceTicket.aggregate([
    { $match: { "actions.componentsUsed": { $exists: true, $ne: [] } } },
    { $unwind: "$actions" },
    { $unwind: "$actions.componentsUsed" },
    {
      $group: {
        _id: "$actions.componentsUsed.component",
        totalQuantityUsed: { $sum: "$actions.componentsUsed.quantity" },
      },
    },
    {
      $lookup: {
        from: "parts",
        localField: "_id",
        foreignField: "_id",
        as: "partInfo",
      },
    },
    { $match: { partInfo: { $ne: [] } } },
    { $unwind: "$partInfo" },
    {
      $project: {
        _id: 0,
        partId: "$_id",
        name: "$partInfo.name",
        category: "$partInfo.category",
        totalQuantityUsed: 1,
      },
    },
    { $sort: { totalQuantityUsed: -1 } },
  ]);
};

/**
 * Menghasilkan laporan masalah/gejala yang paling umum.
 * @returns {Promise<Object[]>}
 */
const getCommonIssues = async () => {
  return ServiceTicket.aggregate([
    { $match: { initialComplaint: { $ne: null, $ne: "" } } },
    {
      $group: {
        _id: { $toLower: "$initialComplaint" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
    { $project: { _id: 0, complaint: "$_id", occurrences: "$count" } },
  ]);
};

module.exports = {
  getTicketSummaryMonthly,
  getInventorySummary,
  getPartUsageFromTickets,
  getCommonIssues,
};
