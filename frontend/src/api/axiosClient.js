import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bandothucong.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const taiKhoan = JSON.parse(localStorage.getItem('tai_khoan'));
  if (taiKhoan?.token) {
    config.headers.Authorization = `Bearer ${taiKhoan.token}`;
  }
  return config;
});

export default axiosClient;