import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import QuanLyVoucherVaVi from '../components/QuanLyVoucherVaVi';
import { Store, PlusCircle, Package, ClipboardList, Trash2, Upload, Sparkles, CheckCircle, Truck, Hammer, XCircle } from 'lucide-react';

const ANH_MAU_DU_PHONG = {
  1: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400&q=80',
  2: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
  3: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=80',
};

const NHAN_TRANG_THAI = {
  cho_xac_nhan: { text: 'Chờ xác nhận', mau: 'bg-amber-100 text-amber-800' },
  dang_lam_thu_cong: { text: 'Đang làm thủ công', mau: 'bg-blue-100 text-blue-800' },
  dang_giao: { text: 'Đang giao hàng', mau: 'bg-purple-100 text-purple-800' },
  hoan_thanh: { text: 'Đã hoàn thành', mau: 'bg-green-100 text-green-800' },
  da_huy: { text: 'Đã hủy', mau: 'bg-red-100 text-red-700' },
};

export default function KenhNguoiBan({ taiKhoan }) {
  const [dangTai, setDangTai] = useState(true);
  const [coGianHang, setCoGianHang] = useState(false);
  const [gianHang, setGianHang] = useState(null);
  const [sanPhams, setSanPhams] = useState([]);
  const [donHangs, setDonHangs] = useState([]);
  const [danhMucs, setDanhMucs] = useState([]);
  const [tabHienTai, setTabHienTai] = useState('san_pham');

  const [formShop, setFormShop] = useState({
    ten_gian_hang: '',
    mo_ta: '',
    dia_chi_lay_hang: '',
    ngan_hang_ten: 'Vietcombank',
    ngan_hang_so_tk: '',
    ngan_hang_chu_tk: taiKhoan?.ho_ten || '',
  });

  const [formSp, setFormSp] = useState({
    ten_san_pham: '',
    ma_danh_muc: '1',
    gia_goc: '',
    so_luong_ton: '10',
    chat_lieu: '',
    so_ngay_hoan_thien: '2',
    cho_phep_dat_rieng: true,
    mo_ta: '',
  });
  const [fileAnh, setFileAnh] = useState(null);
  const [anhXemTruoc, setAnhXemTruoc] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  const taiDuLieuShop = async () => {
    setDangTai(true);
    try {
      const [resShop, resDm] = await Promise.all([
        axiosClient.get(`/gian-hang/cua-toi/${taiKhoan.ma_tai_khoan}`),
        axiosClient.get('/san-pham/danh-muc'),
      ]);
      setDanhMucs(resDm.data);
      if (resShop.data.co_gian_hang) {
        setCoGianHang(true);
        setGianHang(resShop.data.gian_hang);
        setSanPhams(resShop.data.san_phams);
        setDonHangs(resShop.data.don_hangs);
      } else {
        setCoGianHang(false);
      }
    } catch (err) {
      console.error('Lỗi tải gian hàng:', err);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    if (taiKhoan) taiDuLieuShop();
  }, [taiKhoan]);

  const xuLyMoShop = async (e) => {
    e.preventDefault();
    setDangLuu(true);
    try {
      const res = await axiosClient.post('/gian-hang/mo-shop', {
        ma_tai_khoan: taiKhoan.ma_tai_khoan,
        ...formShop,
      });
      alert(res.data.message);
      taiDuLieuShop();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi mở gian hàng');
    } finally {
      setDangLuu(false);
    }
  };

  const chonHinhAnh = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileAnh(file);
      setAnhXemTruoc(URL.createObjectURL(file));
    }
  };

  const xuLyDangSanPham = async (e) => {
    e.preventDefault();
    setDangLuu(true);
    try {
      const formData = new FormData();
      formData.append('ma_gian_hang', gianHang.ma_gian_hang);
      Object.keys(formSp).forEach((key) => formData.append(key, formSp[key]));
      if (fileAnh) {
        formData.append('hinh_anh', fileAnh);
      }

      await axiosClient.post('/gian-hang/san-pham', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('🎉 Đăng tác phẩm thủ công lên sàn thành công!');
      setFormSp({
        ten_san_pham: '',
        ma_danh_muc: '1',
        gia_goc: '',
        so_luong_ton: '10',
        chat_lieu: '',
        so_ngay_hoan_thien: '2',
        cho_phep_dat_rieng: true,
        mo_ta: '',
      });
      setFileAnh(null);
      setAnhXemTruoc('');
      setTabHienTai('san_pham');
      taiDuLieuShop();
    } catch (err) {
      alert('Lỗi đăng sản phẩm: ' + (err.response?.data?.message || err.message));
    } finally {
      setDangLuu(false);
    }
  };

  const xoaSanPham = async (id) => {
    if (!window.confirm('Bạn muốn gỡ sản phẩm này khỏi gian hàng?')) return;
    try {
      await axiosClient.delete(`/gian-hang/san-pham/${id}`);
      setSanPhams((prev) => prev.filter((sp) => sp.ma_san_pham !== id));
    } catch (err) {
      alert('Lỗi xóa sản phẩm');
    }
  };

  const capNhatAnhSanPham = async (id, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('hinh_anh', file);
      const res = await axiosClient.post(`/gian-hang/san-pham/${id}/anh`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSanPhams((prev) =>
        prev.map((sp) => (sp.ma_san_pham === id ? { ...sp, anh_dai_dien: res.data.anh_dai_dien } : sp))
      );
    } catch (err) {
      alert('Lỗi tải ảnh lên: ' + (err.response?.data?.message || err.message));
    }
  };

  const doiTrangThaiDon = async (maDon, trangThaiMoi) => {
    if (trangThaiMoi === 'da_huy') {
      const xacNhan = window.confirm(`Bạn có chắc chắn muốn hủy Đơn #${maDon} này không?`);
      if (!xacNhan) return;
    }

    try {
      await axiosClient.put(`/gian-hang/don-hang/${maDon}/trang-thai`, {
        trang_thai_don: trangThaiMoi,
      });
      setDonHangs((prev) =>
        prev.map((dh) => (dh.ma_don_hang === maDon ? { ...dh, trang_thai: trangThaiMoi } : dh))
      );
    } catch (err) {
      alert('Lỗi cập nhật đơn hàng: ' + (err.response?.data?.message || err.message));
    }
  };

  if (dangTai) {
    return <div className="p-12 text-center text-stone-500">Đang tải Kênh Người Bán...</div>;
  }

  if (!coGianHang) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
          <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mb-4">
            <Store size={30} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Mở Gian Hàng Thủ Công Của Riêng Bạn</h1>
          <p className="text-sm text-stone-500 mt-1 mb-6">
            Bắt đầu trưng bày sản phẩm làm tay và nhận đơn đặt hàng riêng từ khách hàng trên toàn quốc.
          </p>

          <form onSubmit={xuLyMoShop} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên gian hàng (Shop) *</label>
              <input
                type="text"
                required
                placeholder="VD: Xưởng Da Thủ Công Sài Gòn"
                value={formShop.ten_gian_hang}
                onChange={(e) => setFormShop({ ...formShop, ten_gian_hang: e.target.value })}
                className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Giới thiệu ngắn về tiệm</label>
              <textarea
                rows={3}
                placeholder="Chia sẻ câu chuyện làm đồ thủ công của bạn..."
                value={formShop.mo_ta}
                onChange={(e) => setFormShop({ ...formShop, mo_ta: e.target.value })}
                className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ lấy hàng / Xưởng *</label>
              <input
                type="text"
                required
                placeholder="Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                value={formShop.dia_chi_lay_hang}
                onChange={(e) => setFormShop({ ...formShop, dia_chi_lay_hang: e.target.value })}
                className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Ngân hàng nhận tiền đối soát</label>
                <input
                  type="text"
                  value={formShop.ngan_hang_ten}
                  onChange={(e) => setFormShop({ ...formShop, ngan_hang_ten: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  placeholder="0123456789"
                  value={formShop.ngan_hang_so_tk}
                  onChange={(e) => setFormShop({ ...formShop, ngan_hang_so_tk: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={dangLuu}
              className="w-full bg-amber-700 text-white py-3 rounded-xl font-semibold hover:bg-amber-800 transition mt-2"
            >
              {dangLuu ? 'Đang khởi tạo gian hàng...' : 'Kích hoạt Gian Hàng Ngay'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header thông tin Shop */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-700 text-white flex items-center justify-center">
            <Store size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-stone-800">{gianHang.ten_gian_hang}</h1>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Đang hoạt động
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">{gianHang.mo_ta || 'Gian hàng đồ thủ công mỹ nghệ'}</p>
          </div>
        </div>

        <div className="flex gap-6 text-center bg-amber-50/70 px-6 py-3 rounded-xl border border-amber-100">
          <div>
            <div className="text-xl font-bold text-amber-800">{sanPhams.length}</div>
            <div className="text-xs text-stone-500">Sản phẩm</div>
          </div>
          <div className="border-l border-amber-200 pl-6">
            <div className="text-xl font-bold text-amber-800">{donHangs.length}</div>
            <div className="text-xs text-stone-500">Đơn hàng</div>
          </div>
          <div className="border-l border-amber-200 pl-6">
            <div className="text-xl font-bold text-amber-800">{gianHang.diem_danh_gia} ⭐</div>
            <div className="text-xs text-stone-500">Đánh giá</div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển Tab chức năng */}
      <div className="flex gap-2 mb-6 border-b border-stone-200 pb-3">
        <button
          onClick={() => setTabHienTai('san_pham')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tabHienTai === 'san_pham' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 hover:bg-amber-50'
          }`}
        >
          <Package size={18} /> Sản phẩm của Shop ({sanPhams.length})
        </button>
        <button
          onClick={() => setTabHienTai('dang_moi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tabHienTai === 'dang_moi' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 hover:bg-amber-50'
          }`}
        >
          <PlusCircle size={18} /> Đăng sản phẩm mới
        </button>
        <button
          onClick={() => setTabHienTai('don_hang')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            tabHienTai === 'don_hang' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 hover:bg-amber-50'
          }`}
        >
          <ClipboardList size={18} /> Quản lý Đơn hàng ({donHangs.length})
        </button>
      </div>

      {/* TAB 1: DANH SÁCH SẢN PHẨM CỦA SHOP */}
      {tabHienTai === 'san_pham' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {sanPhams.length === 0 ? (
            <div className="p-10 text-center text-stone-500">
              Gian hàng chưa có sản phẩm nào. Hãy bấm <b>"Đăng sản phẩm mới"</b> để bắt đầu bán nhé!
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b text-xs uppercase text-stone-600">
                  <th className="py-3.5 px-4">Sản phẩm</th>
                  <th className="py-3.5 px-4">Chất liệu & Thời gian làm</th>
                  <th className="py-3.5 px-4">Giá bán</th>
                  <th className="py-3.5 px-4">Tồn kho</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {sanPhams.map((sp) => (
                  <tr key={sp.ma_san_pham} className="hover:bg-amber-50/30">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={
                          sp.anh_dai_dien
                            ? `http://localhost:5000${sp.anh_dai_dien}`
                            : ANH_MAU_DU_PHONG[sp.ma_san_pham] || ANH_MAU_DU_PHONG[1]
                        }
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = ANH_MAU_DU_PHONG[sp.ma_san_pham] || ANH_MAU_DU_PHONG[1];
                        }}
                        alt={sp.ten_san_pham}
                        className="w-12 h-12 rounded-lg object-cover bg-stone-100"
                      />
                      <div>
                        <div className="font-semibold text-stone-800">{sp.ten_san_pham}</div>
                        <div className="text-xs text-stone-500">{sp.ten_danh_muc}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      <div>Chất liệu: <b>{sp.chat_lieu}</b></div>
                      <div>Hoàn thiện: {sp.so_ngay_hoan_thien} ngày</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-800">
                      {Number(sp.gia_goc).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-3.5 px-4">{sp.so_luong_ton}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <label
                          className="cursor-pointer bg-amber-50 text-amber-800 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                          title="Tải ảnh mới từ máy"
                        >
                          <Upload size={14} /> Đổi ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => capNhatAnhSanPham(sp.ma_san_pham, e.target.files[0])}
                          />
                        </label>
                        <button
                          onClick={() => xoaSanPham(sp.ma_san_pham)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                          title="Gỡ sản phẩm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: FORM ĐĂNG SẢN PHẨM MỚI */}
      {tabHienTai === 'dang_moi' && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 md:p-8 max-w-3xl">
          <h2 className="text-xl font-bold text-stone-800 mb-5">Đăng Tác Phẩm Thủ Công Mới</h2>
          <form onSubmit={xuLyDangSanPham} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Ví da bò khâu tay khắc tên"
                  value={formSp.ten_san_pham}
                  onChange={(e) => setFormSp({ ...formSp, ten_san_pham: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Danh mục *</label>
                <select
                  value={formSp.ma_danh_muc}
                  onChange={(e) => setFormSp({ ...formSp, ma_danh_muc: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600 bg-white"
                >
                  {danhMucs.map((dm) => (
                    <option key={dm.ma_danh_muc} value={dm.ma_danh_muc}>
                      {dm.ten_danh_muc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  placeholder="250000"
                  value={formSp.gia_goc}
                  onChange={(e) => setFormSp({ ...formSp, gia_goc: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chất liệu chính *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Da bò sáp, Len Cotton..."
                  value={formSp.chat_lieu}
                  onChange={(e) => setFormSp({ ...formSp, chat_lieu: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thời gian hoàn thiện (ngày)</label>
                <input
                  type="number"
                  min={1}
                  value={formSp.so_ngay_hoan_thien}
                  onChange={(e) => setFormSp({ ...formSp, so_ngay_hoan_thien: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hình ảnh sản phẩm thực tế</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 text-sm font-medium">
                  <Upload size={18} /> Chọn ảnh từ máy tính
                  <input type="file" accept="image/*" onChange={chonHinhAnh} className="hidden" />
                </label>
                {anhXemTruoc && (
                  <img src={anhXemTruoc} alt="Xem trước" className="w-16 h-16 rounded-lg object-cover border" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50/70 p-3 rounded-xl border border-amber-100">
              <input
                type="checkbox"
                id="datRieng"
                checked={formSp.cho_phep_dat_rieng}
                onChange={(e) => setFormSp({ ...formSp, cho_phep_dat_rieng: e.target.checked })}
                className="w-4 h-4 accent-amber-700"
              />
              <label htmlFor="datRieng" className="text-sm font-medium text-amber-900 flex items-center gap-1">
                <Sparkles size={15} /> Nhận làm theo yêu cầu riêng (khắc tên, đổi màu, thay đổi kích thước)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết tác phẩm</label>
              <textarea
                rows={3}
                placeholder="Mô tả kích thước, quy trình làm tay, hướng dẫn bảo quản..."
                value={formSp.mo_ta}
                onChange={(e) => setFormSp({ ...formSp, mo_ta: e.target.value })}
                className="w-full px-3.5 py-2 border rounded-lg focus:outline-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={dangLuu}
              className="bg-amber-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-800 transition"
            >
              {dangLuu ? 'Đang đăng lên sàn...' : 'Đăng bán ngay'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ĐƠN HÀNG CỦA SHOP */}
      {tabHienTai === 'don_hang' && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          {donHangs.length === 0 ? (
            <p className="text-center text-stone-500 py-6">Chưa có đơn hàng nào đặt tại gian hàng của bạn.</p>
          ) : (
            <div className="space-y-3">
              {donHangs.map((dh) => {
                const infoTt = NHAN_TRANG_THAI[dh.trang_thai] || { text: dh.trang_thai, mau: 'bg-stone-100 text-stone-700' };
                return (
                  <div key={dh.ma_don_hang} className="p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-stone-800">
                        Đơn #{dh.ma_don_hang} {dh.ma_tra_cuu_shop ? `(${dh.ma_tra_cuu_shop})` : ''} • Khách: {dh.ten_khach_hang} ({dh.sdt_khach})
                      </div>
                      <div className="text-xs text-stone-500 mt-1">Giao tới: {dh.dia_chi_giao_hang}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="text-right mr-2">
                        <div className="font-bold text-amber-800">{Number(dh.tong_thanh_toan).toLocaleString('vi-VN')}đ</div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${infoTt.mau}`}>
                          {infoTt.text}
                        </span>
                      </div>

                      {dh.trang_thai === 'cho_xac_nhan' && (
                        <button
                          onClick={() => doiTrangThaiDon(dh.ma_don_hang, 'dang_lam_thu_cong')}
                          className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                        >
                          <Hammer size={14} /> Xác nhận & Bắt đầu làm
                        </button>
                      )}

                      {dh.trang_thai === 'dang_lam_thu_cong' && (
                        <button
                          onClick={() => doiTrangThaiDon(dh.ma_don_hang, 'dang_giao')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                        >
                          <Truck size={14} /> Bàn giao vận chuyển
                        </button>
                      )}

                      {dh.trang_thai === 'dang_giao' && (
                        <button
                          onClick={() => doiTrangThaiDon(dh.ma_don_hang, 'hoan_thanh')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                        >
                          <CheckCircle size={14} /> Hoàn tất đơn
                        </button>
                      )}

                      {(dh.trang_thai === 'cho_xac_nhan' || dh.trang_thai === 'dang_lam_thu_cong') && (
                        <button
                          onClick={() => doiTrangThaiDon(dh.ma_don_hang, 'da_huy')}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 transition"
                        >
                          <XCircle size={14} /> Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VÍ DOANH THU, RÚT TIỀN & PHÁT HÀNH MÃ GIẢM GIÁ */}
      {gianHang && <QuanLyVoucherVaVi gianHang={gianHang} />}
    </div>
  );
}