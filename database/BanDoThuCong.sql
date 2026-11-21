

-- 1. BẢNG TÀI KHOẢN
CREATE TABLE tai_khoan (
    ma_tai_khoan INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20),
    anh_dai_dien VARCHAR(255),
    vai_tro VARCHAR(20) DEFAULT 'nguoi_dung' CHECK (vai_tro IN ('nguoi_dung', 'quan_tri_vien')),
    trang_thai_hoat_dong BIT DEFAULT 1,
    ngay_tao DATETIME DEFAULT GETDATE(),
    ngay_cap_nhat DATETIME DEFAULT GETDATE()
);

-- 2. BẢNG GIAN HÀNG RIÊNG
CREATE TABLE gian_hang (
    ma_gian_hang INT IDENTITY(1,1) PRIMARY KEY,
    ma_tai_khoan INT NOT NULL UNIQUE,
    ten_gian_hang NVARCHAR(120) NOT NULL UNIQUE,
    duong_dan_rieng VARCHAR(150) NOT NULL UNIQUE,
    mo_ta NVARCHAR(MAX),
    anh_logo VARCHAR(255),
    anh_bia VARCHAR(255),
    dia_chi_lay_hang NVARCHAR(MAX) NOT NULL,
    diem_danh_gia DECIMAL(2,1) DEFAULT 5.0,
    trang_thai VARCHAR(20) DEFAULT 'dang_hoat_dong' CHECK (trang_thai IN ('cho_duyet', 'dang_hoat_dong', 'bi_khoa')),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);

-- 3. BẢNG DANH MỤC SẢN PHẨM
CREATE TABLE danh_muc (
    ma_danh_muc INT IDENTITY(1,1) PRIMARY KEY,
    ten_danh_muc NVARCHAR(100) NOT NULL,
    duong_dan VARCHAR(120) NOT NULL UNIQUE,
    ma_danh_muc_cha INT NULL,
    FOREIGN KEY (ma_danh_muc_cha) REFERENCES danh_muc(ma_danh_muc)
);

-- 4. BẢNG SẢN PHẨM THỦ CÔNG
CREATE TABLE san_pham (
    ma_san_pham INT IDENTITY(1,1) PRIMARY KEY,
    ma_gian_hang INT NOT NULL,
    ma_danh_muc INT NULL,
    ten_san_pham NVARCHAR(200) NOT NULL,
    duong_dan VARCHAR(220) NOT NULL UNIQUE,
    mo_ta NVARCHAR(MAX),
    chat_lieu NVARCHAR(100),
    so_ngay_hoan_thien INT DEFAULT 1,
    cho_phep_dat_rieng BIT DEFAULT 0,
    gia_goc DECIMAL(12,2) NOT NULL,
    so_luong_ton INT DEFAULT 0,
    trang_thai VARCHAR(20) DEFAULT 'dang_ban' CHECK (trang_thai IN ('cho_duyet', 'dang_ban', 'da_an', 'tu_choi')),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang) ON DELETE CASCADE,
    FOREIGN KEY (ma_danh_muc) REFERENCES danh_muc(ma_danh_muc) ON DELETE SET NULL
);

-- 5. BẢNG HÌNH ẢNH SẢN PHẨM
CREATE TABLE hinh_anh_san_pham (
    ma_hinh_anh INT IDENTITY(1,1) PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    duong_dan_anh VARCHAR(255) NOT NULL,
    la_anh_dai_dien BIT DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE
);

-- 6. BẢNG PHÂN LOẠI SẢN PHẨM
CREATE TABLE phan_loai_san_pham (
    ma_phan_loai INT IDENTITY(1,1) PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    ten_phan_loai NVARCHAR(100) NOT NULL,
    gia_ban DECIMAL(12,2) NOT NULL,
    so_luong_ton INT DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE
);

-- 7. BẢNG SỔ ĐỊA CHỈ NHẬN HÀNG
CREATE TABLE dia_chi_nhan_hang (
    ma_dia_chi INT IDENTITY(1,1) PRIMARY KEY,
    ma_tai_khoan INT NOT NULL,
    ten_nguoi_nhan NVARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    tinh_thanh NVARCHAR(100) NOT NULL,
    quan_huyen NVARCHAR(100) NOT NULL,
    phuong_xa NVARCHAR(100) NOT NULL,
    dia_chi_cu_the NVARCHAR(MAX) NOT NULL,
    la_mac_dinh BIT DEFAULT 0,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);

