import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import TheChotDon from './TheChotDon';
import { MessageCircle, X, Send, Sparkles, Store } from 'lucide-react';

export default function BoxChat({ taiKhoan, shopDangMoChat, setShopDangMoChat }) {
  const navigate = useNavigate();
  const [moCuaSo, setMoCuaSo] = useState(false);
  const [dsHoiThoai, setDsHoiThoai] = useState([]);
  const [hoiThoaiChon, setHoiThoaiChon] = useState(null);
  const [tinNhans, setTinNhans] = useState([]);
  const [noiDungNhap, setNoiDungNhap] = useState('');

  // Form nhỏ tạo thẻ chốt đơn dành cho chủ shop
  const [hienFormChotDon, setHienFormChotDon] = useState(false);
  const [formThoaThuan, setFormThoaThuan] = useState({
    ten_san_pham: '',
    yeu_cau: '',
    gia_thoa_thuan: '',
    so_ngay: '3',
  });

  const cuonCuoiRef = useRef(null);

  const taiDsHoiThoai = async () => {
    if (!taiKhoan) return;
    try {
      const res = await axiosClient.get(`/chat/hoi-thoai/${taiKhoan.ma_tai_khoan}`);
      setDsHoiThoai(res.data);
      if (!hoiThoaiChon && res.data.length > 0) {
        setHoiThoaiChon(res.data[0]);
      }
    } catch (err) {
      console.error('Lỗi tải hội thoại:', err);
    }
  };

  useEffect(() => {
    const moChatTuTrangSp = async () => {
      if (!shopDangMoChat || !taiKhoan) return;
      setMoCuaSo(true);
      try {
        const res = await axiosClient.post('/chat/mo-hoi-thoai', {
          ma_tai_khoan: taiKhoan.ma_tai_khoan,
          ma_gian_hang: shopDangMoChat.ma_gian_hang,
        });
        await taiDsHoiThoai();
        setHoiThoaiChon({
          ...res.data,
          ten_gian_hang: shopDangMoChat.ten_gian_hang,
          ma_khach_hang: taiKhoan.ma_tai_khoan,
        });
        if (shopDangMoChat.san_pham_dinh_kem) {
          setNoiDungNhap(`Chào shop, mình muốn hỏi đặt làm mẫu "${shopDangMoChat.san_pham_dinh_kem.ten_san_pham}" ạ!`);
        }
        setShopDangMoChat(null);
      } catch (err) {
        console.error('Lỗi mở chat:', err);
      }
    };
    moChatTuTrangSp();
  }, [shopDangMoChat]);

  useEffect(() => {
    if (moCuaSo && taiKhoan) taiDsHoiThoai();
  }, [moCuaSo, taiKhoan]);

  useEffect(() => {
    if (!moCuaSo || !hoiThoaiChon) return;

    const layTin = async () => {
      try {
        const res = await axiosClient.get(`/chat/tin-nhan/${hoiThoaiChon.ma_hoi_thoai}`);
        setTinNhans(res.data);
      } catch (err) {
        console.error('Lỗi tải tin nhắn:', err);
      }
    };

    layTin();
    const interval = setInterval(layTin, 3000);
    return () => clearInterval(interval);
  }, [moCuaSo, hoiThoaiChon]);

  useEffect(() => {
    cuonCuoiRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tinNhans]);

  if (!taiKhoan) return null;

  const xuLyGuiTin = async (e) => {
    e.preventDefault();
    if (!noiDungNhap.trim() || !hoiThoaiChon) return;

    try {
      await axiosClient.post('/chat/gui-tin-nhan', {
        ma_hoi_thoai: hoiThoaiChon.ma_hoi_thoai,
        ma_nguoi_gui: taiKhoan.ma_tai_khoan,
        loai_tin_nhan: 'van_ban',
        noi_dung: noiDungNhap,
      });
      setNoiDungNhap('');
      const res = await axiosClient.get(`/chat/tin-nhan/${hoiThoaiChon.ma_hoi_thoai}`);
      setTinNhans(res.data);
      taiDsHoiThoai();
    } catch (err) {
      alert('Không gửi được tin nhắn!');
    }
  };

  const xuLyGuiTheChotDon = async (e) => {
    e.preventDefault();
    if (!hoiThoaiChon) return;
    try {
      await axiosClient.post('/chat/gui-tin-nhan', {
        ma_hoi_thoai: hoiThoaiChon.ma_hoi_thoai,
        ma_nguoi_gui: taiKhoan.ma_tai_khoan,
        loai_tin_nhan: 'the_chot_don',
        noi_dung: `[Thẻ chốt đơn] ${formThoaThuan.ten_san_pham} - ${Number(formThoaThuan.gia_thoa_thuan).toLocaleString('vi-VN')}đ`,
        du_lieu_thoa_thuan: formThoaThuan,
      });
      setHienFormChotDon(false);
      setFormThoaThuan({ ten_san_pham: '', yeu_cau: '', gia_thoa_thuan: '', so_ngay: '3' });
      const res = await axiosClient.get(`/chat/tin-nhan/${hoiThoaiChon.ma_hoi_thoai}`);
      setTinNhans(res.data);
    } catch (err) {
      alert('Lỗi tạo thẻ chốt đơn!');
    }
  };

  const laChuShopTrongCuocChat = hoiThoaiChon && hoiThoaiChon.ma_chu_shop === taiKhoan.ma_tai_khoan;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!moCuaSo && (
        <button
          onClick={() => setMoCuaSo(true)}
          className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition"
        >
          <MessageCircle size={22} />
          <span>Chat CSKH / Đặt làm riêng</span>
        </button>
      )}

      {moCuaSo && (
        <div className="bg-white w-[360px] sm:w-[620px] h-[480px] rounded-2xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden">
          <div className="bg-amber-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MessageCircle size={18} />
              <span>Hộp Thoại Trao Đổi & Chốt Đơn Thủ Công</span>
            </div>
            <button onClick={() => setMoCuaSo(false)} className="hover:bg-amber-700 p-1 rounded">
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-stone-200 bg-stone-50 overflow-y-auto">
              {dsHoiThoai.length === 0 ? (
                <div className="p-4 text-xs text-stone-400 text-center">Chưa có cuộc trò chuyện nào</div>
              ) : (
                dsHoiThoai.map((ht) => {
                  const tenHienThi = ht.ma_chu_shop === taiKhoan.ma_tai_khoan ? `Khách: ${ht.ten_khach_hang}` : ht.ten_gian_hang;
                  const dangChon = hoiThoaiChon?.ma_hoi_thoai === ht.ma_hoi_thoai;
                  return (
                    <div
                      key={ht.ma_hoi_thoai}
                      onClick={() => setHoiThoaiChon(ht)}
                      className={`p-3 border-b border-stone-100 cursor-pointer transition ${
                        dangChon ? 'bg-amber-100/80 border-l-4 border-l-amber-700' : 'hover:bg-white'
                      }`}
                    >
                      <div className="font-semibold text-xs text-stone-800 truncate flex items-center gap-1">
                        <Store size={12} className="text-amber-700 shrink-0" /> {tenHienThi}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate mt-1">{ht.tin_nhan_cuoi || 'Bắt đầu trò chuyện...'}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="w-2/3 flex flex-col bg-white">
              {!hoiThoaiChon ? (
                <div className="flex-1 flex items-center justify-center text-xs text-stone-400 p-4 text-center">
                  Chọn một cuộc trò chuyện bên trái hoặc bấm "Chat với Shop" tại trang sản phẩm
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 border-b bg-amber-50/40 flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      {laChuShopTrongCuocChat ? `Khách: ${hoiThoaiChon.ten_khach_hang}` : hoiThoaiChon.ten_gian_hang}
                    </span>
                    {laChuShopTrongCuocChat && (
                      <button
                        onClick={() => setHienFormChotDon(!hienFormChotDon)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Sparkles size={12} /> {hienFormChotDon ? 'Đóng form' : 'Tạo thẻ chốt đơn'}
                      </button>
                    )}
                  </div>

                  {hienFormChotDon && (
                    <form onSubmit={xuLyGuiTheChotDon} className="p-3 bg-amber-50 border-b border-amber-200 space-y-2 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Tên món đặt làm riêng..."
                        value={formThoaThuan.ten_san_pham}
                        onChange={(e) => setFormThoaThuan({ ...formThoaThuan, ten_san_pham: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Ghi chú khắc tên / màu sắc..."
                        value={formThoaThuan.yeu_cau}
                        onChange={(e) => setFormThoaThuan({ ...formThoaThuan, yeu_cau: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border rounded"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          placeholder="Giá chốt (VNĐ)"
                          value={formThoaThuan.gia_thoa_thuan}
                          onChange={(e) => setFormThoaThuan({ ...formThoaThuan, gia_thoa_thuan: e.target.value })}
                          className="w-1/2 px-2.5 py-1.5 bg-white border rounded"
                        />
                        <input
                          type="number"
                          min={1}
                          placeholder="Số ngày làm"
                          value={formThoaThuan.so_ngay}
                          onChange={(e) => setFormThoaThuan({ ...formThoaThuan, so_ngay: e.target.value })}
                          className="w-1/4 px-2 py-1.5 bg-white border rounded"
                        />
                        <button type="submit" className="w-1/4 bg-amber-700 text-white rounded font-semibold">
                          Gửi thẻ
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-stone-50/50">
                    {tinNhans.map((tn) => {
                      const laCuaToi = tn.ma_nguoi_gui === taiKhoan.ma_tai_khoan;
                      return (
                        <div key={tn.ma_tin_nhan} className={`flex flex-col ${laCuaToi ? 'items-end' : 'items-start'}`}>
                          {tn.loai_tin_nhan === 'the_chot_don' ? (
                            <TheChotDon
                              duLieuJson={tn.du_lieu_thoa_thuan}
                              laNguoiMua={!laChuShopTrongCuocChat}
                              onXacNhanDat={(tt) => {
                                const gioHienTai = JSON.parse(localStorage.getItem('gio_hang')) || [];
                                gioHienTai.push({
                                  ma_san_pham: null,
                                  ten_san_pham: tt.ten_san_pham,
                                  ten_mon_dat_rieng: tt.ten_san_pham,
                                  gia_ban: Number(tt.gia_thoa_thuan),
                                  so_luong: 1,
                                  yeu_cau: tt.yeu_cau || '',
                                  ma_gian_hang: hoiThoaiChon.ma_gian_hang,
                                  ten_gian_hang: hoiThoaiChon.ten_gian_hang,
                                });
                                localStorage.setItem('gio_hang', JSON.stringify(gioHienTai));
                                window.dispatchEvent(new Event('storage'));
                                setMoCuaSo(false);
                                navigate('/gio-hang');
                              }}
                            />
                          ) : (
                            <div
                              className={`px-3 py-2 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                                laCuaToi
                                  ? 'bg-amber-700 text-white rounded-br-none'
                                  : 'bg-white border border-stone-200 text-stone-800 rounded-bl-none'
                              }`}
                            >
                              {tn.noi_dung}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={cuonCuoiRef} />
                  </div>

                  <form onSubmit={xuLyGuiTin} className="p-2.5 border-t bg-white flex gap-2">
                    <input
                      type="text"
                      value={noiDungNhap}
                      onChange={(e) => setNoiDungNhap(e.target.value)}
                      placeholder="Nhập tin nhắn trao đổi mẫu..."
                      className="flex-1 px-3 py-1.5 text-xs border rounded-full focus:outline-amber-600"
                    />
                    <button
                      type="submit"
                      className="bg-amber-700 hover:bg-amber-800 text-white p-2 rounded-full transition"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}