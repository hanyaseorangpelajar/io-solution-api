const express = require("express");
// --- PERBAIKAN ---
// Menggunakan barrel controllers dan middlewares
const { serviceTicketController } = require("../controllers");
const { protect } = require("../middlewares");
// --- AKHIR PERBAIKAN ---

const router = express.Router();

// Tiket bisa diakses oleh SEMUA ROLE yang sudah login
// Terapkan 'protect' ke SEMUA rute di file ini
router.use(protect);

// Rute-rute ini sekarang otomatis terproteksi
router
  .route("/")
  .post(serviceTicketController.createTicket)
  .get(serviceTicketController.getTickets);

router.route("/:id").get(serviceTicketController.getTicket);
router.route("/:id/assign").put(serviceTicketController.assignTicket);
router.route("/:id/diagnose").put(serviceTicketController.addDiagnosis);
router.route("/:id/action").put(serviceTicketController.addAction);
router.route("/:id/status").put(serviceTicketController.updateTicketStatus);

module.exports = router;
