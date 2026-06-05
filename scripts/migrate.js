require("dotenv").config();
const { connectDB, disconnectDB } = require("../src/config/db");

const { ServiceTicket } = require("../src/models/serviceTicket.model");
const { User } = require("../src/models/user.model");
const { Customer } = require("../src/models/customer.model");
const { KBEntry } = require("../src/models/kbEntry.model");
const { Device } = require("../src/models/device.model");
const { KBTag } = require("../src/models/kbTag.model");

async function runMigration() {
  await connectDB();
  console.log("Terhubung ke MongoDB. Memulai migrasi massal...");

  const models = [ServiceTicket, User, Customer, KBEntry, Device];

  // --- 1. HAPUS INDEX LAMA UNTUK MENCEGAH DUPLICATE KEY ERROR ---
  console.log("Menghapus index lama...");
  for (const model of models) {
    try {
      await model.collection.dropIndexes();
    } catch (error) {
      // Abaikan jika koleksi belum memiliki index
    }
  }

  // --- 2. PROSES MIGRASI TIKET ---
  console.log("1. Memigrasi ServiceTickets...");
  const ticketsCursor = ServiceTicket.collection.find({});
  let ticketCount = 0;
  for await (const doc of ticketsCursor) {
    const set = {};
    const unset = {};

    if (doc.nomorTiket) {
      set.ticketNumber = doc.nomorTiket;
      unset.nomorTiket = "";
    }
    if (doc.teknisiId) {
      set.technicianId = doc.teknisiId;
      unset.teknisiId = "";
    }
    if (doc.keluhanAwal) {
      set.initialComplaint = doc.keluhanAwal;
      unset.keluhanAwal = "";
    }
    if (doc.tanggalSelesai) {
      set.resolvedAt = doc.tanggalSelesai;
      unset.tanggalSelesai = "";
    }
    if (doc.diagnosisTeknisi) {
      set.technicianDiagnosis = doc.diagnosisTeknisi;
      unset.diagnosisTeknisi = "";
    }
    if (doc.solusiTeknisi) {
      set.technicianSolution = doc.solusiTeknisi;
      unset.solusiTeknisi = "";
    }

    if (doc.statusHistory && doc.statusHistory.length > 0) {
      set.statusHistory = doc.statusHistory.map((h) => ({
        timestamp: h.waktu || h.timestamp || new Date(),
        newStatus: h.statusBaru || h.newStatus,
        note: h.catatan || h.note || "",
      }));
    }

    if (doc.replacementItems && doc.replacementItems.length > 0) {
      set.replacementItems = doc.replacementItems.map((r) => ({
        componentName: r.namaKomponen || r.componentName,
        quantity: r.qty || r.quantity || 1,
        note: r.keterangan || r.note || "",
      }));
    }

    const statusMap = {
      Diagnosis: "DIAGNOSIS",
      DalamProses: "IN_PROGRESS",
      MenungguSparepart: "WAITING_PART",
      Selesai: "RESOLVED",
      Dibatalkan: "CANCELLED",
      Diarsipkan: "ARCHIVED",
    };
    if (doc.status && statusMap[doc.status]) {
      set.status = statusMap[doc.status];
    }

    const priorityMap = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      urgent: "URGENT",
    };
    if (doc.priority && priorityMap[doc.priority]) {
      set.priority = priorityMap[doc.priority];
    }

    if (Object.keys(set).length > 0) {
      await ServiceTicket.collection.updateOne(
        { _id: doc._id },
        { $set: set, $unset: unset },
      );
      ticketCount++;
    }
  }
  console.log(` - Selesai: ${ticketCount} tiket diperbarui.`);

  // --- 3. PROSES MIGRASI USERS ---
  console.log("2. Memigrasi Users...");
  const usersCursor = User.collection.find({});
  let userCount = 0;
  for await (const doc of usersCursor) {
    const set = {};
    const unset = {};

    if (doc.nama) {
      set.name = doc.nama;
      unset.nama = "";
    }
    if (doc.statusAktif !== undefined) {
      set.isActive = doc.statusAktif;
      unset.statusAktif = "";
    }

    const roleMap = {
      Teknisi: "TEKNISI",
      Admin: "ADMIN",
      SysAdmin: "SYSADMIN",
    };
    if (doc.role && roleMap[doc.role]) {
      set.role = roleMap[doc.role];
    }

    if (Object.keys(set).length > 0) {
      await User.collection.updateOne(
        { _id: doc._id },
        { $set: set, $unset: unset },
      );
      userCount++;
    }
  }
  console.log(` - Selesai: ${userCount} users diperbarui.`);

  // --- 4. PROSES MIGRASI CUSTOMERS ---
  console.log("3. Memigrasi Customers...");
  const customersCursor = Customer.collection.find({});
  let customerCount = 0;
  for await (const doc of customersCursor) {
    const set = {};
    const unset = {};

    if (doc.nama) {
      set.name = doc.nama;
      unset.nama = "";
    }
    if (doc.noHp) {
      set.phone = doc.noHp;
      unset.noHp = "";
    }
    if (doc.alamat) {
      set.address = doc.alamat;
      unset.alamat = "";
    }
    if (doc.catatan) {
      set.note = doc.catatan;
      unset.catatan = "";
    }

    if (Object.keys(set).length > 0) {
      await Customer.collection.updateOne(
        { _id: doc._id },
        { $set: set, $unset: unset },
      );
      customerCount++;
    }
  }
  console.log(` - Selesai: ${customerCount} customers diperbarui.`);

  // --- 5. PROSES MIGRASI KB ENTRIES ---
  console.log("4. Memigrasi KB Entries...");
  const kbCursor = KBEntry.collection.find({});
  let kbCount = 0;
  for await (const doc of kbCursor) {
    const set = {};
    const unset = {};

    if (doc.gejala) {
      set.symptom = doc.gejala;
      unset.gejala = "";
    }
    if (doc.modelPerangkat) {
      set.deviceModel = doc.modelPerangkat;
      unset.modelPerangkat = "";
    }
    if (doc.dibuatOleh) {
      set.createdBy = doc.dibuatOleh;
      unset.dibuatOleh = "";
    }

    if (Object.keys(set).length > 0) {
      await KBEntry.collection.updateOne(
        { _id: doc._id },
        { $set: set, $unset: unset },
      );
      kbCount++;
    }
  }
  console.log(` - Selesai: ${kbCount} entri KB diperbarui.`);

  // --- 6. PROSES MIGRASI DEVICES ---
  console.log("5. Memigrasi Devices...");
  const deviceCursor = Device.collection.find({});
  let deviceCount = 0;
  for await (const doc of deviceCursor) {
    const set = {};
    const unset = {};
    if (doc.tipe) {
      set.type = doc.tipe;
      unset.tipe = "";
    }
    if (doc.merek) {
      set.brand = doc.merek;
      unset.merek = "";
    }
    if (doc.nomorSeri) {
      set.serialNumber = doc.nomorSeri;
      unset.nomorSeri = "";
    }

    if (Object.keys(set).length > 0) {
      await Device.collection.updateOne(
        { _id: doc._id },
        { $set: set, $unset: unset },
      );
      deviceCount++;
    }
  }

  console.log("6. Memigrasi KB Tags...");
  const tagsCursor = KBTag.collection.find({});
  let tagCount = 0;
  for await (const doc of tagsCursor) {
    if (doc.nama) {
      await KBTag.collection.updateOne(
        { _id: doc._id },
        { $set: { name: doc.nama }, $unset: { nama: "" } },
      );
      tagCount++;
    }
  }
  console.log(` - Selesai: ${tagCount} tags diperbarui.`);

  console.log(` - Selesai: ${deviceCount} devices diperbarui.`);

  // --- 7. BANGUN ULANG INDEX SESUAI SCHEMA BARU ---
  console.log("Menyinkronkan ulang index database (syncIndexes)...");
  for (const model of models) {
    await model.syncIndexes();
  }

  console.log("✅ Migrasi massal selesai dengan sempurna!");
  await disconnectDB();
  process.exit(0);
}

runMigration().catch(async (error) => {
  console.error("Terjadi kesalahan saat migrasi:", error);
  await disconnectDB();
  process.exit(1);
});
