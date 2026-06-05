const express = require("express");
const { uploadController } = require("../controllers");
const { protect, authorize } = require("../middlewares");
const { uploadImage } = require("../middlewares/upload.middleware");

const router = express.Router();

router.post(
  "/image",
  [protect, authorize(["ADMIN", "TEKNISI", "SYSADMIN"]), uploadImage],
  uploadController.handleUpload,
);

module.exports = router;
