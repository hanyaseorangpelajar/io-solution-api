require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("./src/config/db");
const {
  User,
  Part,
  Ticket,
  StockMovement,
  RmaRecord,
  AuditRecord,
  KnowledgeEntry,
  ROLES,
  PART_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  RMA_STATUSES,
  RMA_ACTION_TYPES,
  AUDIT_STATUSES,
  STOCK_MOVE_TYPES,
} = require("./src/models");

const usersData = [
  {
    username: "sysadmin",
    email: "sysadmin@example.com",
    password: "Password123!",
    fullName: "Admin Utama",
    role: "SysAdmin",
    active: true,
  },
  {
    username: "admin_toko",
    email: "admin@example.com",
    password: "Password123!",
    fullName: "Admin Toko",
    role: "Admin",
    active: true,
  },
  {
    username: "budi_teknisi",
    email: "budi@example.com",
    password: "Password123!",
    fullName: "Budi Teknisi",
    role: "Teknisi",
    active: true,
  },
  {
    username: "siti_teknisi",
    email: "siti@example.com",
    password: "Password123!",
    fullName: "Siti Teknisi",
    role: "Teknisi",
    active: true,
  },
  {
    username: "nonaktif",
    email: "nonaktif@example.com",
    password: "Password123!",
    fullName: "User Non Aktif",
    role: "Teknisi",
    active: false,
  },
];

