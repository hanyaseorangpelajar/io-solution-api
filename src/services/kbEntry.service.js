const httpStatus = require("http-status");
const { KBEntry } = require("../models/kbEntry.model");
const { KBTag } = require("../models/kbTag.model");
const { ApiError, parsePagination } = require("../utils");
const { ServiceTicket } = require("../models/serviceTicket.model");

const checkAuthorization = async (entry, user) => {
  if (user.role === "ADMIN" || user.role === "SYSADMIN") {
    return;
  }
  if (user.role === "TEKNISI") {
    const ticket = await ServiceTicket.findById(entry.sourceTicketId).select(
      "technicianId",
    );
    if (!ticket) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Tiket sumber untuk entri KB ini tidak ditemukan.",
      );
    }
    if (ticket.technicianId?.toString() !== user.id.toString()) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Akses ditolak. Anda hanya dapat mengelola entri KB dari tiket yang Anda tangani.",
      );
    }
    return;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "Akses ditolak.");
};

const findOrCreateTags = async (tagNames) => {
  if (!Array.isArray(tagNames) || tagNames.length === 0) return [];

  const tagIds = [];
  const uniqueNormalizedTags = [
    ...new Set(tagNames.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ];

  for (const tagName of uniqueNormalizedTags) {
    try {
      const tag = await KBTag.findOneAndUpdate(
        { name: tagName },
        { $setOnInsert: { name: tagName } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      tagIds.push(tag._id);
    } catch (error) {
      console.warn(`Failed processing tag '${tagName}': ${error.message}`);
    }
  }
  return tagIds;
};

const getKBEntries = async (filter) => {
  const { page, limit, skip } = parsePagination(filter, 10);
  const safe = {};

  if (filter.q) {
    safe.$or = [
      { symptom: { $regex: filter.q, $options: "i" } },
      { deviceModel: { $regex: filter.q, $options: "i" } },
      { diagnosis: { $regex: filter.q, $options: "i" } },
      { solution: { $regex: filter.q, $options: "i" } },
    ];
  }

  if (filter.tag) {
    const tagDoc = await KBTag.findOne({ name: filter.tag.toLowerCase() });
    if (tagDoc) safe.tags = tagDoc._id;
  }

  const [results, totalResults] = await Promise.all([
    KBEntry.find(safe)
      .populate("createdBy", "name")
      .populate("sourceTicketId", "ticketNumber technicianId")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    KBEntry.countDocuments(safe),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;
  return { results, page, limit, totalResults, totalPages };
};

const getKBEntryById = async (kbId) => {
  const entry = await KBEntry.findById(kbId)
    .populate({
      path: "sourceTicketId",
      select: "ticketNumber initialComplaint createdAt deviceId technicianId",
      populate: [
        { path: "deviceId", select: "model brand" },
        { path: "technicianId", select: "name" },
      ],
    })
    .populate("tags", "name")
    .populate("createdBy", "name");

  if (!entry) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Knowledge Base Entry tidak ditemukan",
    );
  }
  return entry;
};

const updateKBEntry = async (kbId, updateBody, user) => {
  const entry = await getKBEntryById(kbId);
  await checkAuthorization(entry, user);

  if (updateBody.symptom) entry.symptom = updateBody.symptom;
  if (updateBody.deviceModel) entry.deviceModel = updateBody.deviceModel;
  if (updateBody.diagnosis) entry.diagnosis = updateBody.diagnosis;
  if (updateBody.solution) entry.solution = updateBody.solution;

  if (typeof updateBody.imageUrl === "string" || updateBody.imageUrl === null) {
    entry.imageUrl = updateBody.imageUrl;
  }

  if (Array.isArray(updateBody.tags)) {
    const tagObjectIds = await findOrCreateTags(updateBody.tags);
    entry.tags = tagObjectIds;
  }

  await entry.save();
  return getKBEntryById(kbId);
};

const deleteKBEntry = async (kbId, user) => {
  const entry = await getKBEntryById(kbId);
  await checkAuthorization(entry, user);
  await entry.deleteOne();
  return entry;
};

module.exports = {
  getKBEntries,
  getKBEntryById,
  updateKBEntry,
  deleteKBEntry,
  findOrCreateTags,
};
