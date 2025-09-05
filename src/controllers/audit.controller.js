// src/controllers/audit.controller.js
const service = require("../services/audit.service");

async function list(req, res) {
  const result = await service.listAudit(req.query);
  res.json(result);
}

async function detail(req, res) {
  const item = await service.getAuditById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error("Audit log tidak ditemukan");
  }
  res.json(item);
}

module.exports = { list, detail };
