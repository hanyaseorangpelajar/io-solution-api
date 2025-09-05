// src/utils/dto.js
function toIso(d) {
  return d ? new Date(d).toISOString() : null;
}

function mapTicket(doc) {
  if (!doc) return null;
  const t = doc.toObject ? doc.toObject() : doc;
  return {
    id: t._id?.toString(),
    code: t.code,
    subject: t.subject,
    description: t.description ?? "",
    status: t.status,
    priority: t.priority,
    requester: t.requester,
    requesterEmail: t.requesterEmail || "",
    assignee: t.assignee || "",
    tags: Array.isArray(t.tags) ? t.tags : [],
    attachments: Array.isArray(t.attachments) ? t.attachments : [],
    slaDueAt: toIso(t.slaDueAt),
    createdAt: toIso(t.createdAt),
    updatedAt: toIso(t.updatedAt),
    resolution: t.resolution
      ? {
          note: t.resolution.note || "",
          cause: t.resolution.cause || "",
          solution: t.resolution.solution || "",
          resolvedAt: toIso(t.resolution.resolvedAt),
        }
      : null,
  };
}

function mapTickets(list) {
  return list.map(mapTicket);
}

module.exports = { mapTicket, mapTickets, toIso };
