/**
 * PENTING: File ini menggunakan @faker-js/faker
 * Pastikan Anda telah menginstalnya:
 * npm install @faker-js/faker --save-dev
 *
 * (Berdasarkan package.json Anda, ini seharusnya sudah ada)
 */

const genNomorTiket = (() => {
  let seq = 1;
  return () => {
    const y = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    return `SRV-${y}-${String(seq++).padStart(4, "0")}`; // SRV-20251106-0001, dst.
  };
})();

require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("./src/config/db"); //

// ================== PERBAIKAN DI SINI ==================
// Kita gunakan impor 'faker' standar (EN) untuk memastikan semua method (seperti .internet) tersedia.
const { faker } = require("@faker-js/faker");
// ===================================================

// Impor model yang file-nya kita miliki
const { User, ROLES } = require("./src/models/user.model"); //
const { Customer } = require("./src/models/customer.model"); //
const { Device } = require("./src/models/device.model"); //
const {
  ServiceTicket,
  TICKET_STATUSES,
} = require("./src/models/serviceTicket.model"); //
const { KBTag } = require("./src/models/kbTag.model"); //
const { KBEntry } = require("./src/models/kbEntry.model"); //
const { LoginAttempt } = require("./src/models/loginAttempt.model"); //

// Fungsi helper untuk mengambil item acak dari array
const pickRandom = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
};

// Fungsi helper untuk mengambil beberapa item acak unik
const pickRandomMultiple = (arr, num) => {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return [...new Set(shuffled.slice(0, num))]; // Gunakan Set untuk jaminan unik
};

