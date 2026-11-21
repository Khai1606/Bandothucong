const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

app.get('/', (req, res) => {
  res.send('API Sàn Thương Mại Điện Tử Đồ Thủ Công đang hoạt động!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend đang chạy tại cổng ${PORT}`);
});