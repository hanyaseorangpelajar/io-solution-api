const express = require("express");
const models = require("../models");
const { catchAsync } = require("../utils");

const router = express.Router();

router.post(
  "/reset-db",
  catchAsync(async (req, res) => {
    const SAFE_KEYS = [
      "userModel",
      "serviceTicketModel",
      "kbEntryModel",
      "deviceModel",
      "customerModel",
      "kbTagModel",
      "loginAttemptModel",
    ];

    const deletions = {};
    for (const k of SAFE_KEYS) {
      const modelWrapper = models[k];

      if (!modelWrapper) {
        deletions[k] = "Key tidak ditemukan di models/index.js";
        continue;
      }

      const modelName = Object.keys(modelWrapper).find(
        (key) =>
          key !== "ROLES" &&
          key !== "TICKET_STATUSES" &&
          typeof modelWrapper[key] === "function"
      );

      const ActualModel = modelName ? modelWrapper[modelName] : null;

      if (ActualModel && typeof ActualModel.deleteMany === "function") {
        const r = await ActualModel.deleteMany({});
        deletions[modelName] = `${r.deletedCount} dihapus`;
      } else {
        deletions[k] = `Model tidak ditemukan di dalam '${k}'`;
      }
    }
    return res
      .status(200)
      .json({ message: "Database Dikosongkan", results: deletions });
  })
);

module.exports = router;
