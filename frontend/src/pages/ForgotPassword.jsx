import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../utils/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setStep(2);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp!");
    }
    if (formData.newPassword.length < 6) {
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          otp: formData.otp,
          newPassword: formData.newPassword,
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 text-center">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="text-2xl font-black uppercase mb-4 italic">
          Khôi phục <span className="text-orange-500">Mật khẩu</span>
        </h1>

        {step === 1 ? (
          <>
            <p className="text-gray-500 text-xs mb-8">Nhập tên tài khoản để nhận mã OTP qua email.</p>
            <form onSubmit={handleForgot} className="space-y-6">
              <input
                type="text"
                placeholder="Nhập Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
                required
              />
              <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">
                Gửi mã OTP
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-8">Nhập mã OTP và mật khẩu mới.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="text"
                placeholder="Mã OTP (6 số)"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white text-center tracking-widest"
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
                required
              />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
                required
              />
              <button className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">
                Đổi mật khẩu
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[9px] text-gray-600 uppercase font-bold hover:text-white"
              >
                ← Quay lại
              </button>
            </form>
          </>
        )}

        <Link to="/login" className="mt-8 inline-block text-[10px] text-gray-500 uppercase font-bold hover:text-white transition">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
