const httpStatus = require("http-status");
const { userService } = require("../services");
const { catchAsync, ApiError } = require("../utils");
const { ROLES, toUserDto } = require("../models/user.model");

const createUserController = catchAsync(async (req, res) => {
  const userBody = {
    name: req.body.name,
    username: req.body.username,
    password: req.body.password,
    role: req.body.role,
    isActive: req.body.isActive,
  };

  const user = await userService.createUser(userBody);
  res.status(httpStatus.CREATED).send(toUserDto(user));
});

const getUsersController = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);
  res.send({
    ...result,
    results: result.results.map(toUserDto),
  });
});

const getUserController = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.send(toUserDto(user));
});

const updateUserController = catchAsync(async (req, res) => {
  if (req.body.role && !ROLES.includes(req.body.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Role tidak valid. Pilihan: ${ROLES.join(", ")}`,
    );
  }

  const updateBody = {
    name: req.body.name,
    username: req.body.username,
    role: req.body.role,
    password: req.body.password,
    isActive: req.body.isActive,
  };

  const user = await userService.updateUserById(req.params.id, updateBody);
  res.send(toUserDto(user));
});

const deleteUserController = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateProfileController = catchAsync(async (req, res) => {
  const updateBody = { name: req.body.name };
  const user = await userService.updateUserProfile(req.user.id, updateBody);
  res.send(toUserDto(user));
});

const changePasswordController = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password saat ini dan password baru wajib diisi.",
    );
  }

  await userService.changeUserPassword(
    req.user.id,
    currentPassword,
    newPassword,
  );
  res.status(httpStatus.OK).send({ message: "Password berhasil diubah." });
});

const getLoginHistory = catchAsync(async (req, res) => {
  const result = await userService.getLoginHistoryByUserId(
    req.user.id,
    req.query,
  );
  res.send(result);
});

module.exports = {
  createUserController,
  getUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
  updateProfileController,
  changePasswordController,
  getLoginHistory,
};
