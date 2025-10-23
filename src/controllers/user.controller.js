const httpStatus = require("http-status");

const {
  createUser,
  getUsers,
  getUserById,
  updateUserById,
} = require("../services");
const { catchAsync, ApiError } = require("../utils");
const { ROLES } = require("../models");

const createUserController = catchAsync(async (req, res) => {
  const user = await createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsersController = catchAsync(async (req, res) => {
  const filter = {};
  const result = await getUsers(filter);
  res.send(result);
});

const getUserController = catchAsync(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Pengguna tidak ditemukan");
  }
  res.send(user);
});

const updateUserController = catchAsync(async (req, res) => {
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

  if (req.body.role && !ROLES.includes(req.body.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Peran tidak valid. Pilihan: ${ROLES.join(", ")}`
    );
  }

  const user = await updateUserById(req.params.id, req.body);
  res.send(user);
});

const deleteUserController = catchAsync(async (req, res) => {
  await deleteUserById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser: createUserController,
  getUsers: getUsersController,
  getUser: getUserController,
  updateUser: updateUserController,
  deleteUser: deleteUserController,
};
