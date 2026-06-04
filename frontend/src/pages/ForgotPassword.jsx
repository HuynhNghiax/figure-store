import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setSent(true);
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

        {!sent ? (
          <>
            <p className="text-gray-500 text-xs mb-8">
              Nhập email đã đăng ký để nhận link khôi phục mật khẩu.<br />
              Link có hiệu lực trong <strong className="text-orange-500">5 phút</strong> và chỉ dùng được <strong className="text-orange-500">1 lần</strong>.
            </p>
            <form onSubmit={handleForgot} className="space-y-6">
              <input
                type="email"
                placeholder="Nhập Email đã đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
                required
              />
              <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">
                Gửi link khôi phục
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              ✅ Link khôi phục đã được gửi về email của bạn!
            </p>
            <p className="text-gray-500 text-xs">
              Vui lòng kiểm tra hộp thư (bao gồm mục Spam) và nhấp vào link trong email để đặt lại mật khẩu.
            </p>
          </div>
        )}

        <Link to="/login" className="mt-8 inline-block text-[10px] text-gray-500 uppercase font-bold hover:text-white transition">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}