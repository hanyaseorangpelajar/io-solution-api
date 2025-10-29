const express = require("express");
const router = express.Router();
require("express-async-errors");

const {
  User,
  Ticket,
  Part,
  KnowledgeEntry,
  AuditRecord,
  RmaRecord,
  StockMovement,
} = require("../models");

/**
 * @route   POST /api/v1/test/reset-db
 * @desc    (DEV ONLY) Menghapus semua data dari koleksi utama untuk testing
 * @access  Public (Hanya di environment non-production)
 */
router.post("/reset-db", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res
      .status(403)
      .json({ message: "Operasi ini dilarang di production." });
  }

  try {
    const results = {};

    const models = {
      users: User,
      tickets: Ticket,
      parts: Part,
      knowledgeEntries: KnowledgeEntry,
      auditRecords: AuditRecord,
      rmaRecords: RmaRecord,
      stockMovements: StockMovement,
    };

    for (const [key, model] of Object.entries(models)) {
      if (model) {
        const r = await model.deleteMany({});
        results[key] = `${r.deletedCount} dihapus`;
      }
    }

    res.status(200).json({ message: "Database collections cleared!", results });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting database", error: error.message });
  }
});

/**
 * @route   POST /api/v1/test/seed/all
 * @desc    (DEV ONLY) Menghapus semua data dan membuat data sampel baru
 * @access  Public (Hanya di environment non-production)
 */
