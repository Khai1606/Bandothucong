import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { BACKEND_URL } from '../config';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  QrCode,
  CheckCircle2,
  Store,
  ShieldCheck,
  Ticket,
  X,
} from 'lucide-react';

const LINK_ANH_QR = `${BACKEND_URL}/uploads/qr-thanh-toan.png`;

export default function ThanhToan({ taiKhoan }) {
  const navigate = useNavigate();
  const [gioHang, setGioHang] = useState([]);
  const [dangDat, setDangDat] = useState(false);

  // State Mã giảm giá (Voucher)
  const [dsVoucher, setDsVoucher] = useState([]);
  const [maNhap, setMaNhap] = useState('');
  const [voucherDaChon, setVoucherDaChon] = useState(null);
  const [soTienGiam, setSoTienGiam] = useState(0);
  const [thongBaoVoucher, setThongBaoVoucher] = useState({ loai: '', noi_dung: '' });

  const [thongTinNhan, setThongTinNhan] = useState({
    ten_nguoi_nhan: taiKhoan?.ho_ten || '',
    sdt_nguoi_nhan: taiKhoan?.so_dien_thoai || '',
    dia_chi_giao_hang: '',
    phuong_thuc_thanh_toan: 'tien_mat_cod',
  });

  useEffect(() => {
    if (!taiKhoan) {
      navigate('/dang-nhap');
      return;
    }
    const duLieuGio = JSON.parse(localStorage.getItem('gio_hang')) || [];
    if (duLieuGio.length === 0) {
      navigate('/gio-hang');
      return;
    }
    setGioHang(duLieuGio);

    // Tải các mã giảm giá đang khả dụng từ SQL Server
    axiosClient
      .get('/voucher/kha-dung')
      .then((res) => setDsVoucher(res.data))
      .catch((err) => console.error('Lỗi tải voucher:', err));
  }, [taiKhoan, navigate]);

  const nhomTheoShop = gioHang.reduce((acc, item) => {
    const tenShop = item.ten_gian_hang || 'Gian hàng thủ công';
    if (!acc[tenShop]) acc[tenShop] = [];
    acc[tenShop].push(item);
    return acc;
  }, {});

  const tongTienHang = gioHang.reduce(
    (sum, item) => sum + Number(item.gia_ban) * Number(item.so_luong || 1),
    0
  );
  const tongThanhToan = Math.max(0, tongTienHang - soTienGiam);

  const apDungVoucher = async (codeCanAp) => {
    const code = (codeCanAp || maNhap).trim();
    if (!code) return;

    try {
      const res = await axiosClient.post('/voucher/kiem-tra', {
        ma_code: code,
        tong_tien: tongTienHang,
        danh_sach_san_pham: gioHang,
      });

      setVoucherDaChon(res.data.voucher);
      setSoTienGiam(res.data.so_tien_giam);
      setMaNhap(res.data.voucher.ma_code);
      setThongBaoVoucher({
        loai: 'success',
        noi_dung: `${res.data.message} (-${Number(res.data.so_tien_giam).toLocaleString('vi-VN')}đ)`,
      });
    } catch (err) {
      setVoucherDaChon(null);
      setSoTienGiam(0);
      setThongBaoVoucher({
        loai: 'error',
        noi_dung: err.response?.data?.message || 'Không thể áp dụng mã giảm giá này!',
      });
    }
  };

  const huyVoucher = () => {
    setVoucherDaChon(null);
    setSoTienGiam(0);
    setMaNhap('');
    setThongBaoVoucher({ loai: '', noi_dung: '' });
  };

  const xuLyXacNhanThanhToan = async (e) => {
    e.preventDefault();
    if (gioHang.length === 0) return;

    setDangDat(true);
    try {
      const res = await axiosClient.post('/don-hang/dat-hang', {
        ma_tai_khoan: taiKhoan.ma_tai_khoan,
        ...thongTinNhan,
        ma_voucher: voucherDaChon ? voucherDaChon.ma_voucher : null,
        so_tien_giam: soTienGiam,
        tong_thanh_toan: tongThanhToan,
        danh_sach_san_pham: gioHang,
      });

      alert('🎉 ' + res.data.message);
      localStorage.removeItem('gio_hang');
      window.dispatchEvent(new Event('storage'));
      navigate('/gio-hang');
    } catch (err) {
      alert('Lỗi đặt hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setDangDat(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate('/gio-hang')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-amber-800 font-medium"
      >
        <ArrowLeft size={16} /> Quay lại Giỏ hàng
      </button>

      <div className="flex items-center gap-2.5">
        <ShieldCheck className="text-amber-700" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Thanh Toán Đơn Hàng</h1>
          <p className="text-xs text-stone-500">Kiểm tra địa chỉ nhận hàng, áp dụng mã ưu đãi và chọn phương thức thanh toán</p>
        </div>
      </div>

      <form onSubmit={xuLyXacNhanThanhToan} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Địa chỉ nhận hàng */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 space-y-4">
            <h2 className="font-bold text-stone-800 flex items-center gap-2 text-base">
              <MapPin className="text-amber-700" size={18} /> 1. Địa Chỉ Nhận Hàng
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block font-medium mb-1">Họ tên người nhận *</label>
                <input
                  type="text"
                  required
                  value={thongTinNhan.ten_nguoi_nhan}
                  onChange={(e) => setThongTinNhan({ ...thongTinNhan, ten_nguoi_nhan: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:outline-amber-600"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="text"
                  required
                  placeholder="0901234567"
                  value={thongTinNhan.sdt_nguoi_nhan}
                  onChange={(e) => setThongTinNhan({ ...thongTinNhan, sdt_nguoi_nhan: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl focus:outline-amber-600"
                />
              </div>
            </div>

            <div className="text-sm">
              <label className="block font-medium mb-1">Địa chỉ giao hàng chi tiết *</label>
              <textarea
                rows={2}
                required
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                value={thongTinNhan.dia_chi_giao_hang}
                onChange={(e) => setThongTinNhan({ ...thongTinNhan, dia_chi_giao_hang: e.target.value })}
                className="w-full px-3.5 py-2 border rounded-xl focus:outline-amber-600"
              />
            </div>
          </div>

          {/* 2. Sản phẩm đặt mua */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 space-y-4">
            <h2 className="font-bold text-stone-800 text-base">
              2. Sản Phẩm Đặt Mua ({Object.keys(nhomTheoShop).length} kiện hàng từ các Shop)
            </h2>

            <div className="space-y-4">
              {Object.entries(nhomTheoShop).map(([tenShop, dsMon]) => (
                <div key={tenShop} className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="bg-amber-50/70 px-4 py-2.5 border-b border-stone-200 flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Store size={14} /> {tenShop}
                  </div>
                  <div className="divide-y divide-stone-100">
                    {dsMon.map((mon, i) => (
                      <div key={i} className="p-3.5 flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold text-stone-800">{mon.ten_san_pham}</div>
                          {mon.yeu_cau && (
                            <div className="text-xs text-stone-500 mt-0.5">
                              Yêu cầu riêng: <b>{mon.yeu_cau}</b>
                            </div>
                          )}
                          <div className="text-xs text-stone-400 mt-0.5">Số lượng: {mon.so_luong || 1}</div>
                        </div>
                        <div className="font-bold text-amber-800">
                          {(Number(mon.gia_ban) * Number(mon.so_luong || 1)).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Mã giảm giá + Thanh toán */}
        <div className="space-y-5">
          {/* Khung Mã Giảm Giá */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 space-y-3">
            <h2 className="font-bold text-stone-800 flex items-center gap-2 text-sm">
              <Ticket className="text-amber-700" size={18} /> Mã Giảm Giá / Voucher
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã (VD: SANHANDMADE30)"
                value={maNhap}
                onChange={(e) => setMaNhap(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 text-xs border rounded-xl uppercase font-semibold focus:outline-amber-600"
              />
              {voucherDaChon ? (
                <button
                  type="button"
                  onClick={huyVoucher}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <X size={14} /> Bỏ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => apDungVoucher()}
                  className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                >
                  Áp dụng
                </button>
              )}
            </div>

            {thongBaoVoucher.noi_dung && (
              <div
                className={`text-xs px-3 py-2 rounded-lg font-medium ${
                  thongBaoVoucher.loai === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {thongBaoVoucher.noi_dung}
              </div>
            )}

            {/* Danh sách mã giảm giá có sẵn trong SQL Server để bấm chọn nhanh */}
            {dsVoucher.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-stone-500">Mã ưu đãi hiện có (bấm để chọn):</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {dsVoucher.map((v) => {
                    const dangChon = voucherDaChon?.ma_voucher === v.ma_voucher;
                    return (
                      <div
                        key={v.ma_voucher}
                        onClick={() => apDungVoucher(v.ma_code)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                          dangChon
                            ? 'border-amber-700 bg-amber-50'
                            : 'border-dashed border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-amber-900">{v.ma_code}</div>
                          <div className="text-[11px] text-stone-600 line-clamp-1">{v.ten_chuong_trinh}</div>
                          <div className="text-[10px] text-stone-400">
                            Đơn tối thiểu: {Number(v.don_toi_thieu).toLocaleString('vi-VN')}đ • Còn{' '}
                            {v.so_luong_phat_hanh - v.da_su_dung} lượt
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg shrink-0">
                          {dangChon ? 'Đã chọn' : 'Dùng'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Khung Phương thức thanh toán & Tổng tiền */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 space-y-4">
            <h2 className="font-bold text-stone-800 flex items-center gap-2 text-base">
              <CreditCard className="text-amber-700" size={18} /> 3. Phương Thức Thanh Toán
            </h2>

            <div className="space-y-2.5 text-sm">
              <label
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                  thongTinNhan.phuong_thuc_thanh_toan === 'tien_mat_cod'
                    ? 'border-amber-700 bg-amber-50/50 font-semibold'
                    : 'hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="pttt"
                  value="tien_mat_cod"
                  checked={thongTinNhan.phuong_thuc_thanh_toan === 'tien_mat_cod'}
                  onChange={(e) => setThongTinNhan({ ...thongTinNhan, phuong_thuc_thanh_toan: e.target.value })}
                  className="accent-amber-700"
                />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                  thongTinNhan.phuong_thuc_thanh_toan === 'chuyen_khoan_qr'
                    ? 'border-amber-700 bg-amber-50/50 font-semibold'
                    : 'hover:bg-stone-50'
                }`}
              >
                <input
                  type="radio"
                  name="pttt"
                  value="chuyen_khoan_qr"
                  checked={thongTinNhan.phuong_thuc_thanh_toan === 'chuyen_khoan_qr'}
                  onChange={(e) => setThongTinNhan({ ...thongTinNhan, phuong_thuc_thanh_toan: e.target.value })}
                  className="accent-amber-700"
                />
                <span>Chuyển khoản / Quét mã QR</span>
              </label>
            </div>

            {thongTinNhan.phuong_thuc_thanh_toan === 'chuyen_khoan_qr' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <QrCode size={15} /> Quét mã QR thanh toán
                </div>
                <div className="bg-white p-3 rounded-lg border border-amber-100 flex justify-center">
                  <img src={LINK_ANH_QR} alt="Mã QR thanh toán" className="w-48 h-48 object-contain" />
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Tiền hàng:</span>
                <span>{tongTienHang.toLocaleString('vi-VN')}đ</span>
              </div>
              {soTienGiam > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Giảm giá ({voucherDaChon?.ma_code}):</span>
                  <span>-{soTienGiam.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>Phí vận chuyển:</span>
                <span>0đ</span>
              </div>
              <div className="flex justify-between items-center font-bold text-base pt-2 border-t">
                <span>Tổng thanh toán:</span>
                <span className="text-amber-800 text-xl">{tongThanhToan.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={dangDat}
              className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <CheckCircle2 size={18} />
              {dangDat ? 'Đang xử lý đơn hàng...' : 'Hoàn Tất Đặt Hàng'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}