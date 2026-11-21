import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Wallet, Check, X } from 'lucide-react';

export default function DuyetRutTienAdmin() {
  const [dsYeuCau, setDsYeuCau] = useState([]);

  const taiDanhSach = async () => {
    try {
      const res = await axiosClient.get('/vi/tat-ca-yeu-cau');
      setDsYeuCau(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách rút tiền:', err);
    }
  };

  useEffect(() => {
    taiDanhSach();
  }, []);

  const xuLyDuyet = async (maYeuCauRut, trangThai) => {
    const ghiChu =
      window.prompt(
        trangThai === 'da_duyet'
          ? 'Nhập ghi chú chuyển khoản cho Shop (tùy chọn):'
          : 'Nhập lý do từ chối (tùy chọn):'
      ) || '';

    try {
      const res = await axiosClient.put(`/vi/duyet/${maYeuCauRut}`, {
        trang_thai: trangThai,
        ghi_chu_admin: ghiChu,
      });
      alert(res.data.message);
      taiDanhSach();
    } catch (err) {
      alert('Lỗi xử lý duyệt: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-4 mt-6">
      <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
        <Wallet className="text-amber-700" /> Quản Lý Yêu Cầu Rút Tiền Của Gian Hàng ({dsYeuCau.length})
      </h2>

      {dsYeuCau.length === 0 ? (
        <p className="text-sm text-stone-400">Chưa có yêu cầu rút tiền nào từ các gian hàng.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-stone-50 text-stone-600">
                <th className="p-3">Mã YC</th>
                <th className="p-3">Gian hàng</th>
                <th className="p-3">Số tiền rút</th>
                <th className="p-3">Phí sàn (5%)</th>
                <th className="p-3">Thực chuyển</th>
                <th className="p-3">Tài khoản nhận</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dsYeuCau.map((yc) => {
                const thucChuyen = Number(yc.so_tien_rut) - Number(yc.phi_san_khau_tru || 0);
                return (
                  <tr key={yc.ma_yeu_cau_rut}>
                    <td className="p-3 font-semibold">#YC{yc.ma_yeu_cau_rut}</td>
                    <td className="p-3 font-bold text-stone-800">{yc.ten_gian_hang}</td>
                    <td className="p-3">{Number(yc.so_tien_rut).toLocaleString('vi-VN')}đ</td>
                    <td className="p-3 text-stone-500">
                      -{Number(yc.phi_san_khau_tru || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3 font-bold text-amber-800 text-sm">
                      {thucChuyen.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3">
                      {yc.ten_ngan_hang} - <b>{yc.so_tai_khoan}</b>
                      <div className="text-[11px] text-stone-500">{yc.ten_chu_tai_khoan}</div>
                    </td>
                    <td className="p-3">
                      {yc.trang_thai === 'da_duyet' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
                          Đã chuyển khoản
                        </span>
                      ) : yc.trang_thai === 'tu_choi' ? (
                        <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-semibold">
                          Đã từ chối
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-semibold">
                          Chờ duyệt
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {yc.trang_thai === 'cho_duyet' && (
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => xuLyDuyet(yc.ma_yeu_cau_rut, 'da_duyet')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1"
                          >
                            <Check size={13} /> Duyệt chi
                          </button>
                          <button
                            onClick={() => xuLyDuyet(yc.ma_yeu_cau_rut, 'tu_choi')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1"
                          >
                            <X size={13} /> Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}