const partsData = [
  {
    name: "CPU Intel Core i5-13400",
    category: "cpu",
    sku: "CPU-INT-13400",
    unit: "pcs",
    stock: 15,
    price: 3500000,
  },
  {
    name: "CPU AMD Ryzen 7 7700X",
    category: "cpu",
    sku: "CPU-AMD-7700X",
    unit: "pcs",
    stock: 10,
    price: 5500000,
  },
  {
    name: "Motherboard ASUS B760M",
    category: "motherboard",
    sku: "MB-ASU-B760M",
    unit: "pcs",
    stock: 20,
    price: 2200000,
  },
  {
    name: "Motherboard Gigabyte B650",
    category: "motherboard",
    sku: "MB-GIG-B650",
    unit: "pcs",
    stock: 18,
    price: 2800000,
  },
  {
    name: "RAM Corsair Vengeance 16GB (2x8GB) DDR4 3200",
    category: "ram",
    sku: "RAM-COR-D4-16K",
    unit: "kit",
    stock: 30,
    price: 900000,
  },
  {
    name: "RAM Kingston Fury Beast 32GB (2x16GB) DDR5 5600",
    category: "ram",
    sku: "RAM-KIN-D5-32K",
    unit: "kit",
    stock: 25,
    price: 2100000,
  },
  {
    name: "SSD Samsung 980 Pro 1TB NVMe Gen4",
    category: "storage",
    sku: "SSD-SAM-980P-1T",
    unit: "pcs",
    stock: 22,
    price: 1800000,
  },
  {
    name: "SSD Crucial MX500 2TB SATA",
    category: "storage",
    sku: "SSD-CRU-MX5-2T",
    unit: "pcs",
    stock: 12,
    price: 1900000,
  },
  {
    name: "HDD Seagate Barracuda 4TB",
    category: "storage",
    sku: "HDD-SEA-BAR-4T",
    unit: "pcs",
    stock: 8,
    price: 1300000,
    status: "inactive",
  },
  {
    name: "GPU Nvidia GeForce RTX 4060 8GB",
    category: "gpu",
    sku: "GPU-NV-4060",
    unit: "pcs",
    stock: 7,
    price: 6500000,
  },
  {
    name: "GPU AMD Radeon RX 7600 8GB",
    category: "gpu",
    sku: "GPU-AMD-7600",
    unit: "pcs",
    stock: 9,
    price: 5200000,
  },
  {
    name: "PSU Corsair CX650M 650W Bronze",
    category: "psu",
    sku: "PSU-COR-CX650",
    unit: "pcs",
    stock: 25,
    price: 950000,
  },
  {
    name: "PSU Seasonic Focus GX 750W Gold",
    category: "psu",
    sku: "PSU-SEA-GX750",
    unit: "pcs",
    stock: 15,
    price: 1600000,
  },
  {
    name: "Case Cooler Master MasterBox Q300L",
    category: "case",
    sku: "CAS-CM-Q300L",
    unit: "pcs",
    stock: 10,
    price: 600000,
  },
  {
    name: "Case NZXT H5 Flow",
    category: "case",
    sku: "CAS-NZX-H5F",
    unit: "pcs",
    stock: 12,
    price: 1100000,
  },
  {
    name: "CPU Cooler Noctua NH-U12S",
    category: "cooler",
    sku: "COOL-NOC-U12S",
    unit: "pcs",
    stock: 14,
    price: 980000,
  },
  {
    name: "CPU Cooler Deepcool AK400",
    category: "cooler",
    sku: "COOL-DC-AK400",
    unit: "pcs",
    stock: 18,
    price: 350000,
  },
  {
    name: "NIC TP-Link TG-3468 Gigabit PCIe",
    category: "nic",
    sku: "NIC-TPL-3468",
    unit: "pcs",
    stock: 20,
    price: 150000,
  },
  {
    name: "Kabel UTP Cat 6 1 Meter",
    category: "others",
    sku: "CBL-UTP6-1M",
    unit: "pcs",
    stock: 100,
    price: 15000,
  },
  {
    name: "Thermal Paste Arctic MX-4 4g",
    category: "others",
    sku: "TP-ARC-MX4",
    unit: "pcs",
    stock: 40,
    price: 80000,
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected.");

    console.log("Clearing existing data (optional)...");
    await User.deleteMany({});
    await Part.deleteMany({});
    await Ticket.deleteMany({});
    await StockMovement.deleteMany({});
    await RmaRecord.deleteMany({});
    await AuditRecord.deleteMany({});
    await KnowledgeEntry.deleteMany({});
    console.log("Collections cleared.");

    console.log("Seeding Users...");
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(` - Created user: ${user.username} (Role: ${user.role})`);
    }
    const sysAdminUser = createdUsers.find((u) => u.role === "SysAdmin");
    const adminUser = createdUsers.find((u) => u.role === "Admin");
    const tekBudi = createdUsers.find((u) => u.username === "budi_teknisi");
    const tekSiti = createdUsers.find((u) => u.username === "siti_teknisi");

    if (!sysAdminUser || !adminUser || !tekBudi || !tekSiti) {
      throw new Error("Gagal membuat user dasar, seeding dibatalkan.");
    }

    console.log("Seeding Parts...");
    const createdParts = await Part.insertMany(partsData);
    console.log(` - Inserted ${createdParts.length} parts.`);
    const ramPart = createdParts.find(
      (p) => p.category === "ram" && p.name.includes("Kingston")
    );
    const ssdPart = createdParts.find(
      (p) => p.category === "storage" && p.name.includes("Samsung")
    );
    const psuPart = createdParts.find(
      (p) => p.category === "psu" && p.name.includes("Corsair")
    );
    const coolerPart = createdParts.find(
      (p) => p.category === "cooler" && p.name.includes("Deepcool")
    );
    const thermalPaste = createdParts.find(
      (p) => p.category === "others" && p.name.includes("Thermal Paste")
    );

    if (!ramPart || !ssdPart || !psuPart || !coolerPart || !thermalPaste) {
      console.warn("Warning: Beberapa part contoh tidak ditemukan ID-nya.");
    }

    console.log("Seeding Tickets...");
    const ticketsData = [
      {
        subject: "PC Lambat Setelah Update Windows",
        requester: "Customer A",
        priority: "medium",
        status: "open",
        createdBy: adminUser._id,
        description: "Booting jadi lama, aplikasi sering not responding.",
      },
      {
        subject: "Layar Laptop Bergaris",
        requester: "Customer B",
        priority: "high",
        status: "in_progress",
        assignee: tekBudi._id,
        createdBy: adminUser._id,
        description: "Muncul garis vertikal warna-warni setelah terjatuh.",
      },
      {
        subject: "Install Ulang OS + Backup Data",
        requester: "Customer C",
        priority: "low",
        status: "open",
        createdBy: adminUser._id,
      },
      {
        subject: "Komputer Mati Total",
        requester: "Customer D",
        priority: "urgent",
        status: "in_progress",
        assignee: tekSiti._id,
        createdBy: adminUser._id,
        description: "Tidak ada tanda kehidupan saat tombol power ditekan.",
      },
      {
        subject: "CPU Overheat Saat Gaming",
        requester: "Customer E",
        priority: "high",
        status: "resolved",
        assignee: tekBudi._id,
        createdBy: adminUser._id,
        description: "Suhu CPU mencapai 90C+",
        resolution: {
          rootCause: "Cooler CPU bawaan tidak memadai & thermal paste kering.",
          solution:
            "Ganti CPU Cooler aftermarket (Deepcool AK400) dan thermal paste baru.",
          parts:
            coolerPart && thermalPaste
              ? [
                  { partId: coolerPart._id, name: coolerPart.name, qty: 1 },
                  { partId: thermalPaste._id, name: thermalPaste.name, qty: 1 },
                ]
              : [],
          tags: ["cooling", "hardware", "gaming", "overheat"],
          resolvedBy: tekBudi._id,
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      {
        subject: "Upgrade RAM Laptop",
        requester: "Customer F",
        priority: "medium",
        status: "resolved",
        assignee: tekSiti._id,
        createdBy: adminUser._id,
        description: "Laptop lemot, minta tambah RAM dari 8GB ke 16GB.",
        resolution: {
          rootCause: "Kapasitas RAM kurang untuk multitasking.",
          solution: "Tambah 1 keping RAM 8GB DDR4 SODIMM yang kompatibel.",
          parts: ramPart
            ? [{ partId: ramPart._id, name: ramPart.name, qty: 1 }]
            : [],
          tags: ["upgrade", "ram", "laptop", "performance"],
          resolvedBy: tekSiti._id,
          resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      },
      {
        subject: "Printer Tidak Terdeteksi",
        requester: "Customer G",
        priority: "medium",
        status: "closed",
        assignee: tekBudi._id,
        createdBy: adminUser._id,
        description: "Printer Canon MG2570 tidak muncul.",
        finalResult: "Instal driver ulang.",
      },
    ];
    const createdTickets = [];
    for (const ticketData of ticketsData) {
      const ticket = await Ticket.create(ticketData);
      createdTickets.push(ticket);
    }
    console.log(` - Created ${createdTickets.length} tickets.`);
    const resolvedTicket1 = createdTickets.find(
      (t) => t.subject === "CPU Overheat Saat Gaming"
    );
    const resolvedTicket2 = createdTickets.find(
      (t) => t.subject === "Upgrade RAM Laptop"
    );

    console.log("Seeding Stock Movements...");
    const stockMovementsData = [];
    if (ramPart)
      stockMovementsData.push({
        part: ramPart._id,
        partNameSnapshot: ramPart.name,
        type: "in",
        quantity: 50,
        reference: "PO-1001",
        user: adminUser._id,
        notes: "Stok awal RAM Kingston",
      });
    if (ssdPart)
      stockMovementsData.push({
        part: ssdPart._id,
        partNameSnapshot: ssdPart.name,
        type: "in",
        quantity: 30,
        reference: "PO-1002",
        user: adminUser._id,
        notes: "Stok awal SSD Samsung",
      });
    if (psuPart)
      stockMovementsData.push({
        part: psuPart._id,
        partNameSnapshot: psuPart.name,
        type: "in",
        quantity: 25,
        reference: "PO-1003",
        user: adminUser._id,
      });
    if (resolvedTicket1 && coolerPart)
      stockMovementsData.push({
        part: coolerPart._id,
        partNameSnapshot: coolerPart.name,
        type: "out",
        quantity: 1,
        reference: resolvedTicket1.code,
        user: tekBudi._id,
        notes: "Dipakai u/ tiket overheat",
      });
    if (resolvedTicket1 && thermalPaste)
      stockMovementsData.push({
        part: thermalPaste._id,
        partNameSnapshot: thermalPaste.name,
        type: "out",
        quantity: 1,
        reference: resolvedTicket1.code,
        user: tekBudi._id,
        notes: "Dipakai u/ tiket overheat",
      });
    if (resolvedTicket2 && ramPart)
      stockMovementsData.push({
        part: ramPart._id,
        partNameSnapshot: ramPart.name,
        type: "out",
        quantity: 1,
        reference: resolvedTicket2.code,
        user: tekSiti._id,
        notes: "Dipakai u/ upgrade RAM",
      });
    if (ssdPart)
      stockMovementsData.push({
        part: ssdPart._id,
        partNameSnapshot: ssdPart.name,
        type: "adjust",
        quantity: 1,
        reference: "ADJ-001",
        user: adminUser._id,
        notes: "Koreksi stok fisik, hilang 1",
      });

    if (stockMovementsData.length > 0) {
      const createdMovements = await StockMovement.insertMany(
        stockMovementsData
      );
      console.log(` - Inserted ${createdMovements.length} stock movements.`);
      const adjMovement = createdMovements.find((m) => m.type === "adjust");
      if (adjMovement && ssdPart) {
        await Part.updateOne(
          { _id: ssdPart._id },
          { $inc: { stock: -adjMovement.quantity } }
        );
        console.log(`   - Adjusted stock for ${ssdPart.name}`);
      }
    } else {
      console.log(" - No stock movements to seed.");
    }

    console.log("Seeding RMA Records...");
    const rmaRecordsData = [];
    if (resolvedTicket1)
      rmaRecordsData.push({
        title: "Klaim Garansi Cooler CPU Bawaan",
        customerName: "Customer E",
        productName: "Cooler Stock Intel",
        ticket: resolvedTicket1._id,
        issueDesc: "Tidak mampu mendinginkan CPU",
        status: "new",
      });
    rmaRecordsData.push({
      title: "Klaim PSU Mati",
      customerName: "Customer H",
      productName: "PSU Merk X 500W",
      issueDesc: "PSU mati total setelah 6 bulan",
      status: "received",
      warranty: {
        purchaseDate: new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000),
        warrantyMonths: 12,
        serial: "PSUX-123",
        vendor: "Distributor C",
      },
    });
    const createdRmas = [];
    for (const rmaData of rmaRecordsData) {
      const rma = await RmaRecord.create(rmaData);
      if (rma.status === "received") {
        await RmaRecord.findByIdAndUpdate(rma._id, {
          $push: {
            actions: {
              type: "receive_unit",
              note: "Unit PSU diterima",
              by: adminUser._id,
              at: new Date(),
            },
          },
        });
      }
      createdRmas.push(rma);
    }
    console.log(` - Created ${createdRmas.length} RMA records.`);

    console.log("Seeding Audit Records...");
    const auditRecordsData = [];
    if (resolvedTicket1)
      auditRecordsData.push({
        ticket: resolvedTicket1._id,
        ticketCode: resolvedTicket1.code,
        reviewer: adminUser._id,
        status: "approved",
        score: 90,
        notes: "Solusi tepat, komponen diganti.",
        tags: ["cooling", "hardware"],
        publish: true,
        reviewedAt: new Date(),
      });
    if (resolvedTicket2)
      auditRecordsData.push({
        ticket: resolvedTicket2._id,
        ticketCode: resolvedTicket2.code,
        reviewer: adminUser._id,
        status: "approved",
        score: 85,
        notes: "Upgrade RAM berhasil.",
        tags: ["upgrade", "ram", "laptop"],
        publish: true,
        reviewedAt: new Date(),
      });
    if (auditRecordsData.length > 0) {
      const createdAudits = await AuditRecord.insertMany(auditRecordsData);
      console.log(` - Inserted ${createdAudits.length} audit records.`);
    } else {
      console.log(" - No audit records to seed.");
    }

    console.log("Seeding Knowledge Entries...");
    const knowledgeEntriesData = [];
    const auditsToPublish = await AuditRecord.find({
      publish: true,
      status: "approved",
    }).populate("ticket");
    for (const audit of auditsToPublish) {
      const ticket = audit.ticket;
      if (ticket && ticket.resolution) {
        const existingKE = await KnowledgeEntry.findOne({
          sourceTicket: ticket._id,
        });
        if (!existingKE) {
          const { rootCause, solution, parts } = ticket.resolution;
          const relatedComponentIds = parts.map((p) => p.partId);
          knowledgeEntriesData.push({
            title: `Solusi Audit: ${ticket.subject || `Tiket ${ticket.code}`}`,
            symptom: ticket.initialComplaint || ticket.subject || rootCause,
            diagnosis: rootCause,
            solution: solution,
            relatedComponents: relatedComponentIds,
            sourceTicket: ticket._id,
            tags: audit.tags,
            isPublished: true,
          });
        }
      }
    }
    if (knowledgeEntriesData.length > 0) {
      const createdKE = await KnowledgeEntry.insertMany(knowledgeEntriesData);
      console.log(
        ` - Inserted ${createdKE.length} knowledge entries from audits.`
      );
    } else {
      console.log(" - No knowledge entries to seed from audits.");
    }

    console.log("✅ Database seeding finished successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    console.log("Disconnecting database...");
    await disconnectDB();
    console.log("Database disconnected.");
  }
};

seedDatabase();
