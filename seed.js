/**
 * Seeder baru untuk I/O Solutions API (v3)
 * Dibuat konsisten dengan model data Mongoose dan alur kerja teknisi/admin.
 * Membuat:
 * - 20 Users (2 Admin, 18 Teknisi)
 * - 20 Customers
 * - 20 Devices
 * - 20 KBTags
 * - 30 ServiceTickets (20 Selesai/Diarsipkan, 10 Diagnosis)
 * - 20 KBEntries (dari 20 tiket yang Selesai)
 * - 20 LoginAttempts
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("./src/config/db");
const { faker } = require("@faker-js/faker/locale/id_ID");

const { User } = require("./src/models/user.model");
const { Customer } = require("./src/models/customer.model");
const { Device } = require("./src/models/device.model");
const { ServiceTicket } = require("./src/models/serviceTicket.model");
const { KBTag } = require("./src/models/kbTag.model");
const { KBEntry } = require("./src/models/kbEntry.model");
const { LoginAttempt } = require("./src/models/loginAttempt.model");

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
    console.log("Koleksi dibersihkan.");

    const PASSWORD = "Password123!";
    const KELUHAN_UMUM = [
      "Laptop mati total, tidak ada respon.",
      "Layar LCD bergaris dan kadang mati sendiri.",
      "Blue screen (BSOD) saat booting Windows.",
      "Keyboard menekan tombol sendiri / beberapa tombol tidak berfungsi.",
      "Baterai sangat boros dan cepat panas.",
      "Printer tidak bisa menarik kertas.",
      "PC sering restart sendiri saat bermain game.",
      "Tidak bisa terhubung ke WiFi.",
      "Perlu install ulang Windows 11.",
      "Engsel laptop patah.",
    ];

    console.log("Seeding Users (2 Admin, 18 Teknisi)...");
    const usersData = [];

    usersData.push({
      nama: "Admin Utama",
      username: "admin1",
      passwordHash: PASSWORD,
      role: "Admin",
      statusAktif: true,
    });
    usersData.push({
      nama: "Admin Toko",
      username: "admin2",
      passwordHash: PASSWORD,
      role: "Admin",
      statusAktif: true,
    });

    for (let i = 1; i <= 18; i++) {
      const nama = faker.person.fullName();
      usersData.push({
        nama: nama,
        username: `teknisi${i}`,
        passwordHash: PASSWORD,
        role: "Teknisi",
        statusAktif: true,
      });
    }

    const createdUsers = await User.create(usersData);
    const adminUsers = createdUsers.filter((u) => u.role === "Admin");
    const teknisiUsers = createdUsers.filter((u) => u.role === "Teknisi");
    console.log(` - Berhasil memasukkan ${createdUsers.length} users.`);

    console.log("Seeding Customers...");
    const customersData = [];
    for (let i = 0; i < 20; i++) {
      customersData.push({
        nama: faker.person.fullName(),
        noHp: faker.phone.number("08##########"),
        alamat: faker.location.streetAddress(),
      });
    }
    const createdCustomers = await Customer.create(customersData);
    console.log(` - Berhasil memasukkan ${createdCustomers.length} customers.`);

    console.log("Seeding Devices (1 per customer)...");
    const devicesData = [];
    const brands = ["Lenovo", "HP", "Dell", "Asus", "Acer", "Apple", "Epson"];
    const types = ["Laptop", "PC Desktop", "Printer"];

    for (const customer of createdCustomers) {
      devicesData.push({
        customerId: customer._id,
        brand: pickRandom(brands),
        model: faker.commerce.productName(),
        serialNumber: faker.string.alphanumeric(12).toUpperCase(),
        tipe: pickRandom(types),
      });
    }
    const createdDevices = await Device.create(devicesData);
    console.log(` - Berhasil memasukkan ${createdDevices.length} devices.`);

    console.log("Seeding KBTags...");
    const tagNames = [
      "hardware",
      "software",
      "windows",
      "driver",
      "bluescreen",
      "mati-total",
      "ram",
      "ssd",
      "overheat",
      "instalasi",
      "virus",
      "jaringan",
      "printer",
      "laptop",
      "pc",
      "vga",
      "keyboard",
      "lcd",
      "baterai",
      "maintenance",
    ];
    const tagsData = tagNames.map((nama) => ({ nama }));
    const createdTags = await KBTag.create(tagsData);
    console.log(` - Berhasil memasukkan ${createdTags.length} KB tags.`);

    console.log("Seeding Service Tickets...");

    console.log("   - Membuat 20 tiket 'Selesai'...");
    const selesaiTicketsData = [];
    for (let i = 0; i < 20; i++) {
      const device = createdDevices[i];
      const customer = createdCustomers[i];
      const teknisi = pickRandom(teknisiUsers);
      const keluhan = pickRandom(KELUHAN_UMUM) || "Kerusakan umum.";
      const diagnosis = `Diagnosis: ${faker.lorem.sentence(5)}`;
      const solusi = `Solusi: ${faker.lorem.paragraph(1)}`;

      selesaiTicketsData.push({
        customerId: customer._id,
        deviceId: device._id,
        teknisiId: teknisi._id,
        keluhanAwal: keluhan,
        priority: pickRandom(["low", "medium", "high", "urgent"]),
        status: "Selesai",
        tanggalMasuk: faker.date.past({ years: 1 }),
        tanggalSelesai: faker.date.recent(),
        diagnosisTeknisi: diagnosis,
        solusiTeknisi: solusi,
        statusHistory: [
          { statusBaru: "Diagnosis", catatan: "Tiket dibuat oleh seeder." },
          {
            statusBaru: "DalamProses",
            catatan: "Ditugaskan ke " + teknisi.nama,
          },
          { statusBaru: "Selesai", catatan: "Pekerjaan selesai oleh teknisi." },
        ],
        replacementItems: [
          {
            namaKomponen: faker.commerce.productName(),
            qty: 1,
            keterangan: "Penggantian komponen",
          },
        ],
      });
    }

    const createdSelesaiTickets = [];
    for (const ticketData of selesaiTicketsData) {
      const newTicket = await ServiceTicket.create(ticketData);
      createdSelesaiTickets.push(newTicket);
    }
    console.log(
      ` - Berhasil memasukkan ${createdSelesaiTickets.length} tiket 'Selesai'.`
    );

    console.log("   - Membuat 10 tiket 'Diagnosis'...");
    const diagnosisTicketsData = [];
    for (let i = 0; i < 10; i++) {
      const device = pickRandom(createdDevices);
      const customer = createdCustomers.find((c) =>
        c._id.equals(device.customerId)
      );
      const teknisi = pickRandom(teknisiUsers);
      const keluhan = pickRandom(KELUHAN_UMUM) || "Kerusakan baru.";

      diagnosisTicketsData.push({
        customerId: customer._id,
        deviceId: device._id,
        teknisiId: Math.random() > 0.5 ? teknisi._id : null,
        keluhanAwal: keluhan,
        priority: pickRandom(["low", "medium", "high"]),
        status: "Diagnosis",
        tanggalMasuk: faker.date.recent({ days: 7 }),
        tanggalSelesai: null,
        diagnosisTeknisi: null,
        solusiTeknisi: null,
        statusHistory: [
          {
            statusBaru: "Diagnosis",
            catatan: "Tiket baru dibuat oleh seeder.",
          },
        ],
        replacementItems: [],
      });
    }

    const createdDiagnosisTickets = [];
    for (const ticketData of diagnosisTicketsData) {
      const newTicket = await ServiceTicket.create(ticketData);
      createdDiagnosisTickets.push(newTicket);
    }
    console.log(
      ` - Berhasil memasukkan ${createdDiagnosisTickets.length} tiket 'Diagnosis'.`
    );

    console.log("Seeding Knowledge Base Entries (dari 20 tiket 'Selesai')...");
    const kbEntriesData = [];
    for (const ticket of createdSelesaiTickets) {
      const device = createdDevices.find((d) => d._id.equals(ticket.deviceId));
      const modelPerangkat = device
        ? `${device.brand} ${device.model}`
        : "Model Tidak Dikenal";

      kbEntriesData.push({
        gejala: ticket.keluhanAwal,
        modelPerangkat: modelPerangkat,
        diagnosis: `(Review) ${ticket.diagnosisTeknisi}`,
        solusi: `(Review) ${ticket.solusiTeknisi}`,
        sourceTicketId: ticket._id,
        dibuatOleh: pickRandom(adminUsers)._id,
        tags: pickRandomMultiple(
          createdTags,
          faker.number.int({ min: 1, max: 3 })
        ).map((t) => t._id),
      });
    }
    await KBEntry.create(kbEntriesData);

    const ticketIdsToArchive = createdSelesaiTickets.map((t) => t._id);
    await ServiceTicket.updateMany(
      { _id: { $in: ticketIdsToArchive } },
      {
        $set: { status: "Diarsipkan" },
        $push: {
          statusHistory: {
            statusBaru: "Diarsipkan",
            catatan: "Di-review dan diarsipkan oleh Admin Seeder.",
          },
        },
      }
    );
    console.log(` - Berhasil memasukkan ${kbEntriesData.length} KB entries.`);
    console.log(
      ` - Berhasil mengupdate ${ticketIdsToArchive.length} tiket menjadi Diarsipkan.`
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
      ` - Berhasil memasukkan ${loginAttemptsData.length} login attempts.`
    );

    console.log("✅ Database seeding selesai!");
  } catch (error) {
    console.error("❌ Terjadi error saat seeding database:", error);
    process.exitCode = 1;
  } finally {
    console.log("Menutup koneksi database...");
    await disconnectDB();
    console.log("Koneksi database ditutup.");
  }
};

seedDatabase();
