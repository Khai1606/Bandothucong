const { sql, poolPromise } = require('../config/db');

function taoSlug(str) {
  return (
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.floor(100 + Math.random() * 900)
  );
}

// 1. Lấy thông tin gian hàng, sản phẩm & đơn hàng của tài khoản
exports.layGianHangCuaToi = async (req, res) => {
  const { maTaiKhoan } = req.params;
  try {
    const pool = await poolPromise;
    const shopRes = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, maTaiKhoan)
      .query('SELECT * FROM gian_hang WHERE ma_tai_khoan = @ma_tai_khoan');

    if (shopRes.recordset.length === 0) {
      return res.json({ co_gian_hang: false });
    }

    const gianHang = shopRes.recordset[0];

    const spRes = await pool
      .request()
      .input('ma_gian_hang', sql.Int, gianHang.ma_gian_hang)
      .query(`
        SELECT sp.*, dm.ten_danh_muc,
               (SELECT TOP 1 duong_dan_anh FROM hinh_anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_dai_dien = 1) AS anh_dai_dien
        FROM san_pham sp
        LEFT JOIN danh_muc dm ON sp.ma_danh_muc = dm.ma_danh_muc
        WHERE sp.ma_gian_hang = @ma_gian_hang AND sp.trang_thai != 'da_xoa'
        ORDER BY sp.ngay_tao DESC
      `);

    let danhSachDonHang = [];
    try {
      const donHangRes = await pool
        .request()
        .input('ma_gian_hang', sql.Int, gianHang.ma_gian_hang)
        .query(`
          SELECT dhs.ma_don_shop AS ma_don_hang, dhs.ma_tra_cuu_shop, dhs.tien_hang AS tong_thanh_toan, 
                 dhs.trang_thai_don AS trang_thai, dht.dia_chi_giao_hang,
                 dht.ten_nguoi_nhan AS ten_khach_hang, dht.sdt_nguoi_nhan AS sdt_khach
          FROM don_hang_shop dhs
          INNER JOIN don_hang_tong dht ON dhs.ma_don_tong = dht.ma_don_tong
          WHERE dhs.ma_gian_hang = @ma_gian_hang
          ORDER BY dht.ngay_dat DESC
        `);
      danhSachDonHang = donHangRes.recordset;
    } catch (errDon) {
      console.warn('Lưu ý truy vấn đơn hàng shop:', errDon.message);
    }

    res.json({
      co_gian_hang: true,
      gian_hang: gianHang,
      san_phams: spRes.recordset,
      don_hangs: danhSachDonHang,
    });
  } catch (err) {
    console.error('❌ Lỗi tải dữ liệu gian hàng:', err.message);
    res.status(500).json({ message: 'Lỗi tải dữ liệu gian hàng: ' + err.message });
  }
};

// 2. Đăng ký mở gian hàng mới
exports.moGianHang = async (req, res) => {
  const { ma_tai_khoan, ten_gian_hang, mo_ta, dia_chi_lay_hang, ngan_hang_ten, ngan_hang_so_tk, ngan_hang_chu_tk } = req.body;
  try {
    const pool = await poolPromise;

    const checkShop = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .query('SELECT ma_gian_hang FROM gian_hang WHERE ma_tai_khoan = @ma_tai_khoan');

    if (checkShop.recordset.length > 0) {
      return res.status(400).json({ message: 'Tài khoản này đã sở hữu một gian hàng rồi!' });
    }

    const duong_dan_rieng = taoSlug(ten_gian_hang);

    const result = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .input('ten_gian_hang', sql.NVarChar, ten_gian_hang)
      .input('duong_dan_rieng', sql.VarChar, duong_dan_rieng)
      .input('mo_ta', sql.NVarChar, mo_ta || '')
      .input('dia_chi_lay_hang', sql.NVarChar, dia_chi_lay_hang)
      .input('ngan_hang_ten', sql.NVarChar, ngan_hang_ten || '')
      .input('ngan_hang_so_tk', sql.VarChar, ngan_hang_so_tk || '')
      .input('ngan_hang_chu_tk', sql.NVarChar, ngan_hang_chu_tk || '')
      .query(`
        INSERT INTO gian_hang (ma_tai_khoan, ten_gian_hang, duong_dan_rieng, mo_ta, dia_chi_lay_hang, ngan_hang_ten, ngan_hang_so_tk, ngan_hang_chu_tk)
        OUTPUT INSERTED.*
        VALUES (@ma_tai_khoan, @ten_gian_hang, @duong_dan_rieng, @mo_ta, @dia_chi_lay_hang, @ngan_hang_ten, @ngan_hang_so_tk, @ngan_hang_chu_tk)
      `);

    res.status(201).json({
      message: 'Chúc mừng! Gian hàng của bạn đã được mở thành công.',
      gian_hang: result.recordset[0],
    });
  } catch (err) {
    console.error('❌ Lỗi SQL khi mở gian hàng:', err.message);
    res.status(500).json({ message: 'Lỗi SQL: ' + err.message });
  }
};

