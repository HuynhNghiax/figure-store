import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE } from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const invalid = useMemo(() => !token, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp!");
    }
    if (newPassword.length < 6) {
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
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
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
        <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 text-center">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-2xl font-black uppercase mb-4 italic">
            Link <span className="text-orange-500">không hợp lệ</span>
          </h1>
          <p className="text-gray-500 text-xs mb-8">
            Link khôi phục không hợp lệ hoặc đã hết hạn.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest"
          >
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 text-center">
        <div className="text-5xl mb-6">🔑</div>
        <h1 className="text-2xl font-black uppercase mb-4 italic">
          Đặt lại <span className="text-orange-500">Mật khẩu</span>
        </h1>

        <p className="text-gray-500 text-xs mb-8">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>

        <Link to="/login" className="mt-8 inline-block text-[10px] text-gray-500 uppercase font-bold hover:text-white transition">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}