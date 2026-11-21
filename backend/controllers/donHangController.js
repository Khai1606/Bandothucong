const { sql, poolPromise } = require('../config/db');

// 1. Đặt hàng mới (Tự động tách đơn theo từng gian hàng + cập nhật lượt dùng Voucher)
exports.datHang = async (req, res) => {
  try {
    const {
      ma_tai_khoan,
      ten_nguoi_nhan,
      sdt_nguoi_nhan,
      dia_chi_giao_hang,
      phuong_thuc_thanh_toan,
      danh_sach_san_pham,
      ma_voucher,
      so_tien_giam,
      tong_thanh_toan,
    } = req.body;

    if (!ma_tai_khoan || !danh_sach_san_pham || danh_sach_san_pham.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống hoặc thiếu thông tin tài khoản!' });
    }

    const pool = await poolPromise;

    const tongTienHang = danh_sach_san_pham.reduce(
      (sum, sp) => sum + Number(sp.gia_ban) * Number(sp.so_luong || 1),
      0
    );
    const tienGiam = Number(so_tien_giam || 0);
    const tongCuoiCung =
      tong_thanh_toan !== undefined ? Number(tong_thanh_toan) : Math.max(0, tongTienHang - tienGiam);

    // Tạo mã tra cứu đơn tổng khớp với cột ma_tra_cuu_tong trong SQL Server
    const maTraCuuTong = 'DH' + Date.now().toString().slice(-6);

    const kqDonTong = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .input('ma_tra_cuu_tong', sql.VarChar, maTraCuuTong)
      .input('ma_don_tong_code', sql.VarChar, maTraCuuTong)
      .input('ten_nguoi_nhan', sql.NVarChar, ten_nguoi_nhan)
      .input('sdt_nguoi_nhan', sql.VarChar, sdt_nguoi_nhan)
      .input('dia_chi_giao_hang', sql.NVarChar, dia_chi_giao_hang)
      .input('tong_tien_hang', sql.Decimal(18, 2), tongTienHang)
      .input('tong_thanh_toan', sql.Decimal(18, 2), tongCuoiCung)
      .input('phuong_thuc_thanh_toan', sql.VarChar, phuong_thuc_thanh_toan || 'tien_mat_cod')
      .query(`
        INSERT INTO don_hang_tong (
          ma_tai_khoan, ma_tra_cuu_tong, ma_don_tong_code, ten_nguoi_nhan, sdt_nguoi_nhan,
          dia_chi_giao_hang, tong_tien_hang, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan
        )
        OUTPUT INSERTED.ma_don_tong
        VALUES (
          @ma_tai_khoan, @ma_tra_cuu_tong, @ma_don_tong_code, @ten_nguoi_nhan, @sdt_nguoi_nhan,
          @dia_chi_giao_hang, @tong_tien_hang, @tong_thanh_toan, @phuong_thuc_thanh_toan, 'chua_thanh_toan'
        )
      `);

    const maDonTong = kqDonTong.recordset[0].ma_don_tong;

    // Tách đơn hàng theo từng gian hàng
    const nhomTheoShop = danh_sach_san_pham.reduce((acc, sp) => {
      const shopId = sp.ma_gian_hang || 1;
      if (!acc[shopId]) acc[shopId] = [];
      acc[shopId].push(sp);
      return acc;
    }, {});

    for (const [shopId, dsMonCuaShop] of Object.entries(nhomTheoShop)) {
      const tienHangShop = dsMonCuaShop.reduce(
        (sum, sp) => sum + Number(sp.gia_ban) * Number(sp.so_luong || 1),
        0
      );
      const maTraCuuShop = 'DHS' + Math.floor(100000 + Math.random() * 900000);

      const kqDonShop = await pool
        .request()
        .input('ma_don_tong', sql.Int, maDonTong)
        .input('ma_gian_hang', sql.Int, Number(shopId))
        .input('ma_tra_cuu_shop', sql.VarChar, maTraCuuShop)
        .input('tien_hang', sql.Decimal(18, 2), tienHangShop)
        .query(`
          INSERT INTO don_hang_shop (ma_don_tong, ma_gian_hang, ma_tra_cuu_shop, tien_hang, trang_thai_don)
          OUTPUT INSERTED.ma_don_shop
          VALUES (@ma_don_tong, @ma_gian_hang, @ma_tra_cuu_shop, @tien_hang, 'cho_xac_nhan')
        `);

      const maDonShop = kqDonShop.recordset[0].ma_don_shop;

      for (const mon of dsMonCuaShop) {
        await pool
          .request()
          .input('ma_don_shop', sql.Int, maDonShop)
          .input('ma_san_pham', sql.Int, mon.ma_san_pham)
          .input('so_luong', sql.Int, Number(mon.so_luong || 1))
          .input('don_gia', sql.Decimal(18, 2), Number(mon.gia_ban))
          .input('yeu_cau_ca_nhan_hoa', sql.NVarChar, mon.yeu_cau || '')
          .query(`
            INSERT INTO chi_tiet_don_hang (ma_don_shop, ma_san_pham, so_luong, don_gia, yeu_cau_ca_nhan_hoa)
            VALUES (@ma_don_shop, @ma_san_pham, @so_luong, @don_gia, @yeu_cau_ca_nhan_hoa)
          `);
      }
    }

    // Tăng lượt đã sử dụng của Voucher nếu có
    if (ma_voucher) {
      await pool
        .request()
        .input('ma_voucher', sql.Int, Number(ma_voucher))
        .query(`
          UPDATE ma_giam_gia
          SET da_su_dung = da_su_dung + 1
          WHERE ma_voucher = @ma_voucher
        `);
    }

    res.json({
      message: `Đặt hàng thành công! Mã đơn hàng của bạn là ${maTraCuuTong}.`,
      ma_don_tong: maDonTong,
      ma_don_tong_code: maTraCuuTong,
    });
  } catch (err) {
    console.error('Lỗi đặt hàng:', err);
    res.status(500).json({ message: 'Lỗi xử lý đơn hàng: ' + err.message });
  }
};

