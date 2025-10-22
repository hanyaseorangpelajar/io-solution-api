// src/routes/v1/user.route.js
const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.route("/").post(userController.createUser).get(userController.getUsers);

router.route("/:id").get(userController.getUser).put(userController.updateUser);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Manajemen Pengguna (Tanpa Autentikasi/Password)
 */
// ... (Swagger docs akan ditambahkan nanti)
