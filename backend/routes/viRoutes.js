const express = require('express');
const router = express.Router();
const viController = require('../controllers/viController');

router.get('/shop/:maGianHang', viController.layThongTinViShop);
router.post('/rut-tien', viController.taoYeuCauRutTien);
router.get('/tat-ca-yeu-cau', viController.layTatCaYeuCauRutTien);
router.put('/duyet/:maRutTien', viController.duyetYeuCauRutTien);

module.exports = router;