const { sql, poolPromise } = require('../config/db');

// 1. Lấy danh sách các cuộc trò chuyện của tài khoản
exports.layDanhSachHoiThoai = async (req, res) => {
  const { maTaiKhoan } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, maTaiKhoan)
      .query(`
        SELECT ht.ma_hoi_thoai, ht.thoi_gian_tin_cuoi,
               gh.ma_gian_hang, gh.ten_gian_hang, gh.ma_tai_khoan AS ma_chu_shop,
               tk.ma_tai_khoan AS ma_khach_hang, tk.ho_ten AS ten_khach_hang,
               (SELECT TOP 1 noi_dung FROM tin_nhan WHERE ma_hoi_thoai = ht.ma_hoi_thoai ORDER BY thoi_gian_gui DESC) AS tin_nhan_cuoi
        FROM cuoc_hoi_thoai ht
        INNER JOIN gian_hang gh ON ht.ma_gian_hang = gh.ma_gian_hang
        INNER JOIN tai_khoan tk ON ht.ma_tai_khoan = tk.ma_tai_khoan
        WHERE ht.ma_tai_khoan = @ma_tai_khoan OR gh.ma_tai_khoan = @ma_tai_khoan
        ORDER BY ht.thoi_gian_tin_cuoi DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách hội thoại: ' + err.message });
  }
};

// 2. Mở hoặc tạo mới cuộc trò chuyện giữa Khách hàng và Gian hàng
exports.moHoiThoai = async (req, res) => {
  const { ma_tai_khoan, ma_gian_hang } = req.body;
  try {
    const pool = await poolPromise;
    const check = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .query('SELECT * FROM cuoc_hoi_thoai WHERE ma_tai_khoan = @ma_tai_khoan AND ma_gian_hang = @ma_gian_hang');

    if (check.recordset.length > 0) {
      return res.json(check.recordset[0]);
    }

    const insert = await pool
      .request()
      .input('ma_tai_khoan', sql.Int, ma_tai_khoan)
      .input('ma_gian_hang', sql.Int, ma_gian_hang)
      .query(`
        INSERT INTO cuoc_hoi_thoai (ma_tai_khoan, ma_gian_hang)
        OUTPUT INSERTED.*
        VALUES (@ma_tai_khoan, @ma_gian_hang)
      `);

    res.status(201).json(insert.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi mở hội thoại: ' + err.message });
  }
};

// 3. Lấy toàn bộ tin nhắn trong 1 cuộc hội thoại
exports.layTinNhan = async (req, res) => {
  const { maHoiThoai } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('ma_hoi_thoai', sql.Int, maHoiThoai)
      .query(`
        SELECT tn.ma_tin_nhan, tn.ma_hoi_thoai, tn.ma_tai_khoan_gui AS ma_nguoi_gui,
               tn.loai_tin_nhan, tn.noi_dung, tn.du_lieu_chot_don AS du_lieu_thoa_thuan,
               tn.thoi_gian_gui, tk.ho_ten AS ten_nguoi_gui
        FROM tin_nhan tn
        INNER JOIN tai_khoan tk ON tn.ma_tai_khoan_gui = tk.ma_tai_khoan
        WHERE tn.ma_hoi_thoai = @ma_hoi_thoai
        ORDER BY tn.thoi_gian_gui ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải tin nhắn: ' + err.message });
  }
};

// 4. Gửi tin nhắn mới (Tin nhắn thường hoặc Thẻ chốt đơn thỏa thuận)
exports.guiTinNhan = async (req, res) => {
  const { ma_hoi_thoai, ma_nguoi_gui, loai_tin_nhan, noi_dung, du_lieu_thoa_thuan } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('ma_hoi_thoai', sql.Int, ma_hoi_thoai)
      .input('ma_tai_khoan_gui', sql.Int, ma_nguoi_gui)
      .input('loai_tin_nhan', sql.VarChar, loai_tin_nhan || 'van_ban')
      .input('noi_dung', sql.NVarChar, noi_dung)
      .input('du_lieu_chot_don', sql.NVarChar, du_lieu_thoa_thuan ? JSON.stringify(du_lieu_thoa_thuan) : null)
      .query(`
        INSERT INTO tin_nhan (ma_hoi_thoai, ma_tai_khoan_gui, loai_tin_nhan, noi_dung, du_lieu_chot_don)
        OUTPUT INSERTED.*
        VALUES (@ma_hoi_thoai, @ma_tai_khoan_gui, @loai_tin_nhan, @noi_dung, @du_lieu_chot_don)
      `);

    await pool
      .request()
      .input('ma_hoi_thoai', sql.Int, ma_hoi_thoai)
      .query('UPDATE cuoc_hoi_thoai SET thoi_gian_tin_cuoi = GETDATE() WHERE ma_hoi_thoai = @ma_hoi_thoai');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi tin nhắn: ' + err.message });
  }
};