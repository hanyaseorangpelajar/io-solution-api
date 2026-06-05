require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker/locale/id_ID");

const { connectDB, disconnectDB } = require("../src/config/db");
const { User } = require("../src/models/user.model");
const { Customer } = require("../src/models/customer.model");
const { Device } = require("../src/models/device.model");
const { ServiceTicket } = require("../src/models/serviceTicket.model");
const { KBTag } = require("../src/models/kbTag.model");
const { KBEntry } = require("../src/models/kbEntry.model");
const { LoginAttempt } = require("../src/models/loginAttempt.model");

const pickRandom = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

const pickRandomMultiple = (arr, num) => {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return [...new Set(shuffled.slice(0, num))];
};

const seedDatabase = async () => {
  try {
    console.log("Menyambungkan ke database...");
    await connectDB();
    console.log("Database tersambung.");

    console.log("Membersihkan data lama...");
    await LoginAttempt.deleteMany({});
    await KBEntry.deleteMany({});
    await KBTag.deleteMany({});
    await ServiceTicket.deleteMany({});
    await Device.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
    console.log("Data lama berhasil dibersihkan.");

    console.log("Seeding Users...");
    const usersData = [
      {
        name: "Admin Utama",
        username: "admin",
        passwordHash: "admin123",
        role: "ADMIN",
        isActive: true,
      },
      {
        name: "System Admin",
        username: "sysadmin",
        passwordHash: "sysadmin123",
        role: "SYSADMIN",
        isActive: true,
      },
      {
        name: "Budi Teknisi",
        username: "budi",
        passwordHash: "teknisi123",
        role: "TEKNISI",
        isActive: true,
      },
    ];

    for (let i = 1; i <= 5; i++) {
      usersData.push({
        name: faker.person.fullName(),
        username: "teknisi" + i,
        passwordHash: "password123",
        role: "TEKNISI",
        isActive: true,
      });
    }
    const createdUsers = await User.create(usersData);
    console.log(` - Berhasil memasukkan ${createdUsers.length} users.`);

    console.log("Seeding Customers...");
    const customersData = [];
    for (let i = 0; i < 20; i++) {
      customersData.push({
        name: faker.person.fullName(),
        phone: "08" + faker.string.numeric(9),
        address: faker.location.streetAddress(),
        note: faker.helpers.arrayElement(["Pelanggan VIP", "Biasa", ""]),
      });
    }
    const createdCustomers = await Customer.create(customersData);
    console.log(` - Berhasil memasukkan ${createdCustomers.length} customers.`);

    console.log("Seeding Devices...");
    const devicesData = [];
    for (let i = 0; i < 25; i++) {
      const customer = pickRandom(createdCustomers);
      devicesData.push({
        customerId: customer._id,
        type: faker.helpers.arrayElement(["Laptop", "PC Desktop", "Printer"]),
        brand: faker.helpers.arrayElement(["Asus", "Lenovo", "HP", "Epson"]),
        model: faker.commerce.productName(),
        serialNumber: faker.string.alphanumeric(10).toUpperCase(),
      });
    }
    const createdDevices = await Device.create(devicesData);
    console.log(` - Berhasil memasukkan ${createdDevices.length} devices.`);

    console.log("Seeding Service Tickets...");
    const teknisiUsers = createdUsers.filter((u) => u.role === "TEKNISI");
    const ticketsData = [];
    for (let i = 0; i < 40; i++) {
      const device = pickRandom(createdDevices);
      const isAssigned = faker.datatype.boolean({ probability: 0.8 });
      const teknisi = isAssigned ? pickRandom(teknisiUsers) : null;
      const status = isAssigned
        ? faker.helpers.arrayElement([
            "IN_PROGRESS",
            "WAITING_PART",
            "RESOLVED",
          ])
        : "DIAGNOSIS";

      ticketsData.push({
        ticketNumber: `SRV-2025-${String(i + 1).padStart(6, "0")}`,
        customerId: device.customerId,
        deviceId: device._id,
        technicianId: teknisi ? teknisi._id : null,
        initialComplaint: faker.lorem.sentence(),
        priority: faker.helpers.arrayElement([
          "LOW",
          "MEDIUM",
          "HIGH",
          "URGENT",
        ]),
        status: status,
        statusHistory: [
          {
            newStatus: "DIAGNOSIS",
            note: "Tiket dibuat",
            timestamp: new Date(),
          },
          ...(status !== "DIAGNOSIS"
            ? [
                {
                  newStatus: status,
                  note: "Status diperbarui",
                  timestamp: new Date(),
                },
              ]
            : []),
        ],
        replacementItems: [],
        ...(status === "RESOLVED" && {
          technicianDiagnosis: "Masalah pada komponen X",
          technicianSolution: "Telah diganti dengan part baru",
          resolvedAt: new Date(),
        }),
      });
    }
    const createdTickets = await ServiceTicket.create(ticketsData);
    console.log(` - Berhasil memasukkan ${createdTickets.length} tickets.`);

    console.log("Seeding KB Tags...");
    const tagsData = [
      "Windows",
      "Hardware",
      "Printer Error",
      "Network",
      "Mati Total",
    ].map((t) => ({ name: t.toLowerCase() }));
    const createdTags = await KBTag.create(tagsData);
    console.log(` - Berhasil memasukkan ${createdTags.length} KB tags.`);

    console.log("Seeding Knowledge Base (Mengkaitkan dengan Tiket Selesai)...");
    const resolvedTickets = createdTickets.filter(
      (t) => t.status === "RESOLVED",
    );
    const kbEntriesData = [];
    const ticketIdsToArchive = [];
    const adminUser = createdUsers.find((u) => u.role === "ADMIN");

    for (let i = 0; i < Math.min(resolvedTickets.length, 10); i++) {
      const ticket = resolvedTickets[i];
      const device = createdDevices.find(
        (d) => d._id.toString() === ticket.deviceId.toString(),
      );

      kbEntriesData.push({
        symptom: ticket.initialComplaint,
        deviceModel: `${device.brand} ${device.model}`,
        diagnosis: ticket.technicianDiagnosis || faker.lorem.paragraph(),
        solution: ticket.technicianSolution || faker.lorem.paragraph(),
        imageUrl: faker.image.url(),
        sourceTicketId: ticket._id,
        createdBy: adminUser._id,
        tags: pickRandomMultiple(createdTags, 2).map((t) => t._id),
      });
      ticketIdsToArchive.push(ticket._id);
    }

    if (kbEntriesData.length > 0) {
      await KBEntry.create(kbEntriesData);
      await ServiceTicket.updateMany(
        { _id: { $in: ticketIdsToArchive } },
        {
          $set: { status: "ARCHIVED" },
          $push: {
            statusHistory: {
              newStatus: "ARCHIVED",
              note: "Di-review dan diarsipkan oleh Admin Seeder.",
              timestamp: new Date(),
            },
          },
        },
      );
    }
    console.log(` - Berhasil memasukkan ${kbEntriesData.length} KB entries.`);
    console.log(
      ` - Berhasil mengupdate ${ticketIdsToArchive.length} tiket menjadi ARCHIVED.`,
    );

    console.log("Seeding Login Attempts...");
    const loginAttemptsData = [];
    for (let i = 0; i < 20; i++) {
      const user = pickRandom(createdUsers);
      const success = faker.datatype.boolean({ probability: 0.9 });
      loginAttemptsData.push({
        user: success ? user._id : null,
        usernameAttempt: user.username,
        ip: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        success: success,
      });
    }
    await LoginAttempt.create(loginAttemptsData);
    console.log(
      ` - Berhasil memasukkan ${loginAttemptsData.length} login attempts.`,
    );

    console.log("Database seeding selesai!");
  } catch (error) {
    console.error("Terjadi kesalahan saat seeding:", error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedDatabase();