router.post("/seed/all", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res
      .status(403)
      .json({ message: "Operasi ini dilarang di production." });
  }

  try {
    console.log("[SEEDER] Memulai master seed...");

    console.log("[SEEDER] Menghapus data lama...");
    await Promise.all([
      User.deleteMany({}),
      Ticket.deleteMany({}),
      Part.deleteMany({}),
      RmaRecord.deleteMany({}),
      StockMovement.deleteMany({}),
      AuditRecord.deleteMany({}),
      KnowledgeEntry.deleteMany({}),
    ]);
    console.log("[SEEDER] Data lama bersih.");

    const users = await User.create([
      {
        username: "sysadmin",
        fullName: "SysAdmin User",
        email: "sysadmin@local.host",
        password: "password123",
        role: "SysAdmin",
        isActive: true,
      },
      {
        username: "admin",
        fullName: "Admin User",
        email: "admin@local.host",
        password: "password123",
        role: "Admin",
        isActive: true,
      },
      {
        username: "teknisi",
        fullName: "Teknisi User",
        email: "teknisi@local.host",
        password: "password123",
        role: "Teknisi",
        isActive: true,
      },
    ]);
    console.log(`[SEEDER] ${users.length} Users dibuat.`);

    const sysAdminId = users[0]._id;
    const adminId = users[1]._id;
    const teknisiId = users[2]._id;

    const parts = await Part.insertMany([
      {
        name: "RAM DDR4 8GB 3200MHz",
        sku: "RAM-D4-8G",
        stock: 10,
        price: 300000,
        status: "active",
      },
      {
        name: "SSD 512GB NVMe Gen3",
        sku: "SSD-NV-512",
        stock: 5,
        price: 600000,
        status: "active",
      },
      {
        name: "Thermal Paste MX-4 4g",
        sku: "PASTE-MX4",
        stock: 20,
        price: 50000,
        status: "active",
      },
      {
        name: "PSU 550W Bronze",
        sku: "PSU-550-BR",
        stock: 0,
        price: 750000,
        status: "inactive",
      },
    ]);
    console.log(`[SEEDER] ${parts.length} Parts dibuat.`);

    const ramPartId = parts[0]._id;
    const ssdPartId = parts[1]._id;

    const ticketsData = [
      {
        subject: "PC Lambat, butuh upgrade RAM",
        requester: "Budi (Accounting)",
        assignee: teknisiId,
        priority: "medium",
        status: "in_progress",
        createdBy: adminId,
        diagnostics: [],
        actions: [
          {
            actionTaken: "...",
            partsUsed: [{ part: ramPartId, quantity: 1 }],
            timestamp: new Date(),
          },
        ],
      },
      {
        subject: "Monitor Mati",
        requester: "Citra (Marketing)",
        assignee: teknisiId,
        priority: "high",
        status: "open",
        createdBy: adminId,
      },
      {
        subject: "Printer tidak terdeteksi",
        requester: "Rahmat (HR)",
        priority: "low",
        status: "resolved",
        assignee: teknisiId,
        createdBy: adminId,
        resolution: {
          rootCause: "Driver printer korup atau terhapus.",
          solution: "Driver printer diinstall ulang dari website resmi.",
          resolvedBy: teknisiId,
          resolvedAt: new Date(Date.now() - 86400000),
          parts: [],
          tags: ["driver", "printer"],
        },
      },
      {
        subject: "Laptop gagal booting, Blue Screen",
        requester: "Sari (Sales)",
        assignee: teknisiId,
        priority: "urgent",
        status: "resolved",
        createdBy: adminId,
        diagnostics: [
          {
            symptom:
              "Laptop blue screen saat startup, error INACCESSIBLE_BOOT_DEVICE.",
            diagnosis: "Hard disk lama terdeteksi bad sector parah.",
            timestamp: new Date(Date.now() - 86400000 * 3),
          },
        ],
        actions: [
          {
            actionTaken: "Hard disk diganti dengan SSD NVMe 512GB baru.",
            partsUsed: [{ part: ssdPartId, quantity: 1 }],
            timestamp: new Date(Date.now() - 86400000 * 2),
          },
          {
            actionTaken: "Install ulang Windows 11 dan driver.",
            partsUsed: [],
            timestamp: new Date(Date.now() - 86400000),
          },
        ],
        resolution: {
          rootCause: "Kegagalan hard disk (bad sector).",
          solution:
            "Penggantian hard disk dengan SSD baru dan instalasi ulang OS.",
          parts: [
            { partId: ssdPartId.toString(), name: parts[1].name, qty: 1 },
          ],
          resolvedBy: teknisiId,
          resolvedAt: new Date(Date.now() - 86400000),
          tags: ["ssd", "booting", "hardware"],
        },
      },
    ];

    const tickets = [];
    for (const ticketDoc of ticketsData) {
      const ticket = new Ticket(ticketDoc);
      const savedTicket = await ticket.save();
      tickets.push(savedTicket);
    }
    console.log(
      `[SEEDER] ${tickets.length} Tickets dibuat (satu per satu via save).`
    );

    const rmas = await RmaRecord.insertMany([
      {
        code: "RMA-2025-0001",
        title: "VGA Artefak",
        customerName: "Budi Santoso",
        productName: "GeForce RTX 4070",
        status: "sent_to_vendor",
        warranty: { serial: "SN-VGA-123", vendor: "PT. Naga Jaya" },
        actions: [
          {
            type: "receive_unit",
            note: "Unit diterima",
            by: adminId,
            at: new Date(Date.now() - 86400000 * 2),
          },
          {
            type: "send_to_vendor",
            note: "Dikirim ke vendor",
            by: adminId,
            at: new Date(),
          },
        ],
      },
    ]);
    console.log(`[SEEDER] ${rmas.length} RMA dibuat.`);

    const moves = await StockMovement.insertMany([
      {
        part: parts[0]._id,
        partNameSnapshot: parts[0].name,
        type: "in",
        quantity: 10,
        reference: "STOK-AWAL",
        user: sysAdminId,
        at: new Date(Date.now() - 86400000 * 7),
      },
      {
        part: parts[1]._id,
        partNameSnapshot: parts[1].name,
        type: "in",
        quantity: 5,
        reference: "STOK-AWAL",
        user: sysAdminId,
        at: new Date(Date.now() - 86400000 * 7),
      },
      {
        part: parts[2]._id,
        partNameSnapshot: parts[2].name,
        type: "in",
        quantity: 20,
        reference: "STOK-AWAL",
        user: sysAdminId,
        at: new Date(Date.now() - 86400000 * 7),
      },
      {
        part: parts[0]._id,
        partNameSnapshot: parts[0].name,
        type: "out",
        quantity: 1,
        reference: tickets[0].code,
        notes: `Otomatis dari tiket ${tickets[0].code}`,
        user: teknisiId,
        at: new Date(),
      },
      {
        part: parts[1]._id,
        partNameSnapshot: parts[1].name,
        type: "out",
        quantity: 1,
        reference: tickets[3].code,
        notes: `Otomatis dari tiket ${tickets[3].code}`,
        user: teknisiId,
        at: new Date(Date.now() - 86400000 * 2),
      },
    ]);
    console.log(
      `[SEEDER] ${moves.length} Stock Movements dibuat (termasuk dari tiket).`
    );

    await Part.findByIdAndUpdate(ramPartId, { $inc: { stock: -1 } });
    await Part.findByIdAndUpdate(ssdPartId, { $inc: { stock: -1 } });
    console.log("[SEEDER] Stok parts diupdate sesuai tiket.");

    const audits = await AuditRecord.insertMany([
      {
        ticket: tickets[2]._id,
        ticketCode: tickets[2].code,
        reviewer: adminId,
        reviewedAt: new Date(),
        status: "approved",
        score: 85,
        notes: "Solusi standar, penyelesaian cepat.",
        tags: ["driver", "printer", "instalasi"],
        publish: true,
      },
      {
        ticket: tickets[0]._id,
        ticketCode: tickets[0].code,
        reviewer: sysAdminId,
        status: "draft",
        score: 90,
        notes: "Menunggu penyelesaian tiket.",
        tags: ["upgrade", "ram"],
        publish: false,
      },
      {
        ticket: tickets[3]._id,
        ticketCode: tickets[3].code,
        reviewer: adminId,
        reviewedAt: new Date(),
        status: "approved",
        score: 95,
        notes: "Penggantian SSD berhasil mengatasi masalah booting.",
        tags: ["ssd", "booting", "bluescreen", "instalasi"],
        publish: true,
      },
    ]);
    console.log(`[SEEDER] ${audits.length} Audit Records dibuat.`);

    const knowledgeEntriesData = [
      {
        title: "Mengatasi Error Printer Tidak Terdeteksi",
        symptom: "Printer tidak terdeteksi oleh komputer.",
        diagnosis:
          tickets[2].resolution?.rootCause ||
          "Driver printer korup atau terhapus.",
        solution:
          tickets[2].resolution?.solution || "Install ulang driver printer.",
        sourceTicket: tickets[2]._id,
        content:
          "Pastikan kabel USB terhubung dengan baik.\nCoba install ulang driver printer terbaru dari website resmi vendor.\nRestart service Print Spooler.\nPastikan printer menyala.",
        tags: ["printer", "driver", "troubleshooting", "offline"],
        author: adminId,
        isPublished: true,
      },
      {
        title: "Mengatasi Laptop Gagal Booting (SSD)",
        symptom:
          tickets[3].diagnostics[0]?.symptom ||
          "Laptop blue screen saat startup.",
        diagnosis:
          tickets[3].resolution?.rootCause ||
          "Kegagalan hard disk (bad sector).",
        solution:
          tickets[3].resolution?.solution ||
          "Ganti hard disk dengan SSD baru, install ulang OS.",
        sourceTicket: tickets[3]._id,
        content:
          "Jika error INACCESSIBLE_BOOT_DEVICE muncul, kemungkinan besar masalah ada di storage.\nCoba boot dari USB live OS untuk cek kesehatan disk.\nJika disk gagal, perlu diganti.\nSetelah ganti SSD, lakukan instalasi OS bersih.",
        tags: ["ssd", "booting", "bluescreen", "hardware", "instalasi"],
        author: teknisiId,
        isPublished: true,
      },
    ];
    const knowledgeEntries = await KnowledgeEntry.insertMany(
      knowledgeEntriesData
    );
    console.log(
      `[SEEDER] ${knowledgeEntries.length} Knowledge Entries dibuat.`
    );

    console.log("[SEEDER] Master seed selesai.");
    res.status(201).json({
      message: "Seeding semua koleksi berhasil.",
      data: {
        users: users.length,
        parts: parts.length,
        tickets: tickets.length,
        rmas: rmas.length,
        stockMovements: moves.length,
        audits: audits.length,
        knowledgeEntries: knowledgeEntries.length,
      },
    });
  } catch (error) {
    console.error("[SEEDER] ERROR:", error.message);
    res.status(500).json({
      message: "Seeding gagal",
      error: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
