const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/hoi-thoai/:maTaiKhoan', chatController.layDanhSachHoiThoai);
router.post('/mo-hoi-thoai', chatController.moHoiThoai);
router.get('/tin-nhan/:maHoiThoai', chatController.layTinNhan);
router.post('/gui-tin-nhan', chatController.guiTinNhan);

module.exports = router;