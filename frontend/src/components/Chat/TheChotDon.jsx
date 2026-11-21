import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export default function TheChotDon({ duLieuJson, laNguoiMua, onXacNhanDat }) {
  let thongTin = {};
  try {
    thongTin = typeof duLieuJson === 'string' ? JSON.parse(duLieuJson) : duLieuJson;
  } catch {
    return null;
  }

  const tenMon = thongTin.ten_san_pham || thongTin.ten_mon || 'Sản phẩm đặt làm riêng';
  const yeuCau = thongTin.yeu_cau || thongTin.ghi_chu || '';
  const giaChot = thongTin.gia_thoa_thuan ?? thongTin.gia_chot ?? 0;
  const soNgay = thongTin.so_ngay || thongTin.so_ngay_lam || 2;

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 my-1 text-stone-800 shadow-sm max-w-[260px]">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase mb-1.5">
        <Sparkles size={14} /> Thỏa thuận đặt làm riêng
      </div>

      <div className="font-bold text-sm text-stone-900">{tenMon}</div>
      {yeuCau && (
        <div className="text-xs text-stone-600 mt-1 bg-white p-1.5 rounded border border-amber-100">
          Yêu cầu: <b>{yeuCau}</b>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-stone-500 mt-2">
        <span className="flex items-center gap-1">
          <Clock size={12} /> Làm {soNgay} ngày
        </span>
        <span className="font-bold text-sm text-amber-800">
          {Number(giaChot).toLocaleString('vi-VN')}đ
        </span>
      </div>

      {laNguoiMua && (
        <button
          onClick={() =>
            onXacNhanDat &&
            onXacNhanDat({ ten_san_pham: tenMon, yeu_cau: yeuCau, gia_thoa_thuan: giaChot, so_ngay: soNgay })
          }
          className="mt-2.5 w-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 transition"
        >
          <CheckCircle2 size={14} /> Chốt đơn & Đặt làm ngay
        </button>
      )}
    </div>
  );
}