-- 8. BẢNG GIỎ HÀNG
CREATE TABLE gio_hang (
    ma_gio_hang INT IDENTITY(1,1) PRIMARY KEY,
    ma_tai_khoan INT NOT NULL UNIQUE,
    ngay_cap_nhat DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);

-- 9. BẢNG CHI TIẾT GIỎ HÀNG
CREATE TABLE chi_tiet_gio_hang (
    ma_chi_tiet_gio INT IDENTITY(1,1) PRIMARY KEY,
    ma_gio_hang INT NOT NULL,
    ma_san_pham INT NOT NULL,
    ma_phan_loai INT NULL,
    so_luong INT NOT NULL DEFAULT 1,
    yeu_cau_ca_nhan_hoa NVARCHAR(MAX),
    ngay_them DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_gio_hang) REFERENCES gio_hang(ma_gio_hang) ON DELETE CASCADE,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham),
    FOREIGN KEY (ma_phan_loai) REFERENCES phan_loai_san_pham(ma_phan_loai)
);

-- 10. BẢNG MÃ GIẢM GIÁ
CREATE TABLE ma_giam_gia (
    ma_voucher INT IDENTITY(1,1) PRIMARY KEY,
    ma_gian_hang INT NULL,
    ma_code VARCHAR(30) NOT NULL UNIQUE,
    ten_chuong_trinh NVARCHAR(150) NOT NULL,
    loai_giam VARCHAR(20) NOT NULL CHECK (loai_giam IN ('phan_tram', 'so_tien_co_dinh')),
    gia_tri_giam DECIMAL(12,2) NOT NULL,
    giam_toi_da DECIMAL(12,2) NULL,
    don_toi_thieu DECIMAL(12,2) DEFAULT 0,
    so_luong_phat_hanh INT NOT NULL,
    da_su_dung INT DEFAULT 0,
    ngay_bat_dau DATETIME NOT NULL,
    ngay_ket_thuc DATETIME NOT NULL,
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang) ON DELETE CASCADE
);

-- 11. BẢNG ĐƠN HÀNG TỔNG
CREATE TABLE don_hang_tong (
    ma_don_tong INT IDENTITY(1,1) PRIMARY KEY,
    ma_tai_khoan INT NOT NULL,
    ma_tra_cuu_tong VARCHAR(30) NOT NULL UNIQUE,
    dia_chi_giao_hang NVARCHAR(MAX) NOT NULL,
    ten_nguoi_nhan NVARCHAR(100) NOT NULL,
    sdt_nguoi_nhan VARCHAR(20) NOT NULL,
    tong_thanh_toan DECIMAL(12,2) NOT NULL,
    phuong_thuc_thanh_toan VARCHAR(25) DEFAULT 'tien_mat_cod' CHECK (phuong_thuc_thanh_toan IN ('tien_mat_cod', 'vnpay', 'momo', 'chuyen_khoan_qr')),
    trang_thai_thanh_toan VARCHAR(25) DEFAULT 'chua_thanh_toan' CHECK (trang_thai_thanh_toan IN ('chua_thanh_toan', 'da_thanh_toan', 'da_hoan_tien')),
    ngay_dat DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
);

-- 12. BẢNG ĐƠN HÀNG CỦA SHOP
CREATE TABLE don_hang_shop (
    ma_don_shop INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_tong INT NOT NULL,
    ma_gian_hang INT NOT NULL,
    ma_tra_cuu_shop VARCHAR(35) NOT NULL UNIQUE,
    tien_hang DECIMAL(12,2) NOT NULL,
    phi_van_chuyen DECIMAL(12,2) DEFAULT 0,
    trang_thai_don VARCHAR(25) DEFAULT 'cho_xac_nhan' CHECK (trang_thai_don IN ('cho_xac_nhan', 'dang_lam_thu_cong', 'dang_giao', 'hoan_thanh', 'da_huy')),
    ghi_chu_khach_hang NVARCHAR(MAX),
    ngay_tao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_tong) REFERENCES don_hang_tong(ma_don_tong) ON DELETE CASCADE,
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang)
);

