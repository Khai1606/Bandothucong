import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { BACKEND_URL } from '../config';
import { ShoppingBag, MessageCircle, Store, Clock, Sparkles, Star, ArrowLeft, Send, Edit3, Zap } from 'lucide-react';

const ANH_MAU_DU_PHONG = {
  1: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600&q=80',
  2: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
  3: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
};

export default function ChiTietSanPham({ taiKhoan, moChatVoiShop }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const anhSanPhamRef = useRef(null);

  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [soLuong, setSoLuong] = useState(1);
  const [yeuCauRieng, setYeuCauRieng] = useState('');

  const [soSaoChon, setSoSaoChon] = useState(5);
  const [binhLuanMoi, setBinhLuanMoi] = useState('');
  const [dangGuiDanhGia, setDangGuiDanhGia] = useState(false);
  const [daTungDanhGia, setDaTungDanhGia] = useState(false);

  const taiChiTiet = async () => {
    setDangTai(true);
    try {
      const res = await axiosClient.get(`/san-pham/${id}`);
      setDuLieu(res.data);

      if (taiKhoan && res.data.danh_gia) {
        const danhGiaCuaToi = res.data.danh_gia.find(
          (dg) => dg.ma_tai_khoan === taiKhoan.ma_tai_khoan
        );
        if (danhGiaCuaToi) {
          setDaTungDanhGia(true);
          setSoSaoChon(danhGiaCuaToi.so_sao);
          setBinhLuanMoi(danhGiaCuaToi.binh_luan || '');
        } else {
          setDaTungDanhGia(false);
          setSoSaoChon(5);
          setBinhLuanMoi('');
        }
      }
    } catch (err) {
      console.error('Lỗi tải chi tiết sản phẩm:', err);
    } finally {
      setDangTai(false);
    }
  };

  useEffect(() => {
    taiChiTiet();
  }, [id, taiKhoan]);

  if (dangTai) {
    return <div className="p-12 text-center text-stone-500">Đang tải thông tin tác phẩm...</div>;
  }

  if (!duLieu || !duLieu.san_pham) {
    return <div className="p-12 text-center text-red-500">Không tìm thấy sản phẩm này!</div>;
  }

  const { san_pham: sanPham, hinh_anh: hinhAnh, danh_gia: danhGia } = duLieu;
  const anhDaiDien =
    hinhAnh && hinhAnh.length > 0
      ? `${BACKEND_URL}${hinhAnh[0].duong_dan_anh}`
      : ANH_MAU_DU_PHONG[sanPham.ma_san_pham] || ANH_MAU_DU_PHONG[1];

  // Tạo bản sao ảnh sản phẩm bay từ khung ảnh tới icon Giỏ hàng trên Navbar
  const chayHieuUngBayVaoGio = (callbackSauKhiBay) => {
    const imgEl = anhSanPhamRef.current;
    const cartEl = document.getElementById('icon-gio-hang-navbar');

    if (!imgEl || !cartEl) {
      callbackSauKhiBay();
      return;
    }

    const imgRect = imgEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    // Tạo thẻ ảnh bay tạm thời
    const flyingImg = document.createElement('img');
    flyingImg.src = imgEl.src;
    flyingImg.style.position = 'fixed';
    flyingImg.style.left = `${imgRect.left}px`;
    flyingImg.style.top = `${imgRect.top}px`;
    flyingImg.style.width = `${imgRect.width}px`;
    flyingImg.style.height = `${imgRect.height}px`;
    flyingImg.style.objectFit = 'cover';
    flyingImg.style.borderRadius = '16px';
    flyingImg.style.zIndex = '9999';
    flyingImg.style.pointerEvents = 'none';
    flyingImg.style.boxShadow = '0 12px 30px rgba(180, 83, 9, 0.35)';
    flyingImg.style.transition = 'all 0.75s cubic-bezier(0.22, 1, 0.36, 1)';

    document.body.appendChild(flyingImg);

    // Kích hoạt chuyển động thu nhỏ và bay thẳng tới tâm biểu tượng giỏ hàng
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 14}px`;
        flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 14}px`;
        flyingImg.style.width = '28px';
        flyingImg.style.height = '28px';
        flyingImg.style.borderRadius = '50%';
        flyingImg.style.opacity = '0.25';
        flyingImg.style.transform = 'rotate(15deg)';
      });
    });

    // Khi bay tới nơi: xóa ảnh tạm, cập nhật số lượng giỏ & làm icon giỏ hàng nảy nhẹ
    setTimeout(() => {
      flyingImg.remove();
      callbackSauKhiBay();
      window.dispatchEvent(new Event('gio-hang-nay'));
    }, 750);
  };

  const luuMonVaoGio = () => {
    const gioHienTai = JSON.parse(localStorage.getItem('gio_hang')) || [];

    const monMoi = {
      ma_san_pham: sanPham.ma_san_pham,
      ten_san_pham: sanPham.ten_san_pham,
      gia_ban: Number(sanPham.gia_goc),
      so_luong: soLuong,
      yeu_cau: yeuCauRieng || '',
      ma_gian_hang: sanPham.ma_gian_hang,
      ten_gian_hang: sanPham.ten_gian_hang,
    };

    const viTriTrung = gioHienTai.findIndex(
      (item) => item.ma_san_pham === monMoi.ma_san_pham && item.yeu_cau === monMoi.yeu_cau
    );

    if (viTriTrung > -1) {
      gioHienTai[viTriTrung].so_luong += soLuong;
    } else {
      gioHienTai.push(monMoi);
    }

    localStorage.setItem('gio_hang', JSON.stringify(gioHienTai));
    window.dispatchEvent(new Event('storage'));
  };

  const themVaoGioHang = () => {
    chayHieuUngBayVaoGio(() => {
      luuMonVaoGio();
    });
  };

  const xuLyMuaNgay = () => {
    if (!taiKhoan) {
      alert('Vui lòng đăng nhập để tiến hành mua hàng!');
      return navigate('/dang-nhap');
    }
    luuMonVaoGio();
    navigate('/thanh-toan');
  };

  const xuLyChatVoiShop = () => {
    if (!taiKhoan) {
      alert('Vui lòng đăng nhập để nhắn tin trao đổi với chủ tiệm!');
      return navigate('/dang-nhap');
    }
    moChatVoiShop({
      ma_gian_hang: sanPham.ma_gian_hang,
      ten_gian_hang: sanPham.ten_gian_hang,
      san_pham_dinh_kem: sanPham,
    });
  };

  const xuLyGuiDanhGia = async (e) => {
    e.preventDefault();
    if (!taiKhoan) {
      alert('Vui lòng đăng nhập để viết đánh giá!');
      return navigate('/dang-nhap');
    }
    setDangGuiDanhGia(true);
    try {
      const res = await axiosClient.post('/san-pham/danh-gia', {
        ma_san_pham: sanPham.ma_san_pham,
        ma_tai_khoan: taiKhoan.ma_tai_khoan,
        so_sao: soSaoChon,
        binh_luan: binhLuanMoi,
      });
      alert('⭐ ' + res.data.message);
      taiChiTiet();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setDangGuiDanhGia(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-amber-800 font-medium"
      >
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-amber-100 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
          <img
            ref={anhSanPhamRef}
            src={anhDaiDien}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = ANH_MAU_DU_PHONG[sanPham.ma_san_pham] || ANH_MAU_DU_PHONG[1];
            }}
            alt={sanPham.ten_san_pham}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold">
                {sanPham.ten_danh_muc || 'Đồ thủ công'}
              </span>
              <span className="text-stone-500 flex items-center gap-1">
                <Clock size={14} /> Thời gian làm tay: {sanPham.so_ngay_hoan_thien} ngày
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">{sanPham.ten_san_pham}</h1>

            <div className="text-3xl font-bold text-amber-800">
              {Number(sanPham.gia_goc).toLocaleString('vi-VN')}đ
            </div>

            <div className="text-sm text-stone-600 leading-relaxed pt-1">
              {sanPham.mo_ta || 'Sản phẩm được chế tác thủ công tỉ mỉ từng chi tiết.'}
            </div>

            <div className="text-xs text-stone-500 pt-1">
              Chất liệu chính: <b className="text-stone-700">{sanPham.chat_lieu}</b> • Còn sẵn: <b>{sanPham.so_luong_ton}</b>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2 mt-3">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles size={14} /> Yêu cầu cá nhân hóa (Khắc tên / Thêu chữ / Đổi màu):
              </label>
              <input
                type="text"
                placeholder="VD: Khắc tên 'Hoàng Yến' hoặc phối màu xanh bơ..."
                value={yeuCauRieng}
                onChange={(e) => setYeuCauRieng(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-amber-200 rounded-lg focus:outline-amber-600"
              />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <span className="text-sm font-medium text-stone-700">Số lượng:</span>
              <div className="inline-flex items-center border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSoLuong((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-semibold">{soLuong}</span>
                <button
                  type="button"
                  onClick={() => setSoLuong((q) => q + 1)}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={xuLyChatVoiShop}
                className="border-2 border-amber-700 text-amber-800 hover:bg-amber-50 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <MessageCircle size={18} /> Chat với Shop
              </button>
              <button
                type="button"
                onClick={themVaoGioHang}
                className="border-2 border-amber-700 bg-amber-50/70 text-amber-900 hover:bg-amber-100 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                <ShoppingBag size={18} /> Thêm vào giỏ hàng
              </button>
            </div>

            <button
              type="button"
              onClick={xuLyMuaNgay}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Zap size={18} /> Mua hàng ngay
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
          <Store size={24} />
        </div>
        <div>
          <div className="font-bold text-stone-800">{sanPham.ten_gian_hang}</div>
          <div className="text-xs text-stone-500 mt-0.5">
            {sanPham.dia_chi_lay_hang} • Đánh giá: <b>{sanPham.diem_danh_gia}</b> ⭐
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 space-y-5">
        <h2 className="font-bold text-stone-800">Đánh giá từ khách đã mua ({danhGia?.length || 0})</h2>

        {taiKhoan && (
          <form onSubmit={xuLyGuiDanhGia} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <span>{daTungDanhGia ? 'Đánh giá của bạn (có thể chỉnh sửa):' : 'Chất lượng tác phẩm:'}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((sao) => (
                    <button
                      type="button"
                      key={sao}
                      onClick={() => setSoSaoChon(sao)}
                      className={`p-1 ${sao <= soSaoChon ? 'text-amber-500' : 'text-stone-300'}`}
                    >
                      <Star size={20} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              {daTungDanhGia && (
                <span className="text-[11px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                  Bạn đã đánh giá sản phẩm này
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Chia sẻ cảm nhận về độ tỉ mỉ, chất liệu sản phẩm thủ công..."
                value={binhLuanMoi}
                onChange={(e) => setBinhLuanMoi(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-amber-600"
              />
              <button
                type="submit"
                disabled={dangGuiDanhGia}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
              >
                {daTungDanhGia ? <Edit3 size={15} /> : <Send size={15} />}
                {daTungDanhGia ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        )}

        {!danhGia || danhGia.length === 0 ? (
          <p className="text-xs text-stone-400">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="space-y-3">
            {danhGia.map((dg) => {
              const laCuaToi = taiKhoan && dg.ma_tai_khoan === taiKhoan.ma_tai_khoan;
              return (
                <div
                  key={dg.ma_danh_gia}
                  className={`border-b pb-3 text-sm ${laCuaToi ? 'bg-amber-50/40 p-3 rounded-xl border border-amber-100' : ''}`}
                >
                  <div className="font-semibold text-stone-800 flex items-center gap-2">
                    <span>{dg.ho_ten}</span>
                    {laCuaToi && (
                      <span className="text-[10px] bg-amber-700 text-white px-2 py-0.5 rounded-full">Của bạn</span>
                    )}
                    <span className="text-amber-500 flex items-center text-xs">
                      {dg.so_sao} <Star size={12} fill="currentColor" />
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">{dg.binh_luan}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}