// 3. Đăng sản phẩm mới (kèm ảnh)
exports.dangSanPhamMoi = async (req, res) => {
  const {
    ma_gian_hang,
    ma_danh_muc,
    ten_san_pham,
    mo_ta,
    chat_lieu,
    so_ngay_hoan_thien,
    cho_phep_dat_rieng,
    gia_goc,
    so_luong_ton,
  } = req.body;

  try {
    const pool = await poolPromise;
    const duong_dan = taoSlug(ten_san_pham);

    const spInsert = await pool
      .request()
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .input('ma_danh_muc', sql.Int, ma_danh_muc || 1)
      .input('ten_san_pham', sql.NVarChar, ten_san_pham)
      .input('duong_dan', sql.VarChar, duong_dan)
      .input('mo_ta', sql.NVarChar, mo_ta || '')
      .input('chat_lieu', sql.NVarChar, chat_lieu || 'Thủ công')
      .input('so_ngay_hoan_thien', sql.Int, so_ngay_hoan_thien || 1)
      .input('cho_phep_dat_rieng', sql.Bit, cho_phep_dat_rieng === 'true' || cho_phep_dat_rieng === true ? 1 : 0)
      .input('gia_goc', sql.Decimal(12, 2), gia_goc)
      .input('so_luong_ton', sql.Int, so_luong_ton || 10)
      .query(`
        INSERT INTO san_pham (ma_gian_hang, ma_danh_muc, ten_san_pham, duong_dan, mo_ta, chat_lieu, so_ngay_hoan_thien, cho_phep_dat_rieng, gia_goc, so_luong_ton)
        OUTPUT INSERTED.ma_san_pham
        VALUES (@ma_gian_hang, @ma_danh_muc, @ten_san_pham, @duong_dan, @mo_ta, @chat_lieu, @so_ngay_hoan_thien, @cho_phep_dat_rieng, @gia_goc, @so_luong_ton)
      `);

    const maSanPhamMoi = spInsert.recordset[0].ma_san_pham;

    if (req.file) {
      const duongDanAnh = `/uploads/${req.file.filename}`;
      await pool
        .request()
        .input('ma_san_pham', sql.Int, maSanPhamMoi)
        .input('duong_dan_anh', sql.VarChar, duongDanAnh)
        .query(`
          INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_dai_dien)
          VALUES (@ma_san_pham, @duong_dan_anh, 1)
        `);
    }

    res.status(201).json({ message: 'Đăng sản phẩm mới thành công!', ma_san_pham: maSanPhamMoi });
  } catch (err) {
    console.error('❌ Lỗi đăng sản phẩm:', err.message);
    res.status(500).json({ message: 'Lỗi đăng sản phẩm: ' + err.message });
  }
};

// 4. Xóa mềm sản phẩm của shop
exports.xoaSanPham = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, id)
      .query(`UPDATE san_pham SET trang_thai = 'da_xoa' WHERE ma_san_pham = @id`);

    res.json({ message: 'Đã xóa sản phẩm khỏi gian hàng!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: err.message });
  }
};

// 5. Cập nhật / Upload ảnh đại diện mới cho sản phẩm
exports.capNhatAnhSanPham = async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn một file hình ảnh!' });
  }

  const duongDanAnh = `/uploads/${req.file.filename}`;
  try {
    const pool = await poolPromise;

    const checkAnh = await pool
      .request()
      .input('ma_san_pham', sql.Int, id)
      .query('SELECT ma_hinh_anh FROM hinh_anh_san_pham WHERE ma_san_pham = @ma_san_pham AND la_anh_dai_dien = 1');

    if (checkAnh.recordset.length > 0) {
      await pool
        .request()
        .input('ma_san_pham', sql.Int, id)
        .input('duong_dan_anh', sql.VarChar, duongDanAnh)
        .query('UPDATE hinh_anh_san_pham SET duong_dan_anh = @duong_dan_anh WHERE ma_san_pham = @ma_san_pham AND la_anh_dai_dien = 1');
    } else {
      await pool
        .request()
        .input('ma_san_pham', sql.Int, id)
        .input('duong_dan_anh', sql.VarChar, duongDanAnh)
        .query('INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_dai_dien) VALUES (@ma_san_pham, @duong_dan_anh, 1)');
    }

    res.json({ message: 'Cập nhật ảnh sản phẩm thành công!', anh_dai_dien: duongDanAnh });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật ảnh: ' + err.message });
  }
};

// 6. Chủ Shop cập nhật trạng thái đơn hàng (Xác nhận -> Đang làm thủ công -> Đang giao -> Hoàn thành)
exports.capNhatTrangThaiDon = async (req, res) => {
  const { id } = req.params;
  const { trang_thai_don } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('trang_thai_don', sql.VarChar, trang_thai_don)
      .query('UPDATE don_hang_shop SET trang_thai_don = @trang_thai_don WHERE ma_don_shop = @id');

    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn: ' + err.message });
  }
};