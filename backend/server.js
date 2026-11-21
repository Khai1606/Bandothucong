const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { layKetNoi } = require('./config/db');
const taiKhoanRoutes = require('./routes/taiKhoanRoutes');
const sanPhamRoutes = require('./routes/sanPhamRoutes');
const gianHangRoutes = require('./routes/gianHangRoutes');
const chatRoutes = require('./routes/chatRoutes');
const donHangRoutes = require('./routes/donHangRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const viRoutes = require('./routes/viRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/tai-khoan', taiKhoanRoutes);
app.use('/api/san-pham', sanPhamRoutes);
app.use('/api/gian-hang', gianHangRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/don-hang', donHangRoutes);
app.use('/api/voucher', voucherRoutes);
app.use('/api/vi', viRoutes);

// Route nạp dữ liệu thật từ du_lieu_that.sql lên Somee (chạy xong có thể xóa hoặc giữ nguyên)
app.get('/api/nap-du-lieu-that', async (req, res) => {
  try {
    const pool = await layKetNoi();
    const filePath = path.join(__dirname, '../database/du_lieu_that.sql');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Không tìm thấy file database/du_lieu_that.sql trên server!' });
    }

    // 1. Đồng bộ toàn bộ các cột & ràng buộc đã thêm trong quá trình phát triển
    await pool.request().batch(`
      IF COL_LENGTH('gian_hang', 'ngan_hang_ten') IS NULL
        ALTER TABLE gian_hang ADD ngan_hang_ten NVARCHAR(100) NULL;
      IF COL_LENGTH('gian_hang', 'ngan_hang_so_tk') IS NULL
        ALTER TABLE gian_hang ADD ngan_hang_so_tk VARCHAR(50) NULL;
      IF COL_LENGTH('gian_hang', 'ngan_hang_chu_tk') IS NULL
        ALTER TABLE gian_hang ADD ngan_hang_chu_tk NVARCHAR(150) NULL;

      IF COL_LENGTH('don_hang_tong', 'ma_don_tong_code') IS NULL
        ALTER TABLE don_hang_tong ADD ma_don_tong_code VARCHAR(50) NULL;
      IF COL_LENGTH('don_hang_tong', 'tong_tien_hang') IS NULL
        ALTER TABLE don_hang_tong ADD tong_tien_hang DECIMAL(18, 2) DEFAULT 0;
      IF COL_LENGTH('don_hang_shop', 'ngay_cap_nhat') IS NULL
        ALTER TABLE don_hang_shop ADD ngay_cap_nhat DATETIME DEFAULT GETDATE();

      DECLARE @sqlDrop NVARCHAR(MAX) = N'';
      SELECT @sqlDrop += N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + N'.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + N' DROP CONSTRAINT ' + QUOTENAME(name) + N';'
      FROM sys.check_constraints
      WHERE OBJECT_NAME(parent_object_id) IN ('lich_su_rut_tien', 'don_hang_tong');
      EXEC sp_executesql @sqlDrop;
    `);

    // 2. Xóa sạch dữ liệu mẫu cũ theo đúng thứ tự từ bảng con lên bảng cha
    await pool.request().batch(`
      DELETE FROM danh_gia;
      DELETE FROM tin_nhan;
      DELETE FROM cuoc_hoi_thoai;
      DELETE FROM lich_su_rut_tien;
      DELETE FROM vi_gian_hang;
      DELETE FROM van_chuyen;
      DELETE FROM giao_dich_thanh_toan;
      DELETE FROM chi_tiet_don_hang;
      DELETE FROM don_hang_shop;
      DELETE FROM don_hang_tong;
      DELETE FROM chi_tiet_gio_hang;
      DELETE FROM gio_hang;
      DELETE FROM dia_chi_nhan_hang;
      DELETE FROM ma_giam_gia;
      DELETE FROM phan_loai_san_pham;
      DELETE FROM hinh_anh_san_pham;
      DELETE FROM san_pham;
      DELETE FROM danh_muc;
      DELETE FROM gian_hang;
      DELETE FROM tai_khoan;
    `);

    // 3. Đọc file du_lieu_that.sql (hỗ trợ cả UTF-16LE từ SSMS và UTF-8)
    let sqlContent = fs.readFileSync(filePath, 'utf16le');
    if (!sqlContent.includes('INSERT')) {
      sqlContent = fs.readFileSync(filePath, 'utf8');
    }

    sqlContent = sqlContent
      .replace(/^\uFEFF/, '')
      .replace(/USE\s+\[?BanDoThuCong\]?\s*;?/gi, '');

    // 4. Chỉ giữ lại các lô chứa lệnh INSERT (hỗ trợ cả INSERT [dbo]... và INSERT INTO)
    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter((b) => b.length > 0 && /INSERT\s+(INTO\s+)?(\[?dbo\]?\.)?\[?/i.test(b));

    for (const batch of batches) {
      await pool.request().batch(batch);
    }

    res.send(`🎉 THÀNH CÔNG! Đã nạp xong ${batches.length} lô dữ liệu chuẩn lên Somee!`);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi nạp dữ liệu thật', error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('API Sàn Thương Mại Điện Tử Đồ Thủ Công đang hoạt động!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend đang chạy tại cổng ${PORT}`);
});