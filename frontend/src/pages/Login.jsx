import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('fighub_user', JSON.stringify(data));
        toast.success(`Chào mừng trở lại, ${data.username}!`);
        navigate(data.role === 'ADMIN' ? "/admin/dashboard" : "/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Lỗi Server! Hãy kiểm tra kết nối Backend.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic uppercase text-white">Đăng nhập <span className="text-orange-500">FigHub</span></h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Tiếp tục hành trình sưu tầm</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="text" 
            placeholder="Username" 
            onChange={(e) => setCredentials({...credentials, username: e.target.value})} 
            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setCredentials({...credentials, password: e.target.value})} 
            className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm" 
            required 
          />
          
          <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
            Vào kho hàng
          </button>
        </form>

        <p className="mt-10 text-center text-xs text-gray-500 uppercase font-bold">
          Chưa có tài khoản? <Link to="/register" className="text-orange-500 ml-2 hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}