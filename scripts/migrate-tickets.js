/**
 *
 * SCRIPT MIGRASI DATABASE (JALANKAN SEKALI)
 * Mengubah struktur dokumen existing dari schema lama (Indo) ke schema baru (Eng).
 * Cara jalan: node scripts/migrate-tickets.js
 *
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { ServiceTicket } = require("../src/models/serviceTicket.model");

async function runMigration() {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to MongoDB. Starting migration...");

  const cursor = ServiceTicket.collection.find({});
  let count = 0;

  for await (const doc of cursor) {
    const updatePayload = { $set: {}, $unset: {} };

    // Mapping Field Utama
    if (doc.nomorTiket) {
      updatePayload.$set.ticketNumber = doc.nomorTiket;
      updatePayload.$unset.nomorTiket = "";
    }
    if (doc.teknisiId) {
      updatePayload.$set.technicianId = doc.teknisiId;
      updatePayload.$unset.teknisiId = "";
    }
    if (doc.keluhanAwal) {
      updatePayload.$set.initialComplaint = doc.keluhanAwal;
      updatePayload.$unset.keluhanAwal = "";
    }
    if (doc.tanggalSelesai) {
      updatePayload.$set.resolvedAt = doc.tanggalSelesai;
      updatePayload.$unset.tanggalSelesai = "";
    }
    if (doc.diagnosisTeknisi) {
      updatePayload.$set.technicianDiagnosis = doc.diagnosisTeknisi;
      updatePayload.$unset.diagnosisTeknisi = "";
    }
    if (doc.solusiTeknisi) {
      updatePayload.$set.technicianSolution = doc.solusiTeknisi;
      updatePayload.$unset.solusiTeknisi = "";
    }

    // Mapping Array statusHistory
    if (doc.statusHistory && doc.statusHistory.length > 0) {
      updatePayload.$set.statusHistory = doc.statusHistory.map((h) => ({
        timestamp: h.waktu || h.timestamp || new Date(),
        newStatus: h.statusBaru || h.newStatus,
        note: h.catatan || h.note || "",
      }));
    }

    // Mapping Array replacementItems
    if (doc.replacementItems && doc.replacementItems.length > 0) {
      updatePayload.$set.replacementItems = doc.replacementItems.map((r) => ({
        componentName: r.namaKomponen || r.componentName,
        quantity: r.qty || r.quantity,
        note: r.keterangan || r.note || "",
      }));
    }

    // Mapping Status (Translasi ENUM lama ke baru)
    const statusMap = {
      Diagnosis: "DIAGNOSIS",
      DalamProses: "IN_PROGRESS",
      MenungguSparepart: "WAITING_PART",
      Selesai: "RESOLVED",
      Dibatalkan: "CANCELLED",
      Diarsipkan: "ARCHIVED",
    };
    if (doc.status && statusMap[doc.status]) {
      updatePayload.$set.status = statusMap[doc.status];
    }

    // Mapping Priority
    const priorityMap = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      urgent: "URGENT",
    };
    if (doc.priority && priorityMap[doc.priority]) {
      updatePayload.$set.priority = priorityMap[doc.priority];
    }

    // Eksekusi Update jika ada yang perlu diubah
    if (Object.keys(updatePayload.$set).length > 0) {
      await ServiceTicket.collection.updateOne({ _id: doc._id }, updatePayload);
      count++;
    }
  }

  console.log(`Migration completed. ${count} documents updated.`);
  process.exit(0);
}

runMigration().catch(console.error);
