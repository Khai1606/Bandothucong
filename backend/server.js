// Route nạp dữ liệu thật từ file du_lieu_that.sql lên Somee
app.get('/api/khoi-tao-db', async (req, res) => {
  try {
    const pool = await layKetNoi();
    const filePath = path.join(__dirname, '../database/du_lieu_that.sql');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Không tìm thấy file database/du_lieu_that.sql' });
    }

    // Xóa dữ liệu mẫu cũ theo đúng thứ tự khóa ngoại để tránh trùng lặp
    const lenhXoaDuLieuCu = `
      DELETE FROM danh_gia;
      DELETE FROM tin_nhan;
      DELETE FROM cuoc_hoi_thoai;
      DELETE FROM lich_su_rut_tien;
      DELETE FROM vi_gian_hang;
      DELETE FROM van_chuyen;
      DELETE FROM chi_tiet_don_hang;
      DELETE FROM don_hang_shop;
      DELETE FROM don_hang_tong;
      DELETE FROM ma_giam_gia;
      DELETE FROM hinh_anh_san_pham;
      DELETE FROM san_pham;
      DELETE FROM danh_muc;
      DELETE FROM gian_hang;
      DELETE FROM tai_khoan;
    `;
    await pool.request().batch(lenhXoaDuLieuCu);

    let sqlContent = fs.readFileSync(filePath, 'utf16le');
    if (!sqlContent.includes('INSERT')) {
      sqlContent = fs.readFileSync(filePath, 'utf8');
    }

    sqlContent = sqlContent
      .replace(/^\uFEFF/, '')
      .replace(/USE\s+\[?BanDoThuCong\]?\s*;?/gi, '');

    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    for (const batch of batches) {
      await pool.request().batch(batch);
    }

    res.send('🎉 Đã cập nhật toàn bộ dữ liệu chuẩn lên Somee thành công!');
  } catch (err) {
    res.status(500).json({ message: 'Lỗi nạp dữ liệu', error: err.message });
  }
});