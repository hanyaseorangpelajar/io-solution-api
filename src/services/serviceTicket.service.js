const httpStatus = require("http-status");
const {
  ServiceTicket,
  TICKET_STATUSES,
} = require("../models/serviceTicket.model");
const { Customer } = require("../models/customer.model");
const { Device } = require("../models/device.model");
const { KBEntry } = require("../models/kbEntry.model");
const { User } = require("../models/user.model");
const { ApiError, parsePagination } = require("../utils");
const { KBTag } = require("../models/kbTag.model");

const createServiceTicket = async (ticketBody, createdById) => {
  const { customer, device, initialComplaint, priority, assignee } = ticketBody;

  if (!customer || !customer.name || !customer.phone) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Customer data (name and phone) is required.",
    );
  }
  if (!device || !device.model) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Device data (model) is required.",
    );
  }
  if (!initialComplaint) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "'initialComplaint' is required.",
    );
  }

  // Asumsikan Customer model juga sudah menggunakan schema english (name, phone)
  let customerDoc = await Customer.findOneAndUpdate(
    { phone: customer.phone },
    { $set: { name: customer.name, ...customer } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  let deviceDoc;
  if (device.serialNumber) {
    deviceDoc = await Device.findOne({
      serialNumber: device.serialNumber,
      customerId: customerDoc._id,
    });
  } else {
    deviceDoc = await Device.findOne({
      model: device.model,
      brand: device.brand,
      customerId: customerDoc._id,
    });
  }

  if (!deviceDoc) {
    deviceDoc = await Device.create({
      ...device,
      customerId: customerDoc._id,
    });
  }

  const serviceTicket = await ServiceTicket.create({
    customerId: customerDoc._id,
    deviceId: deviceDoc._id,
    initialComplaint,
    status: "DIAGNOSIS",
    priority: priority || "MEDIUM",
    technicianId: assignee || null,
  });

  return serviceTicket.populate([
    { path: "customerId", select: "name phone" },
    { path: "deviceId", select: "brand model serialNumber" },
  ]);
};

const getServiceTickets = async (filter) => {
  const safe = {};

  if (filter?.status) safe.status = filter.status;
  if (filter?.customerId) safe.customerId = filter.customerId;
  if (filter?.priority) safe.priority = filter.priority;

  if (filter?.technicianId) {
    safe.technicianId =
      filter.technicianId === "unassigned" ? null : filter.technicianId;
  }

  if (filter?.q) {
    const matchingCustomers = await Customer.find({
      name: { $regex: filter.q, $options: "i" },
    }).select("_id");

    const customerIds = matchingCustomers.map((c) => c._id);

    safe.$or = [
      { ticketNumber: { $regex: filter.q, $options: "i" } },
      { initialComplaint: { $regex: filter.q, $options: "i" } },
      { customerId: { $in: customerIds } },
    ];
  }

  const { page, limit, skip } = parsePagination(filter, 20);

  const [tickets, totalResults] = await Promise.all([
    ServiceTicket.find(safe)
      .populate("customerId", "name phone")
      .populate("deviceId", "brand model serialNumber")
      .populate("technicianId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ServiceTicket.countDocuments(safe),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;
  return { results: tickets, totalResults, page, limit, totalPages };
};

const getServiceTicketById = async (ticketId) => {
  const ticket = await ServiceTicket.findById(ticketId)
    .populate("customerId")
    .populate("deviceId")
    .populate("technicianId", "name role");

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, "Service Ticket not found");
  }
  return ticket;
};

const assignServiceTicket = async (ticketId, technicianId, adminId) => {
  const ticket = await getServiceTicketById(ticketId);
  const technician = await User.findById(technicianId);

  if (!technician || technician.role !== "Teknisi") {
    throw new ApiError(httpStatus.NOT_FOUND, "Technician user not found.");
  }
  if (ticket.status !== "DIAGNOSIS") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only tickets in 'DIAGNOSIS' status can be assigned.",
    );
  }

  ticket.technicianId = technician._id;
  ticket.status = "IN_PROGRESS";

  ticket.statusHistory.push({
    newStatus: "IN_PROGRESS",
    note: `Assigned to ${technician.name} by Admin (ID: ${adminId}).`,
  });

  await ticket.save();
  return ticket;
};

