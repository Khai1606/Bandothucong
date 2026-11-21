import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, User, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar({ taiKhoan, setTaiKhoan }) {
  const navigate = useNavigate();
  const [soLuongGio, setSoLuongGio] = useState(0);
  const [rungGioHang, setRungGioHang] = useState(false);

  const capNhatSoLuongGio = () => {
    const gio = JSON.parse(localStorage.getItem('gio_hang')) || [];
    const tong = gio.reduce((sum, item) => sum + Number(item.so_luong || 1), 0);
    setSoLuongGio(tong);
  };

  useEffect(() => {
    capNhatSoLuongGio();
    window.addEventListener('storage', capNhatSoLuongGio);

    const xuLyRungGio = () => {
      setRungGioHang(true);
      setTimeout(() => setRungGioHang(false), 400);
    };
    window.addEventListener('gio-hang-nay', xuLyRungGio);

    return () => {
      window.removeEventListener('storage', capNhatSoLuongGio);
      window.removeEventListener('gio-hang-nay', xuLyRungGio);
    };
  }, []);

  const xuLyDangXuat = () => {
    localStorage.removeItem('tai_khoan');
    setTaiKhoan(null);
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-amber-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo thương hiệu */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🧶
          </div>
          <span className="font-bold text-xl text-amber-900 tracking-tight">Tiệm Thủ Công</span>
        </Link>

        {/* Các nút chức năng bên phải */}
        <div className="flex items-center gap-3 sm:gap-4">
          {taiKhoan?.vai_tro === 'quan_tri_vien' && (
            <Link
              to="/admin"
              className="text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <ShieldCheck size={16} /> Quản trị Admin
            </Link>
          )}

          {taiKhoan && (
            <Link
              to="/kenh-nguoi-ban"
              className="text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
            >
              <Store size={16} className="text-amber-700" />
              <span className="hidden sm:inline">Gian hàng của tôi</span>
            </Link>
          )}

          {/* Giỏ hàng */}
          <Link
            id="icon-gio-hang-navbar"
            to="/gio-hang"
            className={`relative p-2 text-stone-700 hover:bg-amber-50 rounded-xl transition-transform duration-300 ${
              rungGioHang ? 'scale-125 bg-amber-100 text-amber-800' : ''
            }`}
            title="Giỏ hàng"
          >
            <ShoppingBag size={22} />
            {soLuongGio > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-700 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {soLuongGio}
              </span>
            )}
          </Link>

          {/* Tài khoản / Đăng nhập */}
          {taiKhoan ? (
            <div className="flex items-center gap-1.5 border-l border-stone-200 pl-3">
              <Link
                to="/ho-so"
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-amber-800 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition"
                title="Xem hồ sơ tài khoản"
              >
                <User size={16} className="text-amber-700 shrink-0" />
                <span className="max-w-[180px] truncate">{taiKhoan.ho_ten}</span>
              </Link>
              <button
                onClick={xuLyDangXuat}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              to="/dang-nhap"
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}