const seedDatabase = async () => {
  try {
    console.log("Menyambungkan ke database...");
    await connectDB(); //
    console.log("Database tersambung.");

    console.log("Membersihkan data lama...");
    // Hapus dalam urutan ketergantungan (dari yang paling dependen)
    await LoginAttempt.deleteMany({});
    await KBEntry.deleteMany({});
    await KBTag.deleteMany({});
    await ServiceTicket.deleteMany({});
    await Device.deleteMany({});
    await Customer.deleteMany({});
    await User.deleteMany({});
    console.log("Koleksi dibersihkan.");

    // ===========================================
    // 1. Seed Users (Total: 20)
    // ===========================================
    console.log("Seeding Users...");
    const usersData = [];
    // Tambahkan pengguna inti
    // usersData.push({
    //   nama: "Admin Utama",
    //   username: "sysadmin",
    //   passwordHash: "Password123!",
    //   role: "SysAdmin",
    //   statusAktif: true,
    // });
    usersData.push({
      nama: "Admin Toko",
      username: "admin",
      passwordHash: "Password123!",
      role: "Admin",
      statusAktif: true,
    });
    // usersData.push({
    //   nama: "Budi Teknisi",
    //   username: "budi",
    //   passwordHash: "Password123!",
    //   role: "Teknisi",
    //   statusAktif: true,
    // });
    // usersData.push({
    //   nama: "Siti Teknisi",
    //   username: "siti",
    //   passwordHash: "Password123!",
    //   role: "Teknisi",
    //   statusAktif: true,
    // });

    // // Tambahkan 16 pengguna palsu
    // for (let i = 0; i < 16; i++) {
    //   const firstName = faker.person.firstName();
    //   const lastName = faker.person.lastName();
    //   usersData.push({
    //     nama: `${firstName} ${lastName}`,
    //     // Memanggil faker.internet.userName() (sekarang harusnya ada)
    //     username: faker.internet.username().toLowerCase(),
    //     passwordHash: "Password1all!",
    //     role: pickRandom(["Admin", "Teknisi"]),
    //     statusAktif: faker.datatype.boolean({ probability: 0.9 }),
    //   });
    // }

    const createdUsers = await User.create(usersData);
    console.log(` - Berhasil memasukkan ${createdUsers.length} users.`);
    const teknisiUsers = createdUsers.filter((u) => u.role === "Teknisi");
    const adminUsers = createdUsers.filter(
      (u) => u.role === "Admin" || u.role === "SysAdmin"
    );

    // // ===========================================
    // // 2. Seed Customers (Total: 30)
    // // ===========================================
    // console.log("Seeding Customers...");
    // const customersData = [];
    // for (let i = 0; i < 30; i++) {
    //   customersData.push({
    //     nama: faker.person.fullName(),
    //     noHp: faker.phone.number("0812########"), // Format ini spesifik ID, tapi mungkin masih berfungsi
    //     alamat: faker.location.streetAddress(),
    //     catatan: faker.lorem.sentence(),
    //   });
    // }
    // const createdCustomers = await Customer.insertMany(customersData);
    // console.log(` - Berhasil memasukkan ${createdCustomers.length} customers.`);

    // // ===========================================
    // // 3. Seed Devices (Total: 20+)
    // // ===========================================
    // console.log("Seeding Devices...");
    // const devicesData = [];
    // const deviceTypes = [
    //   "Laptop",
    //   "PC Desktop",
    //   "Printer",
    //   "Monitor",
    //   "Router",
    // ];
    // const brands = ["Asus", "Lenovo", "HP", "Dell", "Acer", "Samsung", "Canon"];

    // // Buat 20 perangkat
    // for (let i = 0; i < 20; i++) {
    //   const tipe = pickRandom(deviceTypes);
    //   devicesData.push({
    //     customerId: pickRandom(createdCustomers)._id,
    //     brand: pickRandom(brands),
    //     model: `${faker.commerce.productName()}-${faker.string
    //       .alphanumeric(4)
    //       .toUpperCase()}`,
    //     serialNumber: faker.string.alphanumeric(12).toUpperCase(),
    //     tipe: tipe,
    //     deskripsi: `Perangkat ${faker.commerce.productAdjective()}`,
    //   });
    // }

    // // Pastikan setiap customer punya setidaknya 1 perangkat
    // for (const cust of createdCustomers) {
    //   const hasDevice = devicesData.some((d) => d.customerId.equals(cust._id));
    //   if (!hasDevice) {
    //     const tipe = pickRandom(deviceTypes);
    //     devicesData.push({
    //       customerId: cust._id,
    //       brand: pickRandom(brands),
    //       model: `${faker.commerce.productName()}-${faker.string
    //         .alphanumeric(4)
    //         .toUpperCase()}`,
    //       serialNumber: faker.string.alphanumeric(12).toUpperCase(),
    //       tipe: tipe,
    //       deskripsi: `Perangkat ${faker.commerce.productAdjective()}`,
    //     });
    //   }
    // }
    // const createdDevices = await Device.insertMany(devicesData);
    // console.log(` - Berhasil memasukkan ${createdDevices.length} devices.`);

    // // ===========================================
    // // 4. Seed KBTags (Total: 20)
    // // ===========================================
    // console.log("Seeding KBTags...");
    // const tags = [
    //   "hardware",
    //   "software",
    //   "windows",
    //   "macos",
    //   "linux",
    //   "printer",
    //   "jaringan",
    //   "virus",
    //   "overheat",
    //   "bluescreen",
    //   "mati-total",
    //   "upgrade",
    //   "instalasi",
    //   "backup-data",
    //   "laptop",
    //   "pc-desktop",
    //   "driver",
    //   "lcd",
    //   "keyboard",
    //   "baterai",
    // ];
    // const tagsData = tags.map((nama) => ({ nama }));
    // const createdTags = await KBTag.insertMany(tagsData);
    // console.log(` - Berhasil memasukkan ${createdTags.length} KB tags.`);

    // // ===========================================
    // // 5. Seed ServiceTickets (Total: 30)
    // // ===========================================
    // console.log("Seeding Service Tickets...");
    // const ticketsData = [];
    // let SelesaiTicketsForKB = []; // Simpan tiket selesai untuk KB

    // for (let i = 0; i < 30; i++) {
    //   const device = pickRandom(createdDevices);
    //   const customerId = device.customerId;
    //   const teknisi = pickRandom(teknisiUsers);
    //   const status = pickRandom(TICKET_STATUSES);

    //   const ticket = {
    //     nomorTiket: genNomorTiket(),
    //     customerId: customerId,
    //     deviceId: device._id,
    //     teknisiId: status !== "Diagnosis" ? teknisi?._id : null,
    //     keluhanAwal: faker.lorem.sentence({ min: 5, max: 15 }),
    //     status: status,
    //     tanggalMasuk: faker.date.past({ years: 1 }),
    //     tanggalSelesai:
    //       status === "Selesai" || status === "Dibatalkan"
    //         ? faker.date.recent()
    //         : null,
    //     statusHistory: [
    //       {
    //         statusBaru: "Diagnosis",
    //         catatan: "Tiket dibuat oleh sistem.",
    //         waktu: faker.date.past({ years: 1 }),
    //       },
    //     ],
    //     replacementItems:
    //       status === "Selesai"
    //         ? [
    //             {
    //               namaKomponen: faker.commerce.productName(),
    //               qty: 1,
    //               keterangan: "Komponen pengganti",
    //             },
    //           ]
    //         : [],
    //   };

    //   if (status !== "Diagnosis") {
    //     ticket.statusHistory.push({
    //       statusBaru: status,
    //       catatan: `Status diubah ke ${status}`,
    //       waktu: new Date(),
    //     });
    //   }

    //   ticketsData.push(ticket);
    // }
    // const createdTickets = await ServiceTicket.insertMany(ticketsData);
    // console.log(
    //   ` - Berhasil memasukkan ${createdTickets.length} service tickets.`
    // );

    // // ===========================================
    // // 6. Seed KBEntries (Total: 20)
    // // ===========================================
    // console.log("Seeding Knowledge Base Entries...");
    // const kbEntriesData = [];
    // // Ambil 20 tiket untuk dijadikan KB, prioritaskan yang selesai
    // let ticketsForKB = createdTickets.filter((t) => t.status === "Selesai");
    // if (ticketsForKB.length < 20) {
    //   const otherTickets = createdTickets.filter((t) => t.status !== "Selesai");
    //   ticketsForKB = [
    //     ...ticketsForKB,
    //     ...otherTickets.slice(0, 20 - ticketsForKB.length),
    //   ];
    // }

    // // Pastikan kita punya 20 tiket
    // if (ticketsForKB.length < 20) {
    //   console.warn(
    //     ` - Hanya ${ticketsForKB.length} tiket tersedia untuk dibuat KB.`
    //   );
    // }

    // for (const ticket of ticketsForKB.slice(0, 20)) {
    //   const device = createdDevices.find((d) => d._id.equals(ticket.deviceId));
    //   const modelPerangkat = device
    //     ? `${device.brand} ${device.model}`
    //     : "Tidak diketahui";

    //   kbEntriesData.push({
    //     gejala: ticket.keluhanAwal,
    //     modelPerangkat: modelPerangkat,
    //     diagnosis: faker.lorem.sentence(5),
    //     solusi: faker.lorem.paragraph(2),
    //     sourceTicketId: ticket._id,
    //     dibuatOleh: pickRandom(adminUsers)._id,
    //     tags: pickRandomMultiple(
    //       createdTags,
    //       faker.number.int({ min: 1, max: 3 })
    //     ).map((t) => t._id),
    //   });
    // }

    // // Hapus duplikat sourceTicketId jika ada (meskipun seharusnya tidak)
    // const uniqueKbEntries = Array.from(
    //   new Map(
    //     kbEntriesData.map((item) => [item.sourceTicketId.toString(), item])
    //   ).values()
    // );

    // if (uniqueKbEntries.length > 0) {
    //   const createdKbEntries = await KBEntry.insertMany(uniqueKbEntries);
    //   console.log(
    //     ` - Berhasil memasukkan ${createdKbEntries.length} KB entries.`
    //   );
    // } else {
    //   console.log(` - Tidak ada tiket untuk dibuat KB, KBEntry dilewati.`);
    // }

    // // ===========================================
    // // 7. Seed LoginAttempts (Total: 50)
    // // ===========================================
    // console.log("Seeding Login Attempts...");
    // const loginAttemptsData = [];
    // for (let i = 0; i < 50; i++) {
    //   const success = faker.datatype.boolean({ probability: 0.7 }); // 70% berhasil
    //   const user = pickRandom(createdUsers);
    //   loginAttemptsData.push({
    //     user: success ? user._id : null,
    //     usernameAttempt: success
    //       ? user.username
    //       : pickRandom([
    //           user.username,
    //           faker.internet.username().toLowerCase(),
    //         ]),
    //     ip: faker.internet.ip(),
    //     userAgent: faker.internet.userAgent(),
    //     success: success,
    //   });
    // }
    // const createdLoginAttempts = await LoginAttempt.insertMany(
    //   loginAttemptsData
    // );
    // console.log(
    //   ` - Berhasil memasukkan ${createdLoginAttempts.length} login attempts.`
    // );

    // ===========================================
    // Selesai
    // ===========================================
    console.log("✅ Database seeding selesai!");
  } catch (error) {
    console.error("❌ Terjadi error saat seeding database:", error);
    process.exitCode = 1;
  } finally {
    console.log("Menutup koneksi database...");
    await disconnectDB(); //
    console.log("Koneksi database ditutup.");
  }
};

seedDatabase();
