import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import DuyetRutTienAdmin from '../components/DuyetRutTienAdmin';
import { ShieldCheck, Lock, Unlock, TrendingUp, Store, ShoppingBag, Users } from 'lucide-react';

export default function QuanTriAdmin() {
  const [danhSach, setDanhSach] = useState([]);
  const [thongKe, setThongKe] = useState(null);
  const [dangTai, setDangTai] = useState(true);

  const taiDuLieu = async () => {
    try {
      const [resTk, resThongKe] = await Promise.all([
        axiosClient.get('/tai-khoan/danh-sach'),
        axiosClient.get('/don-hang/thong-ke-san'),
      ]);
      setDanhSach(resTk.data);
      setThongKe(resThongKe.data);
    } catch (err) {
      alert('Lỗi tải dữ liệu quản trị!');
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiDuLieu();
  }, []);

  const doiTrangThai = async (id, trangThaiHienTai) => {
    try {
      await axiosClient.put(`/tai-khoan/trang-thai/${id}`, {
        trang_thai_hoat_dong: !trangThaiHienTai,
      });
      taiDuLieu();
    } catch (err) {
      alert('Không thể cập nhật trạng thái!');
    }
  };

  if (dangTai) return <div className="p-10 text-center">Đang tải dữ liệu quản trị...</div>;

  const tq = thongKe?.tong_quan || {};

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-amber-700" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Bảng Điều Khiển Quản Trị Sàn (Admin)</h1>
          <p className="text-sm text-stone-500">Theo dõi doanh thu toàn sàn, kiểm duyệt gian hàng và quản lý tài khoản</p>
        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ TỔNG QUAN TOÀN SÀN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase">
            <span>Tổng Doanh Thu Sàn</span>
            <TrendingUp className="text-amber-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">
            {Number(tq.tong_doanh_thu || 0).toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase">
            <span>Tổng Đơn Hàng</span>
            <ShoppingBag className="text-amber-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-stone-800 mt-2">{tq.tong_don_hang || 0} đơn</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase">
            <span>Gian Hàng Thủ Công</span>
            <Store className="text-amber-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-stone-800 mt-2">{tq.tong_gian_hang || 0} shop</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase">
            <span>Thành Viên Hệ Thống</span>
            <Users className="text-amber-700" size={18} />
          </div>
          <div className="text-2xl font-bold text-stone-800 mt-2">{tq.tong_tai_khoan || 0} tài khoản</div>
        </div>
      </div>

      {/* BẢNG DOANH THU THEO TỪNG GIAN HÀNG */}
      {thongKe?.theo_gian_hang && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b bg-amber-50/50 font-bold text-stone-800 text-sm">
            Doanh Thu Chi Tiết Từng Gian Hàng
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b text-stone-600 text-xs uppercase">
                <th className="py-3 px-4">Tên Gian Hàng</th>
                <th className="py-3 px-4">Đánh Giá</th>
                <th className="py-3 px-4">Số Đơn</th>
                <th className="py-3 px-4 text-right">Doanh Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {thongKe.theo_gian_hang.map((shop) => (
                <tr key={shop.ma_gian_hang} className="hover:bg-amber-50/30">
                  <td className="py-3 px-4 font-semibold text-stone-800">{shop.ten_gian_hang}</td>
                  <td className="py-3 px-4">{shop.diem_danh_gia} ⭐</td>
                  <td className="py-3 px-4">{shop.so_don} đơn</td>
                  <td className="py-3 px-4 text-right font-bold text-amber-800">
                    {Number(shop.doanh_thu).toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BẢNG DUYỆT YÊU CẦU RÚT TIỀN CỦA GIAN HÀNG */}
      <DuyetRutTienAdmin />

      {/* BẢNG QUẢN LÝ TÀI KHOẢN */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b bg-amber-50/50 font-bold text-stone-800 text-sm">
          Quản Lý Tài Khoản Người Dùng & Chủ Shop
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b text-stone-600 text-xs uppercase">
              <th className="py-3.5 px-4">ID</th>
              <th className="py-3.5 px-4">Họ Tên</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Gian Hàng</th>
              <th className="py-3.5 px-4">Vai Trò</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {danhSach.map((tk) => (
              <tr key={tk.ma_tai_khoan} className="hover:bg-amber-50/30">
                <td className="py-3.5 px-4 font-medium">#{tk.ma_tai_khoan}</td>
                <td className="py-3.5 px-4 font-semibold text-stone-800">{tk.ho_ten}</td>
                <td className="py-3.5 px-4 text-stone-600">{tk.email}</td>
                <td className="py-3.5 px-4">
                  {tk.ten_gian_hang ? (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-medium">
                      {tk.ten_gian_hang}
                    </span>
                  ) : (
                    <span className="text-stone-400 text-xs">Chưa mở shop</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {tk.vai_tro === 'quan_tri_vien' ? (
                    <span className="text-red-600 font-bold text-xs">Admin</span>
                  ) : (
                    <span className="text-stone-600 text-xs">Thành viên</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {tk.trang_thai_hoat_dong ? (
                    <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                      Đã khóa
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {tk.vai_tro !== 'quan_tri_vien' && (
                    <button
                      onClick={() => doiTrangThai(tk.ma_tai_khoan, tk.trang_thai_hoat_dong)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        tk.trang_thai_hoat_dong
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {tk.trang_thai_hoat_dong ? (
                        <>
                          <Lock size={14} /> Khóa
                        </>
                      ) : (
                        <>
                          <Unlock size={14} /> Mở khóa
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}