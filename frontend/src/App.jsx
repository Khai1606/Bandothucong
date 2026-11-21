import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import BoxChat from './components/Chat/BoxChat';
import TrangChu from './pages/TrangChu';
import ChiTietSanPham from './pages/ChiTietSanPham';
import DangNhap from './pages/DangNhap';
import QuanTriAdmin from './pages/QuanTriAdmin';
import KenhNguoiBan from './pages/KenhNguoiBan';
import GioHang from './pages/GioHang';
import ThanhToan from './pages/ThanhToan';
import HoSoCaNhan from './pages/HoSoCaNhan';

export default function App() {
  const [taiKhoan, setTaiKhoan] = useState(() => {
    return JSON.parse(localStorage.getItem('tai_khoan')) || null;
  });
  const [shopDangMoChat, setShopDangMoChat] = useState(null);

  return (
    <BrowserRouter>
      <Navbar taiKhoan={taiKhoan} setTaiKhoan={setTaiKhoan} />
      <Routes>
        
        <Route path="/" element={<TrangChu />} />
        <Route
          path="/san-pham/:id"
          element={<ChiTietSanPham taiKhoan={taiKhoan} moChatVoiShop={setShopDangMoChat} />}
          />
        <Route path="/dang-nhap" element={<DangNhap setTaiKhoan={setTaiKhoan} />} />
        <Route path="/gio-hang" element={<GioHang taiKhoan={taiKhoan} />} />
        <Route path="/thanh-toan" element={<ThanhToan taiKhoan={taiKhoan} />} />
        <Route path="/ho-so" element={<HoSoCaNhan taiKhoan={taiKhoan} setTaiKhoan={setTaiKhoan} />} />
        <Route
          path="/kenh-nguoi-ban"
          element={taiKhoan ? <KenhNguoiBan taiKhoan={taiKhoan} /> : <Navigate to="/dang-nhap" />}
        />
        <Route
          path="/admin"
          element={taiKhoan?.vai_tro === 'quan_tri_vien' ? <QuanTriAdmin /> : <Navigate to="/" />}
        />
      </Routes>

      <BoxChat
        taiKhoan={taiKhoan}
        shopDangMoChat={shopDangMoChat}
        setShopDangMoChat={setShopDangMoChat}
      />
    </BrowserRouter>
  );
}