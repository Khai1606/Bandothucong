import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { BACKEND_URL } from '../config';
import { Sparkles, Clock, Star, Store, Search, X } from 'lucide-react';

const ANH_MAU_DU_PHONG = {
  1: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=500&q=80',
  2: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80',
  3: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80',
};

export default function TrangChu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [danhMucs, setDanhMucs] = useState([]);
  const [sanPhams, setSanPhams] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  const tuKhoa = searchParams.get('tu_khoa') || '';
  const maDanhMuc = searchParams.get('ma_danh_muc') || '';
  const [oTimKiem, setOTimKiem] = useState(tuKhoa);

  useEffect(() => {
    setOTimKiem(tuKhoa);
  }, [tuKhoa]);

  useEffect(() => {
    axiosClient.get('/san-pham/danh-muc').then((res) => setDanhMucs(res.data));
  }, []);

  useEffect(() => {
    const taiSanPham = async () => {
      setDangTai(true);
      try {
        const res = await axiosClient.get('/san-pham', {
          params: { tu_khoa: tuKhoa, ma_danh_muc: maDanhMuc },
        });
        setSanPhams(res.data);
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
      } finally {
        setDangTai(false);
      }
    };
    taiSanPham();
  }, [tuKhoa, maDanhMuc]);

  const chonDanhMuc = (id) => {
    const params = {};
    if (tuKhoa) params.tu_khoa = tuKhoa;
    if (id) params.ma_danh_muc = id;
    setSearchParams(params);
  };

  const xuLyTimKiem = (e) => {
    e.preventDefault();
    const params = {};
    if (oTimKiem.trim()) params.tu_khoa = oTimKiem.trim();
    if (maDanhMuc) params.ma_danh_muc = maDanhMuc;
    setSearchParams(params);
  };

  const xoaTimKiem = () => {
    setOTimKiem('');
    const params = {};
    if (maDanhMuc) params.ma_danh_muc = maDanhMuc;
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner giới thiệu + Khung tìm kiếm trực tiếp */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-stone-800 rounded-3xl p-8 md:p-10 text-white shadow-md space-y-5">
        <div>
          <span className="bg-amber-700/80 text-amber-100 text-xs font-semibold px-3 py-1 rounded-full">
            ✨ Sàn Thương Mại Điện Tử Đồ Thủ Công Mỹ Nghệ
          </span>
          <h1 className="text-2xl md:text-4xl font-bold mt-3 leading-tight">
            Tác Phẩm Làm Tay Độc Bản — Cá Nhân Hóa Theo Yêu Cầu
          </h1>
          <p className="text-amber-100/90 text-sm md:text-base mt-2 max-w-2xl">
            Kết nối trực tiếp với các nghệ nhân thủ công. Trao đổi ý tưởng, khắc tên riêng và đặt làm những món quà mang đậm dấu ấn cá nhân.
          </p>
        </div>

        {/* Khung tìm kiếm món hàng ngay trên trang chủ */}
        <form onSubmit={xuLyTimKiem} className="max-w-2xl flex items-center bg-white rounded-2xl p-1.5 shadow-lg">
          <div className="pl-3.5 text-stone-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={oTimKiem}
            onChange={(e) => setOTimKiem(e.target.value)}
            placeholder="Tìm kiếm món đồ thủ công, chất liệu (len, gốm, da...) hoặc tên tiệm..."
            className="flex-1 px-3 py-2 text-sm text-stone-800 bg-transparent focus:outline-none"
          />
          {oTimKiem && (
            <button
              type="button"
              onClick={xoaTimKiem}
              className="p-1.5 text-stone-400 hover:text-stone-600"
              title="Xóa từ khóa"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="bg-amber-700 hover:bg-amber-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Thanh lọc Danh mục */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => chonDanhMuc('')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
            maDanhMuc === '' ? 'bg-amber-700 text-white' : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50'
          }`}
        >
          Tất cả tác phẩm
        </button>
        {danhMucs.map((dm) => (
          <button
            key={dm.ma_danh_muc}
            onClick={() => chonDanhMuc(String(dm.ma_danh_muc))}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              maDanhMuc === String(dm.ma_danh_muc)
                ? 'bg-amber-700 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50'
            }`}
          >
            {dm.ten_danh_muc}
          </button>
        ))}
      </div>

      {/* Thông báo kết quả nếu đang lọc từ khóa */}
      {tuKhoa && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-xs text-amber-900">
          <span>
            Đang hiển thị kết quả tìm kiếm cho từ khóa: <b>"{tuKhoa}"</b> ({sanPhams.length} tác phẩm)
          </span>
          <button onClick={xoaTimKiem} className="font-semibold underline hover:text-amber-700">
            Xem tất cả
          </button>
        </div>
      )}

      {/* Danh sách sản phẩm */}
      {dangTai ? (
        <div className="text-center py-12 text-stone-500">Đang tải các tác phẩm thủ công...</div>
      ) : sanPhams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500">
          Không tìm thấy sản phẩm phù hợp với từ khóa của bạn.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sanPhams.map((sp) => (
            <Link
              key={sp.ma_san_pham}
              to={`/san-pham/${sp.ma_san_pham}`}
              className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col"
            >
              <div className="aspect-square bg-stone-100 overflow-hidden relative">
                <img
                  src={
                    sp.anh_dai_dien
                      ? `${BACKEND_URL}${sp.anh_dai_dien}`
                      : ANH_MAU_DU_PHONG[sp.ma_san_pham] || ANH_MAU_DU_PHONG[1]
                  }
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = ANH_MAU_DU_PHONG[sp.ma_san_pham] || ANH_MAU_DU_PHONG[1];
                  }}
                  alt={sp.ten_san_pham}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {sp.cho_phep_dat_rieng && (
                  <span className="absolute top-2.5 left-2.5 bg-amber-800/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={11} /> Nhận làm riêng
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Store size={12} className="text-amber-700" /> {sp.ten_gian_hang}
                  </div>
                  <h2 className="font-bold text-stone-800 text-sm mt-1 line-clamp-2 group-hover:text-amber-800">
                    {sp.ten_san_pham}
                  </h2>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-bold text-amber-800 text-base">
                    {Number(sp.gia_goc).toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[11px] text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> {sp.so_ngay_hoan_thien}d • {sp.diem_danh_gia} <Star size={11} className="text-amber-500" fill="currentColor" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}