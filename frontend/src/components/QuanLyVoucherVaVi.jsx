import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Ticket, Wallet, PlusCircle, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function QuanLyVoucherVaVi({ gianHang }) {
  const [dsVoucher, setDsVoucher] = useState([]);
  const [thongTinVi, setThongTinVi] = useState({
    tong_doanh_thu: 0,
    so_du_kha_dung: 0,
    so_du_cho_duyet: 0,
    tong_da_rut: 0,
    lich_su_rut_tien: [],
  });

  const [formVoucher, setFormVoucher] = useState({
    ma_code: '',
    ten_chuong_trinh: '',
    loai_giam: 'so_tien_co_dinh',
    gia_tri_giam: '',
    giam_toi_da: '',
    don_toi_thieu: '100000',
    so_luong_phat_hanh: '50',
    ngay_ket_thuc: '2026-12-31',
  });

  const [soTienRut, setSoTienRut] = useState('');
  const [tenNganHang, setTenNganHang] = useState('');
  const [soTaiKhoan, setSoTaiKhoan] = useState('');
  const [tenChuTaiKhoan, setTenChuTaiKhoan] = useState('');

  const taiDuLieu = async () => {
    if (!gianHang?.ma_gian_hang) return;
    try {
      const [resVoucher, resVi] = await Promise.all([
        axiosClient.get(`/voucher/gian-hang/${gianHang.ma_gian_hang}`),
        axiosClient.get(`/vi/shop/${gianHang.ma_gian_hang}`),
      ]);
      setDsVoucher(resVoucher.data);
      setThongTinVi(resVi.data);

      const vi = resVi.data.vi || {};
      setTenNganHang(vi.ten_ngan_hang || gianHang.ngan_hang_ten || '');
      setSoTaiKhoan(vi.so_tai_khoan || gianHang.ngan_hang_so_tk || '');
      setTenChuTaiKhoan(vi.ten_chu_tai_khoan || gianHang.ngan_hang_chu_tk || '');
    } catch (err) {
      console.error('Lỗi tải dữ liệu Voucher & Ví:', err);
    }
  };

  useEffect(() => {
    taiDuLieu();
  }, [gianHang]);

  const xuLyTaoVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/voucher', {
        ...formVoucher,
        ma_gian_hang: gianHang.ma_gian_hang,
      });
      alert(res.data.message);
      setFormVoucher({
        ma_code: '',
        ten_chuong_trinh: '',
        loai_giam: 'so_tien_co_dinh',
        gia_tri_giam: '',
        giam_toi_da: '',
        don_toi_thieu: '100000',
        so_luong_phat_hanh: '50',
        ngay_ket_thuc: '2026-12-31',
      });
      taiDuLieu();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo mã giảm giá!');
    }
  };

  const xuLyGuiYeuCauRut = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/vi/rut-tien', {
        ma_gian_hang: gianHang.ma_gian_hang,
        so_tien_rut: Number(soTienRut),
        ten_ngan_hang: tenNganHang,
        so_tai_khoan: soTaiKhoan,
        ten_chu_tai_khoan: tenChuTaiKhoan,
      });
      alert(res.data.message);
      setSoTienRut('');
      taiDuLieu();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi gửi yêu cầu rút tiền!');
    }
  };

  return (
    <div className="space-y-8 mt-6">
      {/* PHẦN 1: VÍ DOANH THU GIAN HÀNG & RÚT TIỀN */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 space-y-5">
        <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
          <Wallet className="text-amber-700" /> Ví Gian Hàng & Rút Tiền Doanh Thu
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
            <div className="text-xs text-stone-500">Số dư khả dụng có thể rút</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">
              {Number(thongTinVi.so_du_kha_dung).toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl">
            <div className="text-xs text-stone-500">Số dư đang chờ duyệt rút</div>
            <div className="text-2xl font-bold text-stone-700 mt-1">
              {Number(thongTinVi.so_du_cho_duyet).toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
            <div className="text-xs text-stone-500">Tổng tiền đã rút thành công</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {Number(thongTinVi.tong_da_rut).toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>

        {/* Form yêu cầu rút tiền */}
        <form onSubmit={xuLyGuiYeuCauRut} className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-stone-50 p-4 rounded-xl border">
          <input
            type="number"
            required
            min="50000"
            placeholder="Số tiền rút (>= 50K)"
            value={soTienRut}
            onChange={(e) => setSoTienRut(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl focus:outline-amber-600"
          />
          <input
            type="text"
            required
            placeholder="Ngân hàng (VD: Vietcombank)"
            value={tenNganHang}
            onChange={(e) => setTenNganHang(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl focus:outline-amber-600"
          />
          <input
            type="text"
            required
            placeholder="Số tài khoản"
            value={soTaiKhoan}
            onChange={(e) => setSoTaiKhoan(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl focus:outline-amber-600"
          />
          <input
            type="text"
            required
            placeholder="Tên chủ tài khoản"
            value={tenChuTaiKhoan}
            onChange={(e) => setTenChuTaiKhoan(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl focus:outline-amber-600"
          />
          <button
            type="submit"
            className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Send size={15} /> Gửi lệnh rút
          </button>
        </form>

        {/* Lịch sử rút tiền của shop */}
        {thongTinVi.lich_su_rut_tien?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-stone-50 text-stone-600">
                  <th className="p-3">Mã yêu cầu</th>
                  <th className="p-3">Số tiền rút</th>
                  <th className="p-3">Phí sàn (5%)</th>
                  <th className="p-3">Thực nhận</th>
                  <th className="p-3">Ngày yêu cầu</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Ghi chú Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {thongTinVi.lich_su_rut_tien.map((ls) => {
                  const thucNhan = Number(ls.so_tien_rut) - Number(ls.phi_san_khau_tru || 0);
                  return (
                    <tr key={ls.ma_yeu_cau_rut}>
                      <td className="p-3 font-semibold">#YC{ls.ma_yeu_cau_rut}</td>
                      <td className="p-3 font-bold text-stone-800">
                        {Number(ls.so_tien_rut).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 text-stone-500">
                        -{Number(ls.phi_san_khau_tru || 0).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="p-3 font-bold text-amber-800">{thucNhan.toLocaleString('vi-VN')}đ</td>
                      <td className="p-3 text-stone-500">
                        {new Date(ls.ngay_yeu_cau).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3">
                        {ls.trang_thai === 'da_duyet' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
                            <CheckCircle2 size={12} /> Đã chuyển khoản
                          </span>
                        ) : ls.trang_thai === 'tu_choi' ? (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-semibold">
                            <XCircle size={12} /> Từ chối
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full font-semibold">
                            <Clock size={12} /> Chờ duyệt
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-stone-500">{ls.ghi_chu_admin || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PHẦN 2: PHÁT HÀNH & QUẢN LÝ MÃ GIẢM GIÁ CỦA SHOP */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 space-y-5">
        <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
          <Ticket className="text-amber-700" /> Phát Hành Mã Giảm Giá Riêng Cho Tiệm
        </h3>

        <form onSubmit={xuLyTaoVoucher} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/40 p-4 rounded-xl border border-amber-100 text-sm">
          <div>
            <label className="block text-xs font-semibold mb-1">Mã Code (Viết liền không dấu) *</label>
            <input
              type="text"
              required
              placeholder="VD: QUATANG25"
              value={formVoucher.ma_code}
              onChange={(e) => setFormVoucher({ ...formVoucher, ma_code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-white border rounded-xl uppercase font-bold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Tên chương trình ưu đãi *</label>
            <input
              type="text"
              required
              placeholder="VD: Giảm 25K tri ân khách đặt đồ thủ công"
              value={formVoucher.ten_chuong_trinh}
              onChange={(e) => setFormVoucher({ ...formVoucher, ten_chuong_trinh: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Loại giảm giá</label>
            <select
              value={formVoucher.loai_giam}
              onChange={(e) => setFormVoucher({ ...formVoucher, loai_giam: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            >
              <option value="so_tien_co_dinh">Giảm tiền trực tiếp (VNĐ)</option>
              <option value="phan_tram">Giảm theo phần trăm (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              {formVoucher.loai_giam === 'phan_tram' ? 'Mức giảm (%) *' : 'Số tiền giảm (đ) *'}
            </label>
            <input
              type="number"
              required
              placeholder={formVoucher.loai_giam === 'phan_tram' ? '15' : '25000'}
              value={formVoucher.gia_tri_giam}
              onChange={(e) => setFormVoucher({ ...formVoucher, gia_tri_giam: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Đơn hàng tối thiểu (đ)</label>
            <input
              type="number"
              value={formVoucher.don_toi_thieu}
              onChange={(e) => setFormVoucher({ ...formVoucher, don_toi_thieu: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Số lượng phát hành *</label>
            <input
              type="number"
              required
              value={formVoucher.so_luong_phat_hanh}
              onChange={(e) => setFormVoucher({ ...formVoucher, so_luong_phat_hanh: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Hạn sử dụng đến ngày</label>
            <input
              type="date"
              value={formVoucher.ngay_ket_thuc}
              onChange={(e) => setFormVoucher({ ...formVoucher, ngay_ket_thuc: e.target.value })}
              className="w-full px-3 py-2 bg-white border rounded-xl"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <PlusCircle size={16} /> Phát hành Voucher
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dsVoucher.map((v) => (
            <div key={v.ma_voucher} className="p-3.5 border border-dashed border-amber-300 rounded-xl bg-amber-50/30 flex justify-between items-center">
              <div>
                <span className="font-bold text-amber-900 text-sm">{v.ma_code}</span>
                <p className="text-xs text-stone-600 mt-0.5">{v.ten_chuong_trinh}</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Đơn tối thiểu: {Number(v.don_toi_thieu).toLocaleString('vi-VN')}đ • Đã dùng:{' '}
                  <b>
                    {v.da_su_dung}/{v.so_luong_phat_hanh}
                  </b>
                </p>
              </div>
              <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-lg">
                {v.loai_giam === 'phan_tram'
                  ? `-${Number(v.gia_tri_giam)}%`
                  : `-${Number(v.gia_tri_giam).toLocaleString('vi-VN')}đ`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}