const updateServiceTicketStatus = async (ticketId, statusUpdateBody, user) => {
  const { status, note } = statusUpdateBody;
  if (!status || !TICKET_STATUSES.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid new status.");
  }

  if (status === "ARCHIVED" || status === "RESOLVED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Use 'complete' endpoint to resolve or archive.`,
    );
  }

  const ticket = await getServiceTicketById(ticketId);
  if (user.role !== "Teknisi") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only Technicians can update progress status.",
    );
  }

  const isAssignedTeknisi =
    ticket.technicianId &&
    ticket.technicianId.id.toString() === user.id.toString();
  if (!isAssignedTeknisi) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not assigned to this ticket.",
    );
  }

  if (["RESOLVED", "CANCELLED", "ARCHIVED"].includes(ticket.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Ticket is in a final state and cannot be updated.",
    );
  }

  if (ticket.status === status) return ticket;

  const allowedTransitions = {
    DIAGNOSIS: ["IN_PROGRESS", "CANCELLED", "WAITING_PART"],
    IN_PROGRESS: ["WAITING_PART", "CANCELLED"],
    WAITING_PART: ["IN_PROGRESS", "CANCELLED"],
  };

  const nexts = allowedTransitions[ticket.status] || [];
  if (!nexts.includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Transition from '${ticket.status}' to '${status}' is not allowed.`,
    );
  }

  ticket.status = status;
  ticket.statusHistory.push({
    newStatus: status,
    note: note || `Status updated by ${user.name} (ID: ${user.id}).`,
  });

  if (status === "CANCELLED") {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();
  return ticket;
};

const completeByTeknisi = async (ticketId, completionBody, user) => {
  const { diagnosis, solution } = completionBody;
  if (!diagnosis || !solution) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Diagnosis and Solution are required.",
    );
  }

  const ticket = await getServiceTicketById(ticketId);

  const isAssignedTeknisi =
    ticket.technicianId &&
    ticket.technicianId.id.toString() === user.id.toString();
  if (!isAssignedTeknisi) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not assigned to this ticket.",
    );
  }

  if (["RESOLVED", "CANCELLED", "ARCHIVED"].includes(ticket.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Ticket is already in a final state.",
    );
  }

  ticket.technicianDiagnosis = diagnosis;
  ticket.technicianSolution = solution;
  ticket.status = "RESOLVED";
  ticket.resolvedAt = new Date();

  ticket.statusHistory.push({
    newStatus: "RESOLVED",
    note: `Resolved by Technician (${user.name}). Pending Admin review.`,
  });

  await ticket.save();
  return ticket;
};

const addReplacementItem = async (ticketId, itemBody) => {
  const { componentName, quantity, note } = itemBody;
  if (!componentName || !quantity || quantity < 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Component Name and Quantity are required.",
    );
  }

  const ticket = await getServiceTicketById(ticketId);
  if (["RESOLVED", "CANCELLED", "ARCHIVED"].includes(ticket.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Ticket is in a final state, cannot add items.",
    );
  }

  ticket.replacementItems.push({
    componentName,
    quantity,
    note: note || "",
  });

  await ticket.save();
  return ticket;
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

const completeTicketAndCreateKB = async (ticketId, kbBody, userId) => {
  const { diagnosis, solution, tags } = kbBody;

  if (!diagnosis || !solution) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Reviewed Diagnosis and Solution are required.",
    );
  }

  const ticket = await getServiceTicketById(ticketId);

  if (!["RESOLVED", "CANCELLED"].includes(ticket.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only 'RESOLVED' or 'CANCELLED' tickets can be reviewed.",
    );
  }

  const tagObjectIds = await findOrCreateTags(tags);

  const kbEntry = await KBEntry.create({
    symptom: ticket.initialComplaint,
    deviceModel:
      `${ticket.deviceId.brand || ""} ${ticket.deviceId.model || ""}`.trim(),
    diagnosis,
    solution,
    sourceTicketId: ticket._id,
    createdBy: userId,
    tags: tagObjectIds,
  });

  ticket.status = "ARCHIVED";
  if (!ticket.resolvedAt) ticket.resolvedAt = new Date();

  ticket.statusHistory.push({
    newStatus: "ARCHIVED",
    note: `Ticket reviewed & archived. KB (ID: ${kbEntry._id}) created by Admin (ID: ${userId}).`,
  });

  await ticket.save();
  return { ticket, kbEntry };
};

const getGlobalStatusHistory = async (filter, user) => {
  const { page, limit, skip } = parsePagination(filter, 20);
  const { q } = filter;

  const pipeline = [];

  const matchStage = {};
  if (user.role === "Teknisi") {
    matchStage.technicianId = user._id;
  }
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  pipeline.push({ $unwind: "$statusHistory" });

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "technicianId",
      foreignField: "_id",
      as: "technicianInfo",
    },
  });

  if (q) {
    const searchQuery = { $regex: q, $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { ticketNumber: searchQuery },
          { "statusHistory.note": searchQuery },
          { "statusHistory.newStatus": searchQuery },
          { "technicianInfo.name": searchQuery },
        ],
      },
    });
  }

  pipeline.push({
    $facet: {
      metadata: [{ $count: "totalResults" }],
      data: [
        { $sort: { "statusHistory.timestamp": -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: "$statusHistory._id",
            timestamp: "$statusHistory.timestamp",
            note: "$statusHistory.note",
            newStatus: "$statusHistory.newStatus",
            ticketNumber: "$ticketNumber",
            ticketId: "$_id",
            technicianName: { $arrayElemAt: ["$technicianInfo.name", 0] },
          },
        },
      ],
    },
  });

  const aggregationResult = await ServiceTicket.aggregate(pipeline);

  const results = aggregationResult[0]?.data || [];
  const totalResults = aggregationResult[0]?.metadata[0]?.totalResults || 0;
  const totalPages = Math.ceil(totalResults / limit) || 1;

  return { results, page, limit, totalResults, totalPages };
};

module.exports = {
  createServiceTicket,
  getServiceTickets,
  getServiceTicketById,
  assignServiceTicket,
  updateServiceTicketStatus,
  completeByTeknisi,
  addReplacementItem,
  completeTicketAndCreateKB,
  getGlobalStatusHistory,
};
