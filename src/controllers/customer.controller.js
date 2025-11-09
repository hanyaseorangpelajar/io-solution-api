const { customerService } = require("../services");
const { catchAsync } = require("../utils");

const getCustomersController = catchAsync(async (req, res) => {
  const result = await customerService.getCustomers(req.query);
  res.send(result);
});

// --- TAMBAHKAN FUNGSI BARU DI BAWAH INI ---

const getCustomerController = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.send(customer);
});

const updateCustomerController = catchAsync(async (req, res) => {
  // Hanya ambil field yang boleh di-edit
  const { nama, noHp, alamat, catatan } = req.body;

  const customer = await customerService.updateCustomer(req.params.id, {
    nama,
    noHp,
    alamat,
    catatan,
  });
  res.send(customer);
});

module.exports = {
  getCustomersController,
  getCustomerController,
  updateCustomerController,
};
