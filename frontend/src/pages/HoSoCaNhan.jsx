import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  User,
  Mail,
  Phone,
  Shield,
  Store,
  ShoppingBag,
  KeyRound,
  Save,
  Calendar,
  MapPin,
} from 'lucide-react';

export default function HoSoCaNhan({ taiKhoan, setTaiKhoan }) {
  const navigate = useNavigate();
  const [hoSo, setHoSo] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);

  const [formCapNhat, setFormCapNhat] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    mat_khau_moi: '',
  });

  useEffect(() => {
    if (!taiKhoan) {
      navigate('/dang-nhap');
      return;
    }
    taiHoSo();
  }, [taiKhoan, navigate]);

  const taiHoSo = async () => {
    setDangTai(true);
    try {
      const res = await axiosClient.get(`/tai-khoan/ho-so/${taiKhoan.ma_tai_khoan}`);
      setHoSo(res.data);
      setFormCapNhat({
        ho_ten: res.data.ho_ten || '',
        so_dien_thoai: res.data.so_dien_thoai || '',
        mat_khau_moi: '',
      });
    } catch (err) {
      console.error('Lỗi tải hồ sơ:', err);
    } finally {
      setDangTai(false);
    }
  };

  const xuLyLuuHoSo = async (e) => {
    e.preventDefault();
    setDangLuu(true);
    try {
      const res = await axiosClient.put(`/tai-khoan/ho-so/${taiKhoan.ma_tai_khoan}`, formCapNhat);
      alert(res.data.message);

      // Cập nhật lại thông tin lưu trong localStorage & state toàn app
      const taiKhoanMoi = { ...taiKhoan, ...res.data.tai_khoan };
      localStorage.setItem('tai_khoan', JSON.stringify(taiKhoanMoi));
      if (setTaiKhoan) setTaiKhoan(taiKhoanMoi);

      setFormCapNhat((prev) => ({ ...prev, mat_khau_moi: '' }));
      taiHoSo();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi cập nhật hồ sơ!');
    } finally {
      setDangLuu(false);
    }
  };

  if (dangTai) {
    return <div className="p-12 text-center text-stone-500">Đang tải hồ sơ cá nhân...</div>;
  }

  if (!hoSo) {
    return <div className="p-12 text-center text-red-500">Không tìm thấy thông tin tài khoản.</div>;
  }

  const tenVaiTro =
    hoSo.vai_tro === 'quan_tri_vien'
      ? 'Quản Trị Viên Sàn (Admin)'
      : hoSo.ma_gian_hang
      ? 'Chủ Gian Hàng & Thành Viên'
      : 'Khách Hàng Thành Viên';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Thẻ đầu trang thông tin tổng quan */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-700 text-white flex items-center justify-center text-2xl font-bold shadow-sm shrink-0">
            {hoSo.ho_ten?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-800">{hoSo.ho_ten}</h1>
              <span className="text-xs bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full font-semibold">
                {tenVaiTro}
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-1.5 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <Mail size={13} /> {hoSo.email}
              </span>
              {hoSo.ngay_tao && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Tham gia: {new Date(hoSo.ngay_tao).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 bg-amber-50/70 px-5 py-3 rounded-2xl border border-amber-100 text-center shrink-0">
          <div>
            <div className="text-lg font-bold text-amber-800">{hoSo.tong_don_da_dat || 0}</div>
            <div className="text-[11px] text-stone-500">Đơn đã mua</div>
          </div>
          {hoSo.ma_gian_hang && (
            <>
              <div className="w-px bg-amber-200" />
              <div>
                <div className="text-lg font-bold text-emerald-700">{hoSo.diem_danh_gia || 5} ⭐</div>
                <div className="text-[11px] text-stone-500">Uy tín Shop</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin Gian hàng & Lối tắt */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 space-y-3">
            <h2 className="font-bold text-stone-800 text-sm flex items-center gap-2">
              <Store className="text-amber-700" size={17} /> Gian Hàng Của Bạn
            </h2>

            {hoSo.ma_gian_hang ? (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <div className="font-bold text-amber-900 text-sm">{hoSo.ten_gian_hang}</div>
                  {hoSo.dia_chi_lay_hang && (
                    <div className="text-stone-500 mt-1 flex items-start gap-1">
                      <MapPin size={13} className="shrink-0 mt-0.5" />
                      <span>{hoSo.dia_chi_lay_hang}</span>
                    </div>
                  )}
                </div>
                <Link
                  to="/kenh-nguoi-ban"
                  className="w-full block text-center bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-xl font-semibold transition"
                >
                  Vào Kênh Người Bán
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-stone-500">
                <p>Bạn chưa mở gian hàng thủ công nào trên sàn.</p>
                <Link
                  to="/kenh-nguoi-ban"
                  className="w-full block text-center bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-2 rounded-xl font-semibold transition"
                >
                  Đăng ký mở Shop ngay
                </Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200 space-y-2 text-xs">
            <Link
              to="/gio-hang"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-stone-700 font-semibold"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={15} className="text-amber-700" /> Đơn hàng & Theo dõi Shipper
              </span>
              <span>→</span>
            </Link>
            {hoSo.vai_tro === 'quan_tri_vien' && (
              <Link
                to="/admin"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 text-red-700 font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Shield size={15} /> Bảng điều khiển Admin
                </span>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Cột phải: Form chỉnh sửa thông tin cá nhân & đổi mật khẩu */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
          <h2 className="font-bold text-stone-800 text-base flex items-center gap-2 mb-4">
            <User className="text-amber-700" size={18} /> Thông Tin Hồ Sơ Chủ Tài Khoản
          </h2>

          <form onSubmit={xuLyLuuHoSo} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Email đăng nhập (Cố định)</label>
              <input
                type="email"
                disabled
                value={hoSo.email}
                className="w-full px-3.5 py-2.5 border rounded-xl bg-stone-100 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formCapNhat.ho_ten}
                  onChange={(e) => setFormCapNhat({ ...formCapNhat, ho_ten: e.target.value })}
                  className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Số điện thoại liên hệ</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="0901234567"
                    value={formCapNhat.so_dien_thoai}
                    onChange={(e) => setFormCapNhat({ ...formCapNhat, so_dien_thoai: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl focus:outline-amber-600"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <label className="block font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                <KeyRound size={15} className="text-amber-700" /> Đổi mật khẩu mới (Để trống nếu không đổi)
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới tối thiểu 6 ký tự..."
                value={formCapNhat.mat_khau_moi}
                onChange={(e) => setFormCapNhat({ ...formCapNhat, mat_khau_moi: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl focus:outline-amber-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={dangLuu}
                className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 transition shadow-sm"
              >
                <Save size={16} />
                {dangLuu ? 'Đang lưu thay đổi...' : 'Lưu Thay Đổi Hồ Sơ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}