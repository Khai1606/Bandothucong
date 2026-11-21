const { sql, poolPromise } = require('../config/db');

function boDauTiengViet(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// 1. Lấy danh sách danh mục
exports.layDanhMuc = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM danh_muc');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh mục', error: err.message });
  }
};

// 2. Lấy danh sách sản phẩm đang bán (Hỗ trợ lọc danh mục & tìm kiếm không dấu)
exports.layDanhSachSanPham = async (req, res) => {
  const { tu_khoa, ma_danh_muc, gioi_han } = req.query;
  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
      SELECT sp.ma_san_pham, sp.ten_san_pham, sp.duong_dan, sp.chat_lieu, 
             sp.so_ngay_hoan_thien, sp.cho_phep_dat_rieng, sp.gia_goc, sp.so_luong_ton,
             gh.ma_gian_hang, gh.ten_gian_hang, gh.duong_dan_rieng AS slug_shop, gh.diem_danh_gia,
             dm.ten_danh_muc,
             (SELECT TOP 1 duong_dan_anh FROM hinh_anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_dai_dien = 1) AS anh_dai_dien
      FROM san_pham sp
      INNER JOIN gian_hang gh ON sp.ma_gian_hang = gh.ma_gian_hang
      LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
      WHERE sp.trang_thai = 'dang_ban' AND gh.trang_thai = 'dang_hoat_dong'
    `;

    if (ma_danh_muc) {
      request.input('ma_danh_muc', sql.Int, ma_danh_muc);
      query += ` AND (sp.ma_danh_muc = @ma_danh_muc OR dm.ma_danh_muc_cha = @ma_danh_muc)`;
    }

    query += ` ORDER BY sp.ngay_tao DESC`;

    const result = await request.query(query);
    let danhSach = result.recordset;

    if (tu_khoa && tu_khoa.trim() !== '') {
      const tuKhoaKhongDau = boDauTiengViet(tu_khoa);
      danhSach = danhSach.filter((sp) => {
        const tenSp = boDauTiengViet(sp.ten_san_pham);
        const chatLieu = boDauTiengViet(sp.chat_lieu);
        const tenShop = boDauTiengViet(sp.ten_gian_hang);
        const tenDm = boDauTiengViet(sp.ten_danh_muc);

        return (
          tenSp.includes(tuKhoaKhongDau) ||
          chatLieu.includes(tuKhoaKhongDau) ||
          tenShop.includes(tuKhoaKhongDau) ||
          tenDm.includes(tuKhoaKhongDau)
        );
      });
    }

    if (gioi_han) {
      danhSach = danhSach.slice(0, parseInt(gioi_han, 10));
    }

    res.json(danhSach);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: err.message });
  }
};

// 3. Lấy chi tiết 1 sản phẩm
exports.layChiTietSanPham = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    const spResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT sp.*, gh.ten_gian_hang, gh.duong_dan_rieng AS slug_shop, gh.diem_danh_gia, gh.dia_chi_lay_hang,
               dm.ten_danh_muc
        FROM san_pham sp
        INNER JOIN gian_hang gh ON sp.ma_gian_hang = gh.ma_gian_hang
        LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
        WHERE sp.ma_san_pham = @id
      `);

    if (spResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
    }

    const anhResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM hinh_anh_san_pham WHERE ma_san_pham = @id');

    const phanLoaiResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM phan_loai_san_pham WHERE ma_san_pham = @id');

    const danhGiaResult = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT dg.*, tk.ho_ten 
        FROM danh_gia dg
        INNER JOIN tai_khoan tk ON dg.ma_tai_khoan = tk.ma_tai_khoan
        WHERE dg.ma_san_pham = @id
        ORDER BY dg.ngay_danh_gia DESC
      `);

    res.json({
      san_pham: spResult.recordset[0],
      hinh_anh: anhResult.recordset,
      phan_loai: phanLoaiResult.recordset,
      danh_gia: danhGiaResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết sản phẩm', error: err.message });
  }
};

// 4. Gửi hoặc Sửa đánh giá (Mỗi khách hàng chỉ có 1 đánh giá cho 1 sản phẩm)
exports.guiDanhGia = async (req, res) => {
  const { ma_san_pham, ma_tai_khoan, so_sao, binh_luan } = req.body;
  try {
    const pool = await poolPromise;

    // Kiểm tra xem khách hàng này đã từng đánh giá sản phẩm này chưa
    const checkDanhGia = await pool
      .request()
      .input('ma_san_pham', sql.Int, ma_san_pham)
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .query(`
        SELECT ma_danh_gia FROM danh_gia 
        WHERE ma_san_pham = @ma_san_pham AND ma_tai_khoan = @ma_tai_khoan
      `);

    let thongBao = '';

    if (checkDanhGia.recordset.length > 0) {
      // Đã có đánh giá -> Cập nhật lại đánh giá của chính khách đó
      const maDanhGiaCu = checkDanhGia.recordset[0].ma_danh_gia;
      await pool
        .request()
        .input('ma_danh_gia', sql.Int, maDanhGiaCu)
        .input('so_sao', sql.Int, so_sao || 5)
        .input('binh_luan', sql.NVarChar, binh_luan || '')
        .query(`
          UPDATE danh_gia 
          SET so_sao = @so_sao, binh_luan = @binh_luan, ngay_danh_gia = GETDATE()
          WHERE ma_danh_gia = @ma_danh_gia
        `);

      // Dọn dẹp nếu trước đó lỡ tạo trùng hơn 1 dòng của cùng khách này trên cùng sản phẩm
      await pool
        .request()
        .input('ma_danh_gia', sql.Int, maDanhGiaCu)
        .input('ma_san_pham', sql.Int, ma_san_pham)
        .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
        .query(`
          DELETE FROM danh_gia 
          WHERE ma_san_pham = @ma_san_pham AND ma_tai_khoan = @ma_tai_khoan AND ma_danh_gia != @ma_danh_gia
        `);

      thongBao = 'Đã cập nhật đánh giá của bạn!';
    } else {
      // Chưa đánh giá -> Kiểm tra khách đã mua sản phẩm này chưa rồi thêm mới
      const timDonRes = await pool
        .request()
        .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
        .input('ma_san_pham', sql.Int, ma_san_pham)
        .query(`
          SELECT TOP 1 dhs.ma_don_shop
          FROM don_hang_shop dhs
          INNER JOIN don_hang_tong dht ON dhs.ma_don_tong = dht.ma_don_tong
          INNER JOIN chi_tiet_don_hang ctdh ON dhs.ma_don_shop = ctdh.ma_don_shop
          WHERE dht.ma_tai_khoan = @ma_tai_khoan AND ctdh.ma_san_pham = @ma_san_pham
          ORDER BY dhs.ma_don_shop DESC
        `);

      if (timDonRes.recordset.length === 0) {
        return res.status(400).json({
          message: 'Bạn cần đặt mua sản phẩm này trước khi gửi đánh giá!',
        });
      }

      const maDonShopHopLe = timDonRes.recordset[0].ma_don_shop;

      await pool
        .request()
        .input('ma_san_pham', sql.Int, ma_san_pham)
        .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
        .input('ma_don_shop', sql.Int, maDonShopHopLe)
        .input('so_sao', sql.Int, so_sao || 5)
        .input('binh_luan', sql.NVarChar, binh_luan || '')
        .query(`
          INSERT INTO danh_gia (ma_san_pham, ma_tai_khoan, ma_don_shop, so_sao, binh_luan)
          VALUES (@ma_san_pham, @ma_tai_khoan, @ma_don_shop, @so_sao, @binh_luan)
        `);

      thongBao = 'Cảm ơn bạn đã gửi đánh giá tác phẩm!';
    }

    // Tự động tính lại điểm trung bình sao cho Gian hàng
    await pool
      .request()
      .input('ma_san_pham', sql.Int, ma_san_pham)
      .query(`
        UPDATE gian_hang
        SET diem_danh_gia = (
          SELECT ROUND(AVG(CAST(dg.so_sao AS FLOAT)), 1)
          FROM danh_gia dg
          INNER JOIN san_pham sp ON dg.ma_san_pham = sp.ma_san_pham
          WHERE sp.ma_gian_hang = gian_hang.ma_gian_hang
        )
        WHERE ma_gian_hang = (SELECT ma_gian_hang FROM san_pham WHERE ma_san_pham = @ma_san_pham)
      `);

    res.status(200).json({ message: thongBao });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi đánh giá: ' + err.message });
  }
};