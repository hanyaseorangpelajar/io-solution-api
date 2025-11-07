const httpStatus = require("http-status");
const { userService } = require("../services");
const { catchAsync, ApiError } = require("../utils");
const { ROLES } = require("../models/user.model");
const createUserController = catchAsync(async (req, res) => {
  const userBody = {
    nama: req.body.fullName || req.body.name || req.body.nama,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
  };

  const user = await userService.createUser(userBody);
  res.status(httpStatus.CREATED).send(user);
});

const getUsersController = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);
  res.send(result);
});

const getUserController = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.send(user);
});

const updateUserController = catchAsync(async (req, res) => {
  if (req.body.role && !ROLES.includes(req.body.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Peran tidak valid. Pilihan: ${ROLES.join(", ")}`
    );
  }

  const updateBody = {
    nama: req.body.fullName || req.body.name || req.body.nama,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
    statusAktif: req.body.statusAktif,
  };

  const user = await userService.updateUserById(req.params.id, updateBody);
  res.send(user);
});

const deleteUserController = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateProfileController = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const updateBody = {
    nama: req.body.fullName || req.body.name || req.body.nama,
  };

  const user = await userService.updateUserProfile(userId, updateBody);
  res.send(user);
});

const changePasswordController = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password saat ini dan password baru wajib diisi."
    );
  }

  await userService.changeUserPassword(
    req.user.id,
    currentPassword,
    newPassword
  );
  res.status(httpStatus.OK).send({ message: "Password berhasil diubah." });
});

module.exports = {
  createUser: createUserController,
  getUsers: getUsersController,
  getUser: getUserController,
  updateUser: updateUserController,
  deleteUser: deleteUserController,
  updateProfile: updateProfileController,
  changePassword: changePasswordController,
};