-- 13. BẢNG CHI TIẾT ĐƠN HÀNG
CREATE TABLE chi_tiet_don_hang (
    ma_chi_tiet INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_shop INT NOT NULL,
    ma_san_pham INT NULL,
    ma_phan_loai INT NULL,
    ten_mon_dat_rieng NVARCHAR(200) NULL,
    yeu_cau_ca_nhan_hoa NVARCHAR(MAX),
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (ma_don_shop) REFERENCES don_hang_shop(ma_don_shop) ON DELETE CASCADE,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham),
    FOREIGN KEY (ma_phan_loai) REFERENCES phan_loai_san_pham(ma_phan_loai)
);

-- 14. BẢNG GIAO DỊCH THANH TOÁN
CREATE TABLE giao_dich_thanh_toan (
    ma_giao_dich INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_tong INT NOT NULL,
    cong_thanh_toan VARCHAR(25) NOT NULL CHECK (cong_thanh_toan IN ('tien_mat_cod', 'vnpay', 'momo', 'chuyen_khoan_qr')),
    ma_giao_dich_doi_tac VARCHAR(100) NULL,
    so_tien_thanh_toan DECIMAL(12,2) NOT NULL,
    trang_thai VARCHAR(20) DEFAULT 'dang_cho' CHECK (trang_thai IN ('dang_cho', 'thanh_cong', 'that_bai', 'da_hoan_tien')),
    du_lieu_phan_hoi NVARCHAR(MAX) NULL,
    thoi_gian_giao_dich DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_tong) REFERENCES don_hang_tong(ma_don_tong) ON DELETE CASCADE
);

-- 15. BẢNG VÍ TIỀN GIAN HÀNG & LỊCH SỬ RÚT TIỀN
CREATE TABLE vi_gian_hang (
    ma_vi INT IDENTITY(1,1) PRIMARY KEY,
    ma_gian_hang INT NOT NULL UNIQUE,
    so_du_kha_dung DECIMAL(15,2) DEFAULT 0,
    so_du_cho_duyet DECIMAL(15,2) DEFAULT 0,
    ten_ngan_hang NVARCHAR(100),
    so_tai_khoan VARCHAR(50),
    ten_chu_tai_khoan NVARCHAR(100),
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang) ON DELETE CASCADE
);

CREATE TABLE lich_su_rut_tien (
    ma_yeu_cau_rut INT IDENTITY(1,1) PRIMARY KEY,
    ma_gian_hang INT NOT NULL,
    so_tien_rut DECIMAL(15,2) NOT NULL,
    phi_san_khau_tru DECIMAL(12,2) DEFAULT 0,
    trang_thai VARCHAR(20) DEFAULT 'cho_duyet' CHECK (trang_thai IN ('cho_duyet', 'da_chuyen_khoan', 'tu_choi')),
    ghi_chu_admin NVARCHAR(MAX),
    ngay_yeu_cau DATETIME DEFAULT GETDATE(),
    ngay_xu_ly DATETIME NULL,
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang) ON DELETE CASCADE
);

-- 16. BẢNG VẬN CHUYỂN
CREATE TABLE van_chuyen (
    ma_van_chuyen INT IDENTITY(1,1) PRIMARY KEY,
    ma_don_shop INT NOT NULL UNIQUE,
    don_vi_van_chuyen NVARCHAR(100) DEFAULT N'Giao Hàng Nhanh',
    ma_van_don VARCHAR(50) NULL,
    trang_thai_giao VARCHAR(25) DEFAULT 'cho_lay_hang' CHECK (trang_thai_giao IN ('cho_lay_hang', 'dang_trung_chuyen', 'dang_giao_khach', 'giao_thanh_cong', 'hoan_hang')),
    ngay_cap_nhat DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_don_shop) REFERENCES don_hang_shop(ma_don_shop) ON DELETE CASCADE
);

