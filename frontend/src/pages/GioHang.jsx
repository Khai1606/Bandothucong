import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  ShoppingBag,
  Trash2,
  Store,
  ArrowRight,
  PackageCheck,
  MapPin,
  Truck,
  Hammer,
  CheckCircle2,
  Clock,
  Navigation,
  PhoneCall,
  X,
} from 'lucide-react';

const CAC_BUOC_DON_HANG = [
  { key: 'cho_xac_nhan', nhan: 'Chờ xác nhận', icon: Clock },
  { key: 'dang_lam_thu_cong', nhan: 'Đang làm tay', icon: Hammer },
  { key: 'dang_giao', nhan: 'Shipper đang giao', icon: Truck },
  { key: 'hoan_thanh', nhan: 'Đã nhận hàng', icon: CheckCircle2 },
];

export default function GioHang({ taiKhoan }) {
  const navigate = useNavigate();
  const [gioHang, setGioHang] = useState([]);
  const [donDaMua, setDonDaMua] = useState([]);

  // State mở modal bản đồ theo dõi shipper
  const [donDangTheoDoi, setDonDangTheoDoi] = useState(null);
  const [tienDoShipper, setTienDoShipper] = useState(0); // 0% -> 100%

  useEffect(() => {
    const duLieuGio = JSON.parse(localStorage.getItem('gio_hang')) || [];
    setGioHang(duLieuGio);
    if (taiKhoan) taiDonDaMua();
  }, [taiKhoan]);

  const taiDonDaMua = async () => {
    try {
      const res = await axiosClient.get(`/don-hang/cua-toi/${taiKhoan.ma_tai_khoan}`);
      setDonDaMua(res.data);
    } catch (err) {
      console.error('Lỗi tải đơn đã mua:', err);
    }
  };

  // Hàm gọi Backend cập nhật trạng thái đơn sang 'hoan_thanh' trong SQL Server
  const hoanTatGiaoHang = async (maDonShop) => {
    try {
      await axiosClient.put(`/gian-hang/don-hang/${maDonShop}/trang-thai`, {
        trang_thai_don: 'hoan_thanh',
      });
      setDonDaMua((prev) =>
        prev.map((dh) => (dh.ma_don_shop === maDonShop ? { ...dh, trang_thai_don: 'hoan_thanh' } : dh))
      );
      setDonDangTheoDoi((prev) => (prev ? { ...prev, trang_thai_don: 'hoan_thanh' } : null));
    } catch (err) {
      console.error('Lỗi cập nhật hoàn thành đơn:', err);
    }
  };

  // Hiệu ứng xe shipper chạy trong ~15 giây rồi tự động xác nhận Đã giao hàng
  useEffect(() => {
    if (!donDangTheoDoi) return;

    if (donDangTheoDoi.trang_thai_don === 'cho_xac_nhan') {
      setTienDoShipper(0);
      return;
    }
    if (donDangTheoDoi.trang_thai_don === 'dang_lam_thu_cong') {
      setTienDoShipper(12);
      return;
    }
    if (donDangTheoDoi.trang_thai_don === 'hoan_thanh') {
      setTienDoShipper(100);
      return;
    }

    // Nếu trạng thái là 'dang_giao': chạy từ 15% đến 100% trong ~15 giây (mỗi 0.5s tăng 3%)
    setTienDoShipper(15);
    const timer = setInterval(() => {
      setTienDoShipper((prev) => {
        const tiepTheo = prev + 3;
        if (tiepTheo >= 100) {
          clearInterval(timer);
          hoanTatGiaoHang(donDangTheoDoi.ma_don_shop);
          return 100;
        }
        return tiepTheo;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [donDangTheoDoi?.ma_don_shop, donDangTheoDoi?.trang_thai_don]);

  const capNhatSoLuong = (index, delta) => {
    const gioMoi = [...gioHang];
    const slMoi = (gioMoi[index].so_luong || 1) + delta;
    if (slMoi < 1) return;
    gioMoi[index].so_luong = slMoi;
    setGioHang(gioMoi);
    localStorage.setItem('gio_hang', JSON.stringify(gioMoi));
    window.dispatchEvent(new Event('storage'));
  };

  const xoaKhoiGio = (index) => {
    const gioMoi = gioHang.filter((_, i) => i !== index);
    setGioHang(gioMoi);
    localStorage.setItem('gio_hang', JSON.stringify(gioMoi));
    window.dispatchEvent(new Event('storage'));
  };

  const tongTien = gioHang.reduce((sum, item) => sum + Number(item.gia_ban) * Number(item.so_luong || 1), 0);

  const chuyenSangThanhToan = () => {
    if (!taiKhoan) {
      alert('Vui lòng đăng nhập để tiến hành thanh toán!');
      return navigate('/dang-nhap');
    }
    navigate('/thanh-toan');
  };

  const layChiSoBuoc = (trangThai) => {
    const idx = CAC_BUOC_DON_HANG.findIndex((b) => b.key === trangThai);
    return idx === -1 ? 0 : idx;
  };

  // Tính tọa độ xe shipper di chuyển theo đường cong từ Shop (18%, 68%) đến Khách (82%, 32%)
  const viTriShipperX = 18 + (tienDoShipper / 100) * 64;
  const viTriShipperY = 68 - (tienDoShipper / 100) * 36 - Math.sin((tienDoShipper / 100) * Math.PI) * 12;
  const giayConLai = Math.max(0, Math.ceil(((100 - tienDoShipper) / 3) * 0.5));

  // Đảm bảo địa chỉ tìm trên Google Maps luôn nằm trong Việt Nam (tránh phóng ra bản đồ thế giới nếu nhập toàn số)
  const layDiaChiBanDo = (diaChi) => {
    if (!diaChi || /^\d+$/.test(diaChi.trim()) || diaChi.trim().length < 6) {
      return 'Quận 1, TP. Hồ Chí Minh, Việt Nam';
    }
    return `${diaChi}, Việt Nam`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* PHẦN 1: DANH SÁCH SẢN PHẨM TRONG GIỎ HÀNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
          <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-5">
            <ShoppingBag className="text-amber-700" /> Giỏ Hàng Của Bạn ({gioHang.length} món)
          </h1>

          {gioHang.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm space-y-3">
              <div>Giỏ hàng đang trống. Hãy chọn thêm các món đồ thủ công xinh xắn nhé!</div>
              <button
                onClick={() => navigate('/')}
                className="bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-amber-800 transition"
              >
                Khám phá tác phẩm thủ công
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {gioHang.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl bg-stone-50/50"
                >
                  <div>
                    <div className="text-xs text-amber-800 font-semibold flex items-center gap-1 mb-0.5">
                      <Store size={12} /> {item.ten_gian_hang || 'Gian hàng thủ công'}
                    </div>
                    <div className="font-bold text-stone-800 text-sm">{item.ten_san_pham}</div>
                    {item.yeu_cau && (
                      <div className="text-xs text-stone-500 mt-0.5">
                        Yêu cầu riêng: <b>{item.yeu_cau}</b>
                      </div>
                    )}
                    <div className="text-xs text-stone-500 mt-1">
                      Đơn giá: <b>{Number(item.gia_ban).toLocaleString('vi-VN')}đ</b>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="inline-flex items-center border bg-white rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => capNhatSoLuong(idx, -1)}
                        className="px-2.5 py-1 hover:bg-stone-100 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-semibold">{item.so_luong || 1}</span>
                      <button
                        type="button"
                        onClick={() => capNhatSoLuong(idx, 1)}
                        className="px-2.5 py-1 hover:bg-stone-100 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-amber-800 min-w-[90px] text-right">
                      {(Number(item.gia_ban) * Number(item.so_luong || 1)).toLocaleString('vi-VN')}đ
                    </span>

                    <button onClick={() => xoaKhoiGio(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột tóm tắt đơn hàng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 h-fit space-y-4">
          <h2 className="text-lg font-bold text-stone-800">Tóm Tắt Giỏ Hàng</h2>

          <div className="space-y-2 text-sm text-stone-600 border-b pb-4">
            <div className="flex justify-between">
              <span>Tổng số lượng sản phẩm:</span>
              <b>{gioHang.reduce((s, i) => s + Number(i.so_luong || 1), 0)} món</b>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển dự kiến:</span>
              <span className="text-green-600 font-medium">Miễn phí</span>
            </div>
          </div>

          <div className="flex justify-between items-center font-bold text-base">
            <span>Tạm tính:</span>
            <span className="text-amber-800 text-xl">{tongTien.toLocaleString('vi-VN')}đ</span>
          </div>

          <button
            type="button"
            disabled={gioHang.length === 0}
            onClick={chuyenSangThanhToan}
            className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <span>Tiến Hành Thanh Toán</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* PHẦN 2: THEO DÕI ĐƠN HÀNG & HÀNH TRÌNH SHIPPER */}
      {taiKhoan && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <PackageCheck className="text-amber-700" /> Theo Dõi Đơn Hàng Của Bạn ({donDaMua.length})
            </h2>
            <button
              onClick={taiDonDaMua}
              className="text-xs text-amber-800 hover:underline font-semibold"
            >
              Làm mới trạng thái
            </button>
          </div>

          {donDaMua.length === 0 ? (
            <p className="text-sm text-stone-400">Bạn chưa có đơn hàng nào.</p>
          ) : (
            <div className="space-y-4">
              {donDaMua.map((dh) => {
                const daHuy = dh.trang_thai_don === 'da_huy';
                const buocHienTai = layChiSoBuoc(dh.trang_thai_don);

                return (
                  <div
                    key={dh.ma_don_shop}
                    className="p-5 border border-amber-100 rounded-2xl bg-amber-50/20 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-800 text-sm flex items-center gap-2">
                          <span>
                            Mã đơn: <span className="text-amber-800">{dh.ma_tra_cuu_shop}</span>
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="inline-flex items-center gap-1 text-stone-700">
                            <Store size={14} className="text-amber-700" /> {dh.ten_gian_hang}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                          <MapPin size={13} className="text-red-500 shrink-0" /> Giao tới: {dh.dia_chi_giao_hang}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-bold text-amber-800 text-base">
                            {Number(dh.tien_hang).toLocaleString('vi-VN')}đ
                          </div>
                          {daHuy && (
                            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-semibold">
                              Đơn đã bị hủy
                            </span>
                          )}
                        </div>

                        {!daHuy && (
                          <button
                            type="button"
                            onClick={() => setDonDangTheoDoi(dh)}
                            className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
                          >
                            <Navigation size={14} /> Xem bản đồ Shipper
                          </button>
                        )}
                      </div>
                    </div>

                    {!daHuy && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {CAC_BUOC_DON_HANG.map((buoc, idx) => {
                          const Icon = buoc.icon;
                          const hoanThanh = idx <= buocHienTai;
                          const dangChay = idx === buocHienTai;

                          return (
                            <div key={buoc.key} className="flex flex-col items-center text-center relative">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition ${
                                  hoanThanh
                                    ? 'bg-amber-700 border-amber-700 text-white'
                                    : 'bg-white border-stone-200 text-stone-400'
                                } ${dangChay ? 'ring-4 ring-amber-200' : ''}`}
                              >
                                <Icon size={16} />
                              </div>
                              <span
                                className={`text-[11px] mt-1.5 font-semibold ${
                                  hoanThanh ? 'text-amber-900' : 'text-stone-400'
                                }`}
                              >
                                {buoc.nhan}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL BẢN ĐỒ TRỰC TIẾP THEO DÕI SHIPPER DI CHUYỂN */}
      {donDangTheoDoi && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-amber-100">
            {/* Header Modal */}
            <div className="bg-amber-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-200 font-medium">
                  Hành trình giao hàng trực tiếp • {donDangTheoDoi.ma_tra_cuu_shop}
                </div>
                <h3 className="font-bold text-base mt-0.5">
                  {donDangTheoDoi.trang_thai_don === 'hoan_thanh'
                    ? '🎉 Shipper đã giao tác phẩm đến tận tay bạn!'
                    : donDangTheoDoi.trang_thai_don === 'dang_giao'
                    ? `🛵 Tài xế đang giao hàng (Dự kiến tới nơi sau ${giayConLai}s)...`
                    : '⏳ Xưởng thủ công đang chuẩn bị gói hàng cho tài xế'}
                </h3>
              </div>
              <button
                onClick={() => setDonDangTheoDoi(null)}
                className="p-1.5 rounded-full hover:bg-amber-700 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Khung Bản Đồ Thực Tế + Tuyến Đường + Xe Shipper Di Chuyển */}
            <div className="relative w-full h-80 bg-stone-200 overflow-hidden select-none">
              <iframe
                title="Bản đồ giao hàng"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  layDiaChiBanDo(donDangTheoDoi.dia_chi_giao_hang)
                )}&t=m&z=15&output=embed&iwloc=near`}
                className="w-full h-full border-0 pointer-events-none opacity-95"
              />

              {/* Lớp phủ vẽ tuyến đường & icon Shipper di chuyển động */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M 18 68 Q 50 35, 82 32"
                  fill="none"
                  stroke="#92400e"
                  strokeWidth="1.2"
                  strokeDasharray="2.5,2"
                  opacity="0.5"
                />
                <path
                  d={`M 18 68 Q ${(18 + viTriShipperX) / 2} ${viTriShipperY - 4}, ${viTriShipperX} ${viTriShipperY}`}
                  fill="none"
                  stroke="#b45309"
                  strokeWidth="1.8"
                />
              </svg>

              {/* Điểm xuất phát: Xưởng Thủ Công */}
              <div
                style={{ left: '18%', top: '68%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                <div className="bg-amber-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow mb-1 whitespace-nowrap">
                  🏪 {donDangTheoDoi.ten_gian_hang}
                </div>
                <div className="w-4 h-4 rounded-full bg-amber-900 border-2 border-white shadow-md" />
              </div>

              {/* Điểm đích: Nhà Khách Hàng */}
              <div
                style={{ left: '82%', top: '32%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow mb-1 whitespace-nowrap">
                  📍 Điểm nhận hàng
                </div>
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-md" />
              </div>

              {/* Xe Shipper đang chạy theo thời gian thực */}
              <div
                style={{
                  left: `${viTriShipperX}%`,
                  top: `${viTriShipperY}%`,
                  transition: 'all 0.5s linear',
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
              >
                <div className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md mb-1 whitespace-nowrap">
                  {donDangTheoDoi.trang_thai_don === 'hoan_thanh'
                    ? '✅ Đã giao tận tay!'
                    : donDangTheoDoi.trang_thai_don === 'dang_giao'
                    ? `🛵 Đang giao (${Math.round(tienDoShipper)}%)`
                    : 'Đang chờ lấy hàng'}
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white border-2 border-white shadow-lg flex items-center justify-center">
                  <Truck size={20} />
                </div>
              </div>
            </div>

            {/* Thông tin tài xế & Nút xác nhận đã nhận hàng */}
            <div className="p-5 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                  🛵
                </div>
                <div>
                  <div className="font-bold text-stone-800 text-sm">
                    Tài xế giao hàng: Nguyễn Văn Hùng • <span className="text-amber-700">4.9 ⭐</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Biển số: <b>59-S2 684.12</b> • Giao tới: {donDangTheoDoi.dia_chi_giao_hang}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {donDangTheoDoi.trang_thai_don === 'dang_giao' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTienDoShipper(100);
                      hoanTatGiaoHang(donDangTheoDoi.ma_don_shop);
                    }}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                  >
                    Đã nhận được hàng
                  </button>
                )}

                <a
                  href="tel:0909123456"
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                >
                  <PhoneCall size={14} /> Gọi tài xế
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}