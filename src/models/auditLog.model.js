// src/models/auditLog.model.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    // identitas request
    rid: { type: String, index: true }, // request id
    method: { type: String, index: true },
    path: { type: String }, // originalUrl (dengan query)
    routeKey: { type: String, index: true }, // pola route (mis. /api/v1/tickets/:id)

    // hasil
    status: { type: Number, index: true },
    durationMs: { type: Number, default: 0 },

    // actor & lingkungan
    actor: { type: String, default: null, index: true }, // isi dari req.user.id nanti
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },

    // resource (opsional — di-tag oleh controller)
    resourceType: { type: String, default: null, index: true }, // "ticket", dst
    resourceId: { type: String, default: null, index: true },

    // ringkasan aman (tidak menyimpan body penuh)
    query: { type: Object, default: {} },
    bodyKeys: { type: [String], default: [] },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ routeKey: 1, status: 1, createdAt: -1 });

module.exports = {
  AuditLog: mongoose.model("AuditLog", AuditLogSchema),
};
