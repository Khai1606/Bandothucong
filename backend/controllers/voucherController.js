const { sql, poolPromise } = require('../config/db');

// 1. Lấy danh sách voucher còn hiệu lực để khách chọn lúc thanh toán
exports.layDanhSachVoucherKhaDung = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT v.*, g.ten_gian_hang
      FROM ma_giam_gia v
      LEFT JOIN gian_hang g ON v.ma_gian_hang = g.ma_gian_hang
      WHERE v.da_su_dung < v.so_luong_phat_hanh
        AND GETDATE() BETWEEN v.ngay_bat_dau AND v.ngay_ket_thuc
      ORDER BY v.ma_voucher DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách mã giảm giá: ' + err.message });
  }
};

// 2. Kiểm tra & tính toán số tiền được giảm khi khách nhập/chọn mã
exports.kiemTraVoucher = async (req, res) => {
  try {
    const { ma_code, tong_tien, danh_sach_san_pham } = req.body;
    if (!ma_code) {
      return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá!' });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('ma_code', sql.VarChar, ma_code.trim().toUpperCase())
      .query(`
        SELECT v.*, g.ten_gian_hang
        FROM ma_giam_gia v
        LEFT JOIN gian_hang g ON v.ma_gian_hang = g.ma_gian_hang
        WHERE UPPER(v.ma_code) = @ma_code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại!' });
    }

    const voucher = result.recordset[0];
    const bayGio = new Date();

    if (bayGio < new Date(voucher.ngay_bat_dau) || bayGio > new Date(voucher.ngay_ket_thuc)) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn hoặc chưa tới thời gian áp dụng!' });
    }

    if (voucher.da_su_dung >= voucher.so_luong_phat_hanh) {
      return res.status(400).json({ message: 'Mã giảm giá này đã hết lượt sử dụng!' });
    }

    // Nếu là voucher riêng của một gian hàng, chỉ tính tiền hàng của gian hàng đó
    let tienTinhDieuKien = Number(tong_tien);
    if (voucher.ma_gian_hang) {
      const sanPhamCuaShop = (danh_sach_san_pham || []).filter(
        (sp) => Number(sp.ma_gian_hang) === Number(voucher.ma_gian_hang)
      );
      if (sanPhamCuaShop.length === 0) {
        return res.status(400).json({
          message: `Mã "${voucher.ma_code}" chỉ áp dụng cho sản phẩm của ${voucher.ten_gian_hang || 'gian hàng phát hành'}!`,
        });
      }
      tienTinhDieuKien = sanPhamCuaShop.reduce(
        (sum, sp) => sum + Number(sp.gia_ban) * Number(sp.so_luong || 1),
        0
      );
    }

    if (tienTinhDieuKien < Number(voucher.don_toi_thieu)) {
      return res.status(400).json({
        message: `Đơn hàng cần tối thiểu ${Number(voucher.don_toi_thieu).toLocaleString('vi-VN')}đ để dùng mã này!`,
      });
    }

    // Tính số tiền được giảm
    let soTienGiam = 0;
    if (voucher.loai_giam === 'so_tien_co_dinh') {
      soTienGiam = Number(voucher.gia_tri_giam);
    } else if (voucher.loai_giam === 'phan_tram') {
      soTienGiam = Math.round((tienTinhDieuKien * Number(voucher.gia_tri_giam)) / 100);
      if (voucher.giam_toi_da && soTienGiam > Number(voucher.giam_toi_da)) {
        soTienGiam = Number(voucher.giam_toi_da);
      }
    }

    // Không giảm vượt quá tiền hàng
    soTienGiam = Math.min(soTienGiam, tienTinhDieuKien);

    res.json({
      message: `Áp dụng thành công mã ${voucher.ma_code}!`,
      voucher,
      so_tien_giam: soTienGiam,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi kiểm tra mã giảm giá: ' + err.message });
  }
};

// 3. Lấy danh sách voucher của 1 gian hàng (cho Kênh Người Bán)
exports.layVoucherTheoShop = async (req, res) => {
  try {
    const { maGianHang } = req.params;
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query('SELECT * FROM ma_giam_gia WHERE ma_gian_hang = @ma_gian_hang ORDER BY ma_voucher DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải voucher của shop: ' + err.message });
  }
};

// 4. Tạo voucher mới (cho Chủ Shop hoặc Toàn sàn)
exports.taoVoucherMoi = async (req, res) => {
  try {
    const {
      ma_gian_hang,
      ma_code,
      ten_chuong_trinh,
      loai_giam,
      gia_tri_giam,
      giam_toi_da,
      don_toi_thieu,
      so_luong_phat_hanh,
      ngay_ket_thuc,
    } = req.body;

    if (!ma_code || !ten_chuong_trinh || !gia_tri_giam || !so_luong_phat_hanh) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin mã giảm giá!' });
    }

    const pool = await poolPromise;
    const codeChuan = ma_code.trim().toUpperCase();

    const checkTrung = await pool
      .request()
      .input('ma_code', sql.VarChar, codeChuan)
      .query('SELECT ma_voucher FROM ma_giam_gia WHERE UPPER(ma_code) = @ma_code');

    if (checkTrung.recordset.length > 0) {
      return res.status(400).json({ message: `Mã "${codeChuan}" đã tồn tại, vui lòng chọn tên mã khác!` });
    }

    await pool
      .request()
      .input('ma_gian_hang', sql.Int, ma_gian_hang || null)
      .input('ma_code', sql.VarChar, codeChuan)
      .input('ten_chuong_trinh', sql.NVarChar, ten_chuong_trinh)
      .input('loai_giam', sql.VarChar, loai_giam || 'so_tien_co_dinh')
      .input('gia_tri_giam', sql.Decimal(18, 2), Number(gia_tri_giam))
      .input('giam_toi_da', sql.Decimal(18, 2), giam_toi_da ? Number(giam_toi_da) : null)
      .input('don_toi_thieu', sql.Decimal(18, 2), Number(don_toi_thieu || 0))
      .input('so_luong_phat_hanh', sql.Int, Number(so_luong_phat_hanh))
      .input('ngay_ket_thuc', sql.DateTime, ngay_ket_thuc ? new Date(ngay_ket_thuc) : new Date('2026-12-31 23:59:59'))
      .query(`
        INSERT INTO ma_giam_gia (
          ma_gian_hang, ma_code, ten_chuong_trinh, loai_giam, gia_tri_giam,
          giam_toi_da, don_toi_thieu, so_luong_phat_hanh, da_su_dung, ngay_bat_dau, ngay_ket_thuc
        )
        VALUES (
          @ma_gian_hang, @ma_code, @ten_chuong_trinh, @loai_giam, @gia_tri_giam,
          @giam_toi_da, @don_toi_thieu, @so_luong_phat_hanh, 0, GETDATE(), @ngay_ket_thuc
        )
      `);

    res.json({ message: `🎉 Đã phát hành mã giảm giá ${codeChuan} thành công!` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo mã giảm giá: ' + err.message });
  }
};