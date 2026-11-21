const { sql, poolPromise } = require('../config/db');

// 1. Lấy thông tin ví & lịch sử rút tiền của 1 gian hàng
exports.layThongTinViShop = async (req, res) => {
  try {
    const { maGianHang } = req.params;
    const pool = await poolPromise;

    // Tính tổng doanh thu thực tế từ các đơn đã hoàn thành của shop
    const kqDoanhThu = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query(`
        SELECT ISNULL(SUM(tien_hang), 0) AS tong_doanh_thu
        FROM don_hang_shop
        WHERE ma_gian_hang = @ma_gian_hang AND trang_thai_don = 'hoan_thanh'
      `);
    const tongDoanhThu = Number(kqDoanhThu.recordset[0].tong_doanh_thu || 0);

    // Tính tổng tiền đã duyệt rút và đang chờ duyệt từ lich_su_rut_tien
    const kqRut = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN trang_thai = 'da_duyet' THEN so_tien_rut ELSE 0 END), 0) AS tong_da_rut,
          ISNULL(SUM(CASE WHEN trang_thai = 'cho_duyet' THEN so_tien_rut ELSE 0 END), 0) AS tong_cho_duyet
        FROM lich_su_rut_tien
        WHERE ma_gian_hang = @ma_gian_hang
      `);

    const tongDaRut = Number(kqRut.recordset[0].tong_da_rut || 0);
    const tongChoDuyet = Number(kqRut.recordset[0].tong_cho_duyet || 0);
    const soDuKhaDung = Math.max(0, tongDoanhThu - tongDaRut - tongChoDuyet);

    // Lấy thông tin ngân hàng mặc định từ bảng gian_hang (nếu ví chưa có)
    const kqShop = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query('SELECT ngan_hang_ten, ngan_hang_so_tk, ngan_hang_chu_tk FROM gian_hang WHERE ma_gian_hang = @ma_gian_hang');
    const shopInfo = kqShop.recordset[0] || {};

    // Đồng bộ số dư vào đúng các cột của bảng vi_gian_hang
    await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .input('so_du_kha_dung', sql.Decimal(18, 2), soDuKhaDung)
      .input('so_du_cho_duyet', sql.Decimal(18, 2), tongChoDuyet)
      .input('ten_ngan_hang', sql.NVarChar, shopInfo.ngan_hang_ten || '')
      .input('so_tai_khoan', sql.VarChar, shopInfo.ngan_hang_so_tk || '')
      .input('ten_chu_tai_khoan', sql.NVarChar, shopInfo.ngan_hang_chu_tk || '')
      .query(`
        IF EXISTS (SELECT 1 FROM vi_gian_hang WHERE ma_gian_hang = @ma_gian_hang)
          UPDATE vi_gian_hang
          SET so_du_kha_dung = @so_du_kha_dung,
              so_du_cho_duyet = @so_du_cho_duyet
          WHERE ma_gian_hang = @ma_gian_hang
        ELSE
          INSERT INTO vi_gian_hang (ma_gian_hang, so_du_kha_dung, so_du_cho_duyet, ten_ngan_hang, so_tai_khoan, ten_chu_tai_khoan)
          VALUES (@ma_gian_hang, @so_du_kha_dung, @so_du_cho_duyet, @ten_ngan_hang, @so_tai_khoan, @ten_chu_tai_khoan)
      `);

    const kqVi = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query('SELECT * FROM vi_gian_hang WHERE ma_gian_hang = @ma_gian_hang');

    const lichSu = await pool
      .request()
      .input('ma_gian_hang', sql.Int, maGianHang)
      .query('SELECT * FROM lich_su_rut_tien WHERE ma_gian_hang = @ma_gian_hang ORDER BY ma_yeu_cau_rut DESC');

    res.json({
      vi: kqVi.recordset[0],
      tong_doanh_thu: tongDoanhThu,
      so_du_kha_dung: soDuKhaDung,
      so_du_cho_duyet: tongChoDuyet,
      tong_da_rut: tongDaRut,
      lich_su_rut_tien: lichSu.recordset,
    });
  } catch (err) {
    console.error('Lỗi tải thông tin ví:', err);
    res.status(500).json({ message: 'Lỗi tải thông tin ví: ' + err.message });
  }
};

// 2. Chủ shop tạo yêu cầu rút tiền (Cập nhật thông tin ngân hàng vào vi_gian_hang & tạo phiếu trong lich_su_rut_tien)
exports.taoYeuCauRutTien = async (req, res) => {
  try {
    const { ma_gian_hang, so_tien_rut, ten_ngan_hang, so_tai_khoan, ten_chu_tai_khoan } = req.body;
    const soTien = Number(so_tien_rut);

    if (!ma_gian_hang || !soTien || soTien < 50000) {
      return res.status(400).json({ message: 'Số tiền rút tối thiểu là 50.000đ!' });
    }
    if (!ten_ngan_hang || !so_tai_khoan || !ten_chu_tai_khoan) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Ngân hàng, Số tài khoản và Tên chủ tài khoản!' });
    }

    const pool = await poolPromise;

    const kqVi = await pool
      .request()
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .query('SELECT so_du_kha_dung FROM vi_gian_hang WHERE ma_gian_hang = @ma_gian_hang');

    const soDuHienTai = kqVi.recordset.length > 0 ? Number(kqVi.recordset[0].so_du_kha_dung) : 0;
    if (soTien > soDuHienTai) {
      return res.status(400).json({
        message: `Số dư khả dụng hiện tại chỉ còn ${soDuHienTai.toLocaleString('vi-VN')}đ!`,
      });
    }

    // Phí sàn khấu trừ 5%
    const phiSanKhauTru = Math.round(soTien * 0.05);

    // Lưu vào bảng lich_su_rut_tien theo đúng cột thực tế
    await pool
      .request()
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .input('so_tien_rut', sql.Decimal(18, 2), soTien)
      .input('phi_san_khau_tru', sql.Decimal(18, 2), phiSanKhauTru)
      .query(`
        INSERT INTO lich_su_rut_tien (ma_gian_hang, so_tien_rut, phi_san_khau_tru, trang_thai, ngay_yeu_cau)
        VALUES (@ma_gian_hang, @so_tien_rut, @phi_san_khau_tru, 'cho_duyet', GETDATE())
      `);

    // Cập nhật thông tin ngân hàng & chuyển số dư sang chờ duyệt trong vi_gian_hang
    await pool
      .request()
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .input('so_tien_rut', sql.Decimal(18, 2), soTien)
      .input('ten_ngan_hang', sql.NVarChar, ten_ngan_hang)
      .input('so_tai_khoan', sql.VarChar, so_tai_khoan)
      .input('ten_chu_tai_khoan', sql.NVarChar, ten_chu_tai_khoan)
      .query(`
        UPDATE vi_gian_hang
        SET so_du_kha_dung = so_du_kha_dung - @so_tien_rut,
            so_du_cho_duyet = so_du_cho_duyet + @so_tien_rut,
            ten_ngan_hang = @ten_ngan_hang,
            so_tai_khoan = @so_tai_khoan,
            ten_chu_tai_khoan = @ten_chu_tai_khoan
        WHERE ma_gian_hang = @ma_gian_hang
      `);

    res.json({
      message: `🎉 Đã gửi lệnh rút ${soTien.toLocaleString('vi-VN')}đ (Phí sàn 5%: ${phiSanKhauTru.toLocaleString('vi-VN')}đ)!`,
    });
  } catch (err) {
    console.error('Lỗi tạo yêu cầu rút tiền:', err);
    res.status(500).json({ message: 'Lỗi tạo yêu cầu rút tiền: ' + err.message });
  }
};

// 3. Admin lấy toàn bộ danh sách yêu cầu rút tiền kèm thông tin ngân hàng từ vi_gian_hang
exports.layTatCaYeuCauRutTien = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        r.ma_yeu_cau_rut,
        r.ma_gian_hang,
        r.so_tien_rut,
        r.phi_san_khau_tru,
        r.trang_thai,
        r.ghi_chu_admin,
        r.ngay_yeu_cau,
        r.ngay_xu_ly,
        g.ten_gian_hang,
        v.ten_ngan_hang,
        v.so_tai_khoan,
        v.ten_chu_tai_khoan
      FROM lich_su_rut_tien r
      JOIN gian_hang g ON r.ma_gian_hang = g.ma_gian_hang
      LEFT JOIN vi_gian_hang v ON r.ma_gian_hang = v.ma_gian_hang
      ORDER BY r.ma_yeu_cau_rut DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách rút tiền: ' + err.message });
  }
};

// 4. Admin duyệt hoặc từ chối yêu cầu rút tiền
exports.duyetYeuCauRutTien = async (req, res) => {
  try {
    const { maRutTien } = req.params;
    const { trang_thai, ghi_chu_admin } = req.body; // 'da_duyet' hoặc 'tu_choi'
    const pool = await poolPromise;

    const kqPhieu = await pool
      .request()
      .input('ma_yeu_cau_rut', sql.Int, maRutTien)
      .query('SELECT * FROM lich_su_rut_tien WHERE ma_yeu_cau_rut = @ma_yeu_cau_rut');

    if (kqPhieu.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy phiếu yêu cầu rút tiền!' });
    }
    const phieu = kqPhieu.recordset[0];

    await pool
      .request()
      .input('ma_yeu_cau_rut', sql.Int, maRutTien)
      .input('trang_thai', sql.VarChar, trang_thai)
      .input('ghi_chu_admin', sql.NVarChar, ghi_chu_admin || '')
      .query(`
        UPDATE lich_su_rut_tien
        SET trang_thai = @trang_thai,
            ghi_chu_admin = @ghi_chu_admin,
            ngay_xu_ly = GETDATE()
        WHERE ma_yeu_cau_rut = @ma_yeu_cau_rut
      `);

    // Cập nhật lại số dư trong vi_gian_hang
    if (trang_thai === 'da_duyet') {
      await pool
        .request()
        .input('ma_gian_hang', sql.Int, phieu.ma_gian_hang)
        .input('so_tien_rut', sql.Decimal(18, 2), phieu.so_tien_rut)
        .query('UPDATE vi_gian_hang SET so_du_cho_duyet = so_du_cho_duyet - @so_tien_rut WHERE ma_gian_hang = @ma_gian_hang');
    } else if (trang_thai === 'tu_choi') {
      await pool
        .request()
        .input('ma_gian_hang', sql.Int, phieu.ma_gian_hang)
        .input('so_tien_rut', sql.Decimal(18, 2), phieu.so_tien_rut)
        .query(`
          UPDATE vi_gian_hang
          SET so_du_cho_duyet = so_du_cho_duyet - @so_tien_rut,
              so_du_kha_dung = so_du_kha_dung + @so_tien_rut
          WHERE ma_gian_hang = @ma_gian_hang
        `);
    }

    res.json({
      message:
        trang_thai === 'da_duyet'
          ? '✅ Đã duyệt chi chuyển khoản cho gian hàng!'
          : '❌ Đã từ chối phiếu rút và hoàn lại số dư vào ví shop.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xử lý duyệt rút tiền: ' + err.message });
  }
};