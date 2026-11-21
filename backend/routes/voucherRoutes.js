const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.get('/kha-dung', voucherController.layDanhSachVoucherKhaDung);
router.post('/kiem-tra', voucherController.kiemTraVoucher);
router.get('/gian-hang/:maGianHang', voucherController.layVoucherTheoShop);
router.post('/', voucherController.taoVoucherMoi);

module.exports = router;