-- 17. BẢNG CHAT CSKH & ĐÁNH GIÁ
CREATE TABLE cuoc_hoi_thoai (
    ma_hoi_thoai INT IDENTITY(1,1) PRIMARY KEY,
    ma_tai_khoan INT NOT NULL,
    ma_gian_hang INT NOT NULL,
    thoi_gian_tin_cuoi DATETIME DEFAULT GETDATE(),
    CONSTRAINT cap_chat_duy_nhat UNIQUE (ma_tai_khoan, ma_gian_hang),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    FOREIGN KEY (ma_gian_hang) REFERENCES gian_hang(ma_gian_hang)
);

CREATE TABLE tin_nhan (
    ma_tin_nhan INT IDENTITY(1,1) PRIMARY KEY,
    ma_hoi_thoai INT NOT NULL,
    ma_tai_khoan_gui INT NOT NULL,
    loai_tin_nhan VARCHAR(20) DEFAULT 'van_ban' CHECK (loai_tin_nhan IN ('van_ban', 'hinh_anh', 'the_san_pham', 'the_chot_don')),
    noi_dung NVARCHAR(MAX),
    ma_san_pham_dinh_kem INT NULL,
    du_lieu_chot_don NVARCHAR(MAX) NULL,
    da_xem BIT DEFAULT 0,
    thoi_gian_gui DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_hoi_thoai) REFERENCES cuoc_hoi_thoai(ma_hoi_thoai) ON DELETE CASCADE,
    FOREIGN KEY (ma_tai_khoan_gui) REFERENCES tai_khoan(ma_tai_khoan),
    FOREIGN KEY (ma_san_pham_dinh_kem) REFERENCES san_pham(ma_san_pham)
);

CREATE TABLE danh_gia (
    ma_danh_gia INT IDENTITY(1,1) PRIMARY KEY,
    ma_san_pham INT NOT NULL,
    ma_tai_khoan INT NOT NULL,
    ma_don_shop INT NOT NULL,
    so_sao TINYINT NOT NULL CHECK (so_sao BETWEEN 1 AND 5),
    binh_luan NVARCHAR(MAX),
    hinh_anh_thuc_te VARCHAR(255),
    ngay_danh_gia DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham) ON DELETE CASCADE,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan),
    FOREIGN KEY (ma_don_shop) REFERENCES don_hang_shop(ma_don_shop)
);
GO

-- 1. Tài khoản
INSERT INTO tai_khoan (ho_ten, email, mat_khau, so_dien_thoai, vai_tro) VALUES
(N'Quản Trị Viên Sàn', 'admin@handmade.vn', '123456', '0901000001', 'quan_tri_vien'),
(N'Nguyễn Thị Mai (Chủ Tiệm Len)', 'mai.len@gmail.com', '123456', '0902000002', 'nguoi_dung'),
(N'Trần Văn Hùng (Xưởng Gốm)', 'hung.gom@gmail.com', '123456', '0903000003', 'nguoi_dung'),
(N'Lê Hoàng Yến (Khách Mua Hàng)', 'yen.khach@gmail.com', '123456', '0904000004', 'nguoi_dung');

-- 2. Gian hàng riêng
INSERT INTO gian_hang (ma_tai_khoan, ten_gian_hang, duong_dan_rieng, mo_ta, dia_chi_lay_hang, diem_danh_gia) VALUES
(2, N'Tiệm Len Nhà Mai', 'tiem-len-nha-mai', N'Chuyên đan móc thú bông, túi xách len milk cotton thủ công 100%, nhận làm theo mẫu ảnh.', N'120 Nguyễn Trãi, Quận 1, TP.HCM', 4.9),
(3, N'Gốm Mộc Bát Tràng', 'gom-moc-bat-trang', N'Cốc gốm, bình hoa vẽ tay nung thủ công, nhận khắc tên làm quà tặng.', N'45 Lê Lợi, Quận Hoàn Kiếm, Hà Nội', 4.8);

-- 3. Ví tiền gian hàng
INSERT INTO vi_gian_hang (ma_gian_hang, so_du_kha_dung, so_du_cho_duyet, ten_ngan_hang, so_tai_khoan, ten_chu_tai_khoan) VALUES
(1, 1500000.00, 350000.00, N'Vietcombank', '0071000999888', N'NGUYEN THI MAI'),
(2, 2400000.00, 0.00, N'Techcombank', '1903456789012', N'TRAN VAN HUNG');

