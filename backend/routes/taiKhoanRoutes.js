const express = require('express');
const router = express.Router();
const taiKhoanController = require('../controllers/taiKhoanController');

router.post('/dang-nhap', taiKhoanController.dangNhap);
router.post('/dang-ky', taiKhoanController.dangKy);
router.get('/danh-sach', taiKhoanController.layDanhSachTaiKhoan);
router.put('/trang-thai/:id', taiKhoanController.capNhatTrangThai);
router.post('/quen-mat-khau/gui-otp', taiKhoanController.guiOtpQuenMatKhau);
router.post('/quen-mat-khau/dat-lai', taiKhoanController.datLaiMatKhau);
router.get('/ho-so/:maTaiKhoan', taiKhoanController.layHoSoCaNhan);
router.put('/ho-so/:maTaiKhoan', taiKhoanController.capNhatHoSoCaNhan);

module.exports = router;