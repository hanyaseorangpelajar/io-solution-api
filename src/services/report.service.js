// src/services/report.service.js
const { ServiceTicket } = require("../models/serviceTicket.model");
const mongoose = require("mongoose");

/**
 * Menghasilkan ringkasan laporan tiket.
 * @returns {Promise<Object>}
 */
const getTicketSummary = async () => {
  const ticketsByStatus = await ServiceTicket.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  const ticketsByTechnician = await ServiceTicket.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    {
      $group: {
        _id: "$assignedTo",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "technicianInfo",
      },
    },
    { $unwind: "$technicianInfo" },
    {
      $project: {
        _id: 0,
        technician: {
          id: "$technicianInfo._id",
          username: "$technicianInfo.username",
          fullName: "$technicianInfo.fullName",
        },
        ticketCount: "$count",
      },
    },
    { $sort: { ticketCount: -1 } },
  ]);

  const totalTickets = await ServiceTicket.countDocuments();

  return {
    totalTickets,
    byStatus: ticketsByStatus,
    byTechnician: ticketsByTechnician,
  };
};

/**
 * Menghasilkan laporan penggunaan komponen.
 * @returns {Promise<Object[]>}
 */
const getComponentUsage = async () => {
  return ServiceTicket.aggregate([
    // 1. Deconstruct the actions array
    { $unwind: "$actions" },
    // 2. Deconstruct the componentsUsed array
    { $unwind: "$actions.componentsUsed" },
    // 3. Group by component ID and sum the quantity
    {
      $group: {
        _id: "$actions.componentsUsed.component",
        totalQuantityUsed: { $sum: "$actions.componentsUsed.quantity" },
      },
    },
    // 4. Lookup component details
    {
      $lookup: {
        from: "components",
        localField: "_id",
        foreignField: "_id",
        as: "componentInfo",
      },
    },
    // 5. Deconstruct the componentInfo array
    { $unwind: "$componentInfo" },
    // 6. Project to the final shape
    {
      $project: {
        _id: 0,
        componentId: "$_id",
        name: "$componentInfo.name",
        type: "$componentInfo.type",
        totalQuantityUsed: 1,
      },
    },
    // 7. Sort by the most used
    { $sort: { totalQuantityUsed: -1 } },
  ]);
};

/**
 * Menghasilkan laporan masalah/gejala yang paling umum.
 * @returns {Promise<Object[]>}
 */
const getCommonIssues = async () => {
  return ServiceTicket.aggregate([
    {
      $group: {
        _id: { $toLower: "$initialComplaint" }, // Group by complaint, case-insensitive
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 }, // Batasi hingga 20 masalah paling umum
    { $project: { _id: 0, complaint: "$_id", occurrences: "$count" } },
  ]);
};

module.exports = {
  getTicketSummary,
  getComponentUsage,
  getCommonIssues,
};
