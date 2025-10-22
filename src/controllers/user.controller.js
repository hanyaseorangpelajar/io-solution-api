// src/controllers/user.controller.js
const httpStatus = require("http-status");
const { userService } = require("../services");
const { catchAsync } = require("../utils/catchAsync");
const { ApiError } = require("../utils/ApiError");
const { ROLES } = require("../models/user.model");

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = {}; // Di masa depan, bisa ditambahkan filter dari req.query
  const result = await userService.getUsers(filter);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const allowedUpdates = ["fullName", "role"];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hanya dapat memperbarui nama lengkap dan peran"
    );
  }

  // Validasi role jika ada di updateBody
  if (req.body.role && !ROLES.includes(req.body.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Peran tidak valid. Pilihan: ${ROLES.join(", ")}`
    );
  }

  const user = await userService.updateUserById(req.params.id, req.body);
  res.send(user);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
};
