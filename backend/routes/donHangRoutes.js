const express = require('express');
const router = express.Router();
const donHangController = require('../controllers/donHangController');

router.post('/dat-hang', donHangController.datHang);
router.get('/cua-toi/:maTaiKhoan', donHangController.layDonHangCuaToi);
router.get('/thong-ke-san', donHangController.thongKeDoanhThuSan);

module.exports = router;