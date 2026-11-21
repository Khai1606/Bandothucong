const { sql, poolPromise } = require('../config/db');

// Kho lưu tạm mã OTP trên RAM (key: email, value: { otp, hetHan })
const khoOtpTam = new Map();

// 1. ĐĂNG NHẬP
exports.dangNhap = async (req, res) => {
  const { email, mat_khau } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('email', sql.VarChar, email)
      .input('mat_khau', sql.VarChar, mat_khau)
      .query(`
        SELECT tk.ma_tai_khoan, tk.ho_ten, tk.email, tk.so_dien_thoai, tk.vai_tro, tk.trang_thai_hoat_dong,
               gh.ma_gian_hang, gh.ten_gian_hang
        FROM tai_khoan tk
        LEFT JOIN gian_hang gh ON tk.ma_tai_khoan = gh.ma_tai_khoan
        WHERE tk.email = @email AND tk.mat_khau = @mat_khau
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác!' });
    }

    const user = result.recordset[0];
    if (user.trang_thai_hoat_dong === false || user.trang_thai_hoat_dong === 0) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa!' });
    }

    res.json({
      message: 'Đăng nhập thành công!',
      tai_khoan: user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng nhập: ' + err.message });
  }
};

// 2. ĐĂNG KÝ TÀI KHOẢN MỚI
exports.dangKy = async (req, res) => {
  const { ho_ten, email, mat_khau, so_dien_thoai } = req.body;
  try {
    const pool = await poolPromise;

    const check = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT ma_tai_khoan FROM tai_khoan WHERE email = @email');

    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email này đã được sử dụng!' });
    }

    await pool
      .request()
      .input('ho_ten', sql.NVarChar, ho_ten)
      .input('email', sql.VarChar, email)
      .input('mat_khau', sql.VarChar, mat_khau)
      .input('so_dien_thoai', sql.VarChar, so_dien_thoai || '')
      .query(`
        INSERT INTO tai_khoan (ho_ten, email, mat_khau, so_dien_thoai, vai_tro, trang_thai_hoat_dong)
        VALUES (@ho_ten, @email, @mat_khau, @so_dien_thoai, 'nguoi_dung', 1)
      `);

    res.status(201).json({ message: 'Đăng ký tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng ký: ' + err.message });
  }
};

// 3. LẤY DANH SÁCH TÀI KHOẢN (CHO ADMIN)
exports.layDanhSachTaiKhoan = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ma_tai_khoan, ho_ten, email, so_dien_thoai, vai_tro, trang_thai_hoat_dong, ngay_tao
      FROM tai_khoan
      ORDER BY ma_tai_khoan DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách tài khoản: ' + err.message });
  }
};

// 4. KHÓA / MỞ KHÓA TÀI KHOẢN (CHO ADMIN)
exports.capNhatTrangThai = async (req, res) => {
  const { id } = req.params;
  const { trang_thai_hoat_dong } = req.body;
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('trang_thai', sql.Bit, trang_thai_hoat_dong ? 1 : 0)
      .query('UPDATE tai_khoan SET trang_thai_hoat_dong = @trang_thai WHERE ma_tai_khoan = @id');

    res.json({ message: 'Cập nhật trạng thái tài khoản thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái: ' + err.message });
  }
};

// 5. GỬI MÃ OTP QUÊN MẬT KHẨU
exports.guiOtpQuenMatKhau = async (req, res) => {
  const { email } = req.body;
  try {
    const pool = await poolPromise;
    const check = await pool
      .request()
      .input('email', sql.VarChar, email)
      .query('SELECT ma_tai_khoan, ho_ten FROM tai_khoan WHERE email = @email');

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống!' });
    }

    const maOtp = Math.floor(100000 + Math.random() * 900000).toString();
    khoOtpTam.set(email, {
      otp: maOtp,
      hetHan: Date.now() + 5 * 60 * 1000,
    });

    console.log(`🔑 Mã OTP khôi phục mật khẩu cho ${email} là: ${maOtp}`);

    res.json({
      message: 'Đã tạo mã xác nhận OTP thành công!',
      otp_demo: maOtp,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi OTP: ' + err.message });
  }
};

// 6. XÁC NHẬN OTP & ĐẶT LẠI MẬT KHẨU MỚI
exports.datLaiMatKhau = async (req, res) => {
  const { email, otp, mat_khau_moi } = req.body;
  try {
    const duLieuOtp = khoOtpTam.get(email);

    if (!duLieuOtp) {
      return res.status(400).json({ message: 'Bạn chưa yêu cầu mã OTP hoặc mã đã hết hạn!' });
    }
    if (Date.now() > duLieuOtp.hetHan) {
      khoOtpTam.delete(email);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn, vui lòng lấy mã mới!' });
    }
    if (duLieuOtp.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác!' });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input('email', sql.VarChar, email)
      .input('mat_khau_moi', sql.VarChar, mat_khau_moi)
      .query('UPDATE tai_khoan SET mat_khau = @mat_khau_moi WHERE email = @email');

    khoOtpTam.delete(email);

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đặt lại mật khẩu: ' + err.message });
  }
};

// 7. LẤY THÔNG TIN CHI TIẾT HỒ SƠ CÁ NHÂN
exports.layHoSoCaNhan = async (req, res) => {
  try {
    const { maTaiKhoan } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, maTaiKhoan)
      .query(`
        SELECT
          tk.ma_tai_khoan,
          tk.ho_ten,
          tk.email,
          tk.so_dien_thoai,
          tk.vai_tro,
          tk.trang_thai_hoat_dong,
          tk.ngay_tao,
          gh.ma_gian_hang,
          gh.ten_gian_hang,
          gh.dia_chi_lay_hang,
          gh.diem_danh_gia,
          (SELECT COUNT(*) FROM don_hang_tong WHERE ma_tai_khoan = tk.ma_tai_khoan) AS tong_don_da_dat
        FROM tai_khoan tk
        LEFT JOIN gian_hang gh ON tk.ma_tai_khoan = gh.ma_tai_khoan
        WHERE tk.ma_tai_khoan = @ma_tai_khoan
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản!' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải hồ sơ cá nhân: ' + err.message });
  }
};

