const models = require("../models");

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
  const M = models[k];
  if (M && typeof M.deleteMany === "function") {
    const r = await M.deleteMany({});
    deletions[k] = `${r.deletedCount} dihapus`;
  }
}
return res.status(200).json({ message: "Cleared", results: deletions });
