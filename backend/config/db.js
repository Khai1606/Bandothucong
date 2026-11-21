const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'BanDoThuCong',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('✅ Đã kết nối SQL Server thành công!');
    return pool;
  })
  .catch((err) => {
    console.error('❌ Lỗi kết nối SQL Server:', err.message);
    throw err;
  });

module.exports = { sql, poolPromise };