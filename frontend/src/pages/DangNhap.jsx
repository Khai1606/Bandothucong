import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function DangNhap({ setTaiKhoan }) {
  // cheDo gồm: 'dang_nhap' | 'dang_ky' | 'quen_mat_khau'
  const [cheDo, setCheDo] = useState('dang_nhap');
  const [buocQuenMk, setBuocQuenMk] = useState(1); // Bước 1: Nhập email, Bước 2: Nhập OTP + MK mới

  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('yen.khach@gmail.com');
  const [matKhau, setMatKhau] = useState('123456');
  const [otp, setOtp] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [otpHienThiDemo, setOtpHienThiDemo] = useState('');

  const [thongBao, setThongBao] = useState({ loai: '', noiDung: '' });
  const [dangTai, setDangTai] = useState(false);
  const navigate = useNavigate();

  const chuyenCheDo = (cheDoMoi) => {
    setCheDo(cheDoMoi);
    setBuocQuenMk(1);
    setOtp('');
    setMatKhauMoi('');
    setOtpHienThiDemo('');
    setThongBao({ loai: '', noiDung: '' });
  };

  const xuLySubmit = async (e) => {
    e.preventDefault();
    setThongBao({ loai: '', noiDung: '' });
    setDangTai(true);

    try {
      // 1. LUỒNG ĐĂNG KÝ
      if (cheDo === 'dang_ky') {
        const res = await axiosClient.post('/tai-khoan/dang-ky', {
          ho_ten: hoTen,
          email,
          mat_khau: matKhau,
          so_dien_thoai: soDienThoai,
        });
        chuyenCheDo('dang_nhap');
        setThongBao({ loai: 'thanh_cong', noiDung: res.data.message + ' Hãy đăng nhập ngay!' });
      }

      // 2. LUỒNG QUÊN MẬT KHẨU
      else if (cheDo === 'quen_mat_khau') {
        if (buocQuenMk === 1) {
          const res = await axiosClient.post('/tai-khoan/quen-mat-khau/gui-otp', { email });
          setOtpHienThiDemo(res.data.otp_demo);
          setBuocQuenMk(2);
          setThongBao({
            loai: 'thanh_cong',
            noiDung: `Mã OTP đã được gửi tới ${email}. (Mã test đồ án: ${res.data.otp_demo})`,
          });
        } else {
          const res = await axiosClient.post('/tai-khoan/quen-mat-khau/dat-lai', {
            email,
            otp,
            mat_khau_moi: matKhauMoi,
          });
          chuyenCheDo('dang_nhap');
          setMatKhau(matKhauMoi);
          setThongBao({ loai: 'thanh_cong', noiDung: res.data.message });
        }
      }

      // 3. LUỒNG ĐĂNG NHẬP
      else {
        const res = await axiosClient.post('/tai-khoan/dang-nhap', {
          email,
          mat_khau: matKhau,
        });

        const user = res.data.tai_khoan;
        localStorage.setItem('tai_khoan', JSON.stringify(user));
        setTaiKhoan(user);

        if (user.vai_tro === 'quan_tri_vien') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setThongBao({
        loai: 'loi',
        noiDung: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!',
      });
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md border border-amber-100">
        <h2 className="text-2xl font-bold text-center text-amber-900 mb-2">
          {cheDo === 'dang_ky' && 'Đăng Ký Tài Khoản Mới'}
          {cheDo === 'dang_nhap' && 'Đăng Nhập Hệ Thống'}
          {cheDo === 'quen_mat_khau' && 'Khôi Phục Mật Khẩu'}
        </h2>
        <p className="text-center text-sm text-stone-500 mb-6">
          Sàn Giao Dịch Đồ Thủ Công Mỹ Nghệ
        </p>

        {thongBao.noiDung && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              thongBao.loai === 'loi'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {thongBao.noiDung}
          </div>
        )}

        <form onSubmit={xuLySubmit} className="space-y-4">
          {/* Form Đăng ký */}
          {cheDo === 'dang_ky' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={soDienThoai}
                  onChange={(e) => setSoDienThoai(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>
            </>
          )}

          {/* Ô nhập Email (Luôn hiện trừ khi đang ở bước 2 của Quên MK) */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={cheDo === 'quen_mat_khau' && buocQuenMk === 2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600 disabled:bg-stone-100"
              required
            />
          </div>

          {/* Ô nhập Mật khẩu cho Đăng nhập & Đăng ký */}
          {cheDo !== 'quen_mat_khau' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Mật khẩu</label>
                {cheDo === 'dang_nhap' && (
                  <button
                    type="button"
                    onClick={() => chuyenCheDo('quen_mat_khau')}
                    className="text-xs text-amber-700 hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600"
                required
              />
            </div>
          )}

          {/* Bước 2 của Quên mật khẩu: Nhập OTP & Mật khẩu mới */}
          {cheDo === 'quen_mat_khau' && buocQuenMk === 2 && (
            <>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Mã xác nhận OTP (6 số)</label>
                  {otpHienThiDemo && (
                    <button
                      type="button"
                      onClick={() => setOtp(otpHienThiDemo)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Điền nhanh ({otpHienThiDemo})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Nhập 6 số OTP"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600 tracking-widest font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-amber-600"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={dangTai}
            className="w-full bg-amber-700 text-white py-2.5 rounded-lg font-medium hover:bg-amber-800 transition disabled:opacity-50"
          >
            {dangTai
              ? 'Đang xử lý...'
              : cheDo === 'dang_ky'
              ? 'Tạo tài khoản'
              : cheDo === 'quen_mat_khau'
              ? buocQuenMk === 1
                ? 'Gửi mã xác nhận OTP'
                : 'Xác nhận đổi mật khẩu'
              : 'Đăng nhập'}
          </button>
        </form>

        {/* Các nút chuyển đổi qua lại ở chân form */}
        <div className="mt-4 text-center space-y-2">
          {cheDo === 'dang_nhap' ? (
            <button
              type="button"
              onClick={() => chuyenCheDo('dang_ky')}
              className="text-sm text-amber-700 hover:underline font-medium"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          ) : (
            <button
              type="button"
              onClick={() => chuyenCheDo('dang_nhap')}
              className="text-sm text-amber-700 hover:underline font-medium"
            >
              ← Quay lại Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
}