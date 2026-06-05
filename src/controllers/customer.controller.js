const { customerService } = require("../services");
const { catchAsync } = require("../utils");
const { toCustomerDto } = require("../models/customer.model");

const getCustomersController = catchAsync(async (req, res) => {
  const result = await customerService.getCustomers(req.query);
  res.send({
    ...result,
    results: result.results.map(toCustomerDto),
  });
});

const getCustomerController = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.send(toCustomerDto(customer));
});

const updateCustomerController = catchAsync(async (req, res) => {
  const { name, phone, address, note } = req.body;
  const customer = await customerService.updateCustomer(req.params.id, {
    name,
    phone,
    address,
    note,
  });
  res.send(toCustomerDto(customer));
});

module.exports = {
  getCustomersController,
  getCustomerController,
  updateCustomerController,
};
