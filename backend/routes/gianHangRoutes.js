const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const gianHangController = require('../controllers/gianHangController');

const thuMucUpload = path.join(__dirname, '../uploads');
if (!fs.existsSync(thuMucUpload)) {
  fs.mkdirSync(thuMucUpload, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, thuMucUpload),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `sp_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`);
  },
});
const upload = multer({ storage });

router.get('/cua-toi/:maTaiKhoan', gianHangController.layGianHangCuaToi);
router.post('/mo-shop', gianHangController.moGianHang);
router.post('/san-pham', upload.single('hinh_anh'), gianHangController.dangSanPhamMoi);
router.delete('/san-pham/:id', gianHangController.xoaSanPham);
router.post('/san-pham/:id/anh', upload.single('hinh_anh'), gianHangController.capNhatAnhSanPham);
router.put('/don-hang/:id/trang-thai', gianHangController.capNhatTrangThaiDon);

module.exports = router;