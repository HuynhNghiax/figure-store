import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.message);
    } catch (err) { toast.error("Lỗi kết nối!"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 text-center">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="text-2xl font-black uppercase mb-4 italic">Khôi phục <span className="text-orange-500">Mật khẩu</span></h1>
        <p className="text-gray-500 text-xs mb-8">Nhập tên tài khoản của bạn để nhận mã khôi phục.</p>
        
        <form onSubmit={handleReset} className="space-y-6">
          <input type="text" placeholder="Nhập Username" onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm" required />
          <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Gửi yêu cầu</button>
        </form>
        <Link to="/login" className="mt-8 inline-block text-[10px] text-gray-500 uppercase font-bold hover:text-white transition">← Quay lại đăng nhập</Link>
      </div>
    </div>
  );
}