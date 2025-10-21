// src/routes/v1/component.route.js
const express = require("express");
const { componentController } = require("../../controllers");

const router = express.Router();

router
  .route("/")
  .post(componentController.createComponent)
  .get(componentController.getComponents);

router
  .route("/:id")
  .get(componentController.getComponent)
  .put(componentController.updateComponent)
  .delete(componentController.deleteComponent);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Components
 *   description: Manajemen Katalog Komponen
 */
// ... (Swagger docs akan ditambahkan nanti)