// 2. Lấy danh sách đơn hàng đã mua của khách hàng
exports.layDonHangCuaToi = async (req, res) => {
  try {
    const { maTaiKhoan } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, maTaiKhoan)
      .query(`
        SELECT
          dhs.ma_don_shop,
          dhs.ma_tra_cuu_shop,
          dhs.tien_hang,
          dhs.trang_thai_don,
          dhs.ngay_cap_nhat,
          dht.ma_tra_cuu_tong AS ma_don_tong_code,
          dht.ten_nguoi_nhan,
          dht.sdt_nguoi_nhan,
          dht.dia_chi_giao_hang,
          dht.phuong_thuc_thanh_toan,
          dht.ngay_dat,
          gh.ten_gian_hang
        FROM don_hang_shop dhs
        JOIN don_hang_tong dht ON dhs.ma_don_tong = dht.ma_don_tong
        JOIN gian_hang gh ON dhs.ma_gian_hang = gh.ma_gian_hang
        WHERE dht.ma_tai_khoan = @ma_tai_khoan
        ORDER BY dhs.ma_don_shop DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Lỗi lấy đơn hàng của tôi:', err);
    res.status(500).json({ message: 'Lỗi tải danh sách đơn hàng: ' + err.message });
  }
};

// 3. Thống kê doanh thu toàn sàn cho trang Quản trị Admin
exports.thongKeDoanhThuSan = async (req, res) => {
  try {
    const pool = await poolPromise;

    const tongQuan = await pool.request().query(`
      SELECT
        COUNT(ma_don_shop) AS tong_don_hang,
        ISNULL(SUM(CASE WHEN trang_thai_don <> 'da_huy' THEN tien_hang ELSE 0 END), 0) AS tong_doanh_thu,
        (SELECT COUNT(*) FROM gian_hang) AS tong_gian_hang,
        (SELECT COUNT(*) FROM tai_khoan) AS tong_tai_khoan
      FROM don_hang_shop
    `);

    const theoGianHang = await pool.request().query(`
      SELECT
        gh.ma_gian_hang,
        gh.ten_gian_hang,
        gh.diem_danh_gia,
        COUNT(dhs.ma_don_shop) AS so_don,
        ISNULL(SUM(CASE WHEN dhs.trang_thai_don <> 'da_huy' THEN dhs.tien_hang ELSE 0 END), 0) AS doanh_thu
      FROM gian_hang gh
      LEFT JOIN don_hang_shop dhs ON gh.ma_gian_hang = dhs.ma_gian_hang
      GROUP BY gh.ma_gian_hang, gh.ten_gian_hang, gh.diem_danh_gia
      ORDER BY doanh_thu DESC
    `);

    res.json({
      tong_quan: tongQuan.recordset[0],
      theo_gian_hang: theoGianHang.recordset,
    });
  } catch (err) {
    console.error('Lỗi thống kê doanh thu sàn:', err);
    res.status(500).json({ message: 'Lỗi thống kê doanh thu: ' + err.message });
  }
};