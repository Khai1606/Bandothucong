const express = require('express');
const router = express.Router();
const sanPhamController = require('../controllers/sanPhamController');

router.get('/danh-muc', sanPhamController.layDanhMuc);
router.get('/', sanPhamController.layDanhSachSanPham);
router.get('/:id', sanPhamController.layChiTietSanPham);
router.post('/danh-gia', sanPhamController.guiDanhGia);

module.exports = router;