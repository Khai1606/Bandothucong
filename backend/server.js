const { layKetNoi } = require('./config/db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { poolPromise } = require('./config/db');
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

// Route khởi tạo bảng & dữ liệu mẫu 1 lần duy nhất lên Somee
app.get('/api/khoi-tao-db', async (req, res) => {
  try {
    const pool = await poolPromise;
    // Tìm file .sql trong thư mục database
    const thuMucDb = path.join(__dirname, '../database');
    const files = fs.readdirSync(thuMucDb).filter((f) => f.endsWith('.sql'));
    if (files.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy file .sql trong thư mục database' });
    }

    let sqlContent = fs.readFileSync(path.join(thuMucDb, files[0]), 'utf8');

    // Loại bỏ các lệnh tạo/chọn DB vì Somee đã tạo sẵn BanDoThuCong
    sqlContent = sqlContent
      .replace(/USE\s+master\s*;?/gi, '')
      .replace(/DROP\s+DATABASE[\s\S]*?;/gi, '')
      .replace(/CREATE\s+DATABASE[\s\S]*?;/gi, '')
      .replace(/USE\s+BanDoThuCong\s*;?/gi, '');

    // Tách theo từ khóa GO và chạy tuần tự từng lô
    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    for (const batch of batches) {
      await pool.request().batch(batch);
    }

    res.send('🎉 Đã tạo toàn bộ bảng và nạp dữ liệu mẫu lên Somee thành công!');
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khởi tạo DB', error: err.message });
  }
});

// Route khởi tạo bảng & dữ liệu mẫu 1 lần duy nhất lên Somee
app.get('/api/khoi-tao-db', async (req, res) => {
  try {
    const pool = await layKetNoi();
    const thuMucDb = path.join(__dirname, '../database');
    const files = fs.readdirSync(thuMucDb).filter((f) => f.endsWith('.sql'));
    if (files.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy file .sql trong thư mục database' });
    }

    let sqlContent = fs.readFileSync(path.join(thuMucDb, files[0]), 'utf8');

    sqlContent = sqlContent
      .replace(/USE\s+master\s*;?/gi, '')
      .replace(/DROP\s+DATABASE[\s\S]*?;/gi, '')
      .replace(/CREATE\s+DATABASE[\s\S]*?;/gi, '')
      .replace(/USE\s+BanDoThuCong\s*;?/gi, '');

    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    for (const batch of batches) {
      await pool.request().batch(batch);
    }

    res.send('🎉 Đã tạo toàn bộ bảng và nạp dữ liệu mẫu lên Somee thành công!');
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khởi tạo DB', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend đang chạy tại cổng ${PORT}`);
});