// 8. CẬP NHẬT HỌ TÊN, SỐ ĐIỆN THOẠI HOẶC ĐỔI MẬT KHẨU
exports.capNhatHoSoCaNhan = async (req, res) => {
  try {
    const { maTaiKhoan } = req.params;
    const { ho_ten, so_dien_thoai, mat_khau_moi } = req.body;

    if (!ho_ten || !ho_ten.trim()) {
      return res.status(400).json({ message: 'Họ tên không được để trống!' });
    }

    const pool = await poolPromise;

    if (mat_khau_moi && mat_khau_moi.trim().length > 0) {
      if (mat_khau_moi.trim().length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      }
      await pool
        .request()
        .input('ma_tai_khoan', sql.Int, maTaiKhoan)
        .input('ho_ten', sql.NVarChar, ho_ten.trim())
        .input('so_dien_thoai', sql.VarChar, so_dien_thoai || '')
        .input('mat_khau', sql.VarChar, mat_khau_moi.trim())
        .query(`
          UPDATE tai_khoan
          SET ho_ten = @ho_ten, so_dien_thoai = @so_dien_thoai, mat_khau = @mat_khau
          WHERE ma_tai_khoan = @ma_tai_khoan
        `);
    } else {
      await pool
        .request()
        .input('ma_tai_khoan', sql.Int, maTaiKhoan)
        .input('ho_ten', sql.NVarChar, ho_ten.trim())
        .input('so_dien_thoai', sql.VarChar, so_dien_thoai || '')
        .query(`
          UPDATE tai_khoan
          SET ho_ten = @ho_ten, so_dien_thoai = @so_dien_thoai
          WHERE ma_tai_khoan = @ma_tai_khoan
        `);
    }

    const kqMoi = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, maTaiKhoan)
      .query('SELECT ma_tai_khoan, ho_ten, email, so_dien_thoai, vai_tro FROM tai_khoan WHERE ma_tai_khoan = @ma_tai_khoan');

    res.json({
      message: '✅ Đã cập nhật thông tin hồ sơ thành công!',
      tai_khoan: kqMoi.recordset[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật hồ sơ: ' + err.message });
  }
};