-- 4. Danh mục sản phẩm
INSERT INTO danh_muc (ten_danh_muc, duong_dan, ma_danh_muc_cha) VALUES
(N'Đồ Len Đan Móc', 'do-len-dan-moc', NULL),
(N'Gốm Sứ Thủ Công', 'gom-su-thu-cong', NULL),
(N'Móc Khóa Len', 'moc-khoa-len', 1),
(N'Túi Xách Len', 'tui-xach-len', 1);

-- 5. Sản phẩm thủ công
INSERT INTO san_pham (ma_gian_hang, ma_danh_muc, ten_san_pham, duong_dan, mo_ta, chat_lieu, so_ngay_hoan_thien, cho_phep_dat_rieng, gia_goc, so_luong_ton) VALUES
(1, 3, N'Móc Khóa Gấu Bông Len Đan Tay', 'moc-khoa-gau-bong-len', N'Móc khóa gấu nhỏ xinh đan bằng len cotton Hàn Quốc mềm mịn, không xù lông.', N'Len Milk Cotton', 2, 1, 65000.00, 20),
(1, 4, N'Túi Tote Hoa Cúc Móc Thủ Công', 'tui-tote-hoa-cuc', N'Túi xách đi chơi họa tiết hoa cúc nổi, lót vải bên trong chắc chắn.', N'Len Sợi Dệt', 4, 1, 280000.00, 5),
(2, 2, N'Cốc Gốm Vẽ Hoa Bồ Công Anh Khắc Tên', 'coc-gom-ve-hoa-bo-cong-anh', N'Cốc gốm nung nhiệt độ cao an toàn sức khỏe, hỗ trợ khắc chữ dưới đáy cốc.', N'Đất sét trắng', 3, 1, 190000.00, 12);

-- 6. Hình ảnh & Phân loại sản phẩm
INSERT INTO hinh_anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_dai_dien) VALUES
(1, '/uploads/san-pham/gau-len-1.jpg', 1),
(2, '/uploads/san-pham/tui-hoa-cuc-1.jpg', 1),
(3, '/uploads/san-pham/coc-gom-1.jpg', 1);

INSERT INTO phan_loai_san_pham (ma_san_pham, ten_phan_loai, gia_ban, so_luong_ton) VALUES
(1, N'Gấu Nâu Đeo Nơ Đỏ', 65000.00, 10),
(1, N'Gấu Trắng Đeo Yếm Xanh', 70000.00, 10),
(2, N'Màu Kem Phối Vàng', 280000.00, 5),
(3, N'Dung tích 350ml - Khắc tên', 190000.00, 12);

-- 7. Địa chỉ nhận hàng & Giỏ hàng
INSERT INTO dia_chi_nhan_hang (ma_tai_khoan, ten_nguoi_nhan, so_dien_thoai, tinh_thanh, quan_huyen, phuong_xa, dia_chi_cu_the, la_mac_dinh) VALUES
(4, N'Lê Hoàng Yến', '0904000004', N'TP. Hồ Chí Minh', N'Quận Bình Thạnh', N'Phường 25', N'Số 88 Đường D2', 1);

INSERT INTO gio_hang (ma_tai_khoan) VALUES (4);
INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, ma_phan_loai, so_luong, yeu_cau_ca_nhan_hoa) VALUES
(1, 1, 1, 2, N'Gắn thêm thẻ tên chữ Yến giúp mình'),
(1, 3, 4, 1, N'Khắc tên: Hoàng Yến 2026');

-- 8. Mã giảm giá
INSERT INTO ma_giam_gia (ma_gian_hang, ma_code, ten_chuong_trinh, loai_giam, gia_tri_giam, giam_toi_da, don_toi_thieu, so_luong_phat_hanh, ngay_bat_dau, ngay_ket_thuc) VALUES
(NULL, 'SANHANDMADE30', N'Giảm 30K cho đơn từ 200K toàn sàn', 'so_tien_co_dinh', 30000.00, NULL, 200000.00, 100, '2026-01-01 00:00:00', '2026-12-31 23:59:59'),
(1, 'TIEMMAI10', N'Giảm 10% tối đa 50K tại Tiệm Len Nhà Mai', 'phan_tram', 10.00, 50000.00, 100000.00, 50, '2026-01-01 00:00:00', '2026-12-31 23:59:59');

-- 9. Đơn hàng mẫu
INSERT INTO don_hang_tong (ma_tai_khoan, ma_tra_cuu_tong, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan, tong_thanh_toan, phuong_thuc_thanh_toan, trang_thai_thanh_toan) VALUES
(4, 'DH20261119001', N'Số 88 Đường D2, Phường 25, Quận Bình Thạnh, TP.HCM', N'Lê Hoàng Yến', '0904000004', 345000.00, 'vnpay', 'da_thanh_toan');

INSERT INTO don_hang_shop (ma_don_tong, ma_gian_hang, ma_tra_cuu_shop, tien_hang, phi_van_chuyen, trang_thai_don, ghi_chu_khach_hang) VALUES
(1, 1, 'DH20261119001-S1', 130000.00, 15000.00, 'dang_lam_thu_cong', N'Gói hộp quà giúp mình nhé shop'),
(1, 2, 'DH20261119001-S2', 190000.00, 10000.00, 'hoan_thanh', N'Bọc chống sốc kỹ giúp mình');

INSERT INTO chi_tiet_don_hang (ma_don_shop, ma_san_pham, ma_phan_loai, yeu_cau_ca_nhan_hoa, so_luong, don_gia) VALUES
(1, 1, 1, N'Gắn thêm thẻ tên chữ Yến', 2, 65000.00),
(2, 3, 4, N'Khắc tên: Hoàng Yến 2026', 1, 190000.00);

-- 10. Giao dịch thanh toán & Vận chuyển & Rút tiền
INSERT INTO giao_dich_thanh_toan (ma_don_tong, cong_thanh_toan, ma_giao_dich_doi_tac, so_tien_thanh_toan, trang_thai, du_lieu_phan_hoi) VALUES
(1, 'vnpay', 'VNP14589632', 345000.00, 'thanh_cong', N'{"vnp_ResponseCode": "00", "vnp_BankCode": "NCB"}');

INSERT INTO van_chuyen (ma_don_shop, don_vi_van_chuyen, ma_van_don, trang_thai_giao) VALUES
(1, N'Giao Hàng Nhanh', 'GHN9988771', 'cho_lay_hang'),
(2, N'Giao Hàng Tiết Kiệm', 'GHTK5544332', 'giao_thanh_cong');

INSERT INTO lich_su_rut_tien (ma_gian_hang, so_tien_rut, phi_san_khau_tru, trang_thai) VALUES
(2, 1000000.00, 50000.00, 'da_chuyen_khoan');

-- 11. Cuộc hội thoại Chat CSKH & Chốt đơn qua Chat
INSERT INTO cuoc_hoi_thoai (ma_tai_khoan, ma_gian_hang) VALUES (4, 1);

INSERT INTO tin_nhan (ma_hoi_thoai, ma_tai_khoan_gui, loai_tin_nhan, noi_dung, ma_san_pham_dinh_kem, du_lieu_chot_don) VALUES
(1, 4, 'the_san_pham', N'Chào shop, mình muốn hỏi mẫu túi hoa cúc này có nhận móc theo phối màu riêng không ạ?', 2, NULL),
(1, 2, 'van_ban', N'Chào bạn nha, bên mình có nhận phối màu theo yêu cầu ạ. Bạn muốn phối màu gì nè?', NULL, NULL),
(1, 4, 'van_ban', N'Mình muốn nền màu xanh bơ, hoa màu trắng kem ạ. Giá vẫn vậy đúng không shop?', NULL, NULL),
(1, 2, 'the_chot_don', N'Shop tạo đơn đặt riêng cho bạn rồi nè, bạn bấm đặt mua ở thẻ này nhé!', NULL, N'{"ten_mon": "Túi Tote Hoa Cúc (Phối Xanh Bơ - Trắng Kem)", "gia": 295000, "so_ngay_lam": 4}');

-- 12. Đánh giá sản phẩm
INSERT INTO danh_gia (ma_san_pham, ma_tai_khoan, ma_don_shop, so_sao, binh_luan, hinh_anh_thuc_te) VALUES
(3, 4, 2, 5, N'Cốc gốm dày dặn, nét khắc tên cực kỳ sắc sảo, shop gói hàng siêu kỹ!', '/uploads/danh-gia/review-coc-gom.jpg');
GO

