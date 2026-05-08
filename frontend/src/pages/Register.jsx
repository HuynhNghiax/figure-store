import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Xác thực OTP
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    otp: '' 
  });
  const navigate = useNavigate();

  // BƯỚC 1: XỬ LÝ ĐĂNG KÝ
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Kiểm tra nhanh ở Frontend trước khi gọi API
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Mật khẩu không khớp, kiểm tra lại đi Nghĩa!");
    }

    if (formData.password.length < 6) {
      return toast.error("Mật khẩu ngắn quá, ít nhất 6 ký tự nhé!");
    }

    const loading = toast.loading("Hệ thống đang kiểm tra thông tin...");
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formData.username, 
          email: formData.email, 
          password: formData.password 
        })
      });
      
      const data = await response.json();
      toast.dismiss(loading); // Tắt cái loading ngay khi có kết quả

      // CHỖ NÀY QUAN TRỌNG: Chỉ chuyển trang khi response là OK (200)
      if (response.ok) {
        toast.success("Mã OTP đã "bay" vào Gmail của bạn!");
        setFormData(prev => ({ ...prev, otp: '' })); // Xóa trắng rác trong ô OTP
        setStep(2); // Chỉ lúc này mới cho qua trang OTP
      } else {
        // Nếu lỗi (400, 500, trùng tên, lỗi mail...) thì ở lại Step 1
        toast.error(data.message || "Có lỗi xảy ra, nhập lại thông tin nhé!");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Server đang ngủ gật rồi, kiểm tra lại Backend đi Nghĩa!");
    }
  };

  // BƯỚC 2: XÁC THỰC OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    const loading = toast.loading("Đang xác thực mã...");
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formData.username, 
          otp: formData.otp 
        })
      });
      
      const data = await response.json();
      toast.dismiss(loading);

      if (response.ok) {
        toast.success("Kích hoạt thành công! Đăng nhập thôi.");
        navigate("/login");
      } else {
        // Nhập sai OTP thì ở lại trang OTP để nhập lại, không cho về Step 1
        toast.error(data.message || "Mã sai rồi, kiểm tra lại trong Mail nhé!");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Lỗi xác thực, thử lại sau nhé!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#161616] p-10 rounded-[40px] border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black italic uppercase mb-10 text-center text-white">
          {step === 1 ? 'Đăng ký' : 'Xác thực'} <span className="text-orange-500">FigHub</span>
        </h1>

        {step === 1 ? (
          /* TRANG NHẬP THÔNG TIN (STEP 1) */
          <form onSubmit={handleRegister} className="space-y-5">
            <input 
              type="text" 
              placeholder="Tên tài khoản (Username)" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white" 
              required 
            />
            <input 
              type="email" 
              placeholder="Gmail nhận mã OTP" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white" 
              required 
            />
            <input 
              type="password" 
              placeholder="Mật khẩu" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white" 
              required 
            />
            <input 
              type="password" 
              placeholder="Xác nhận lại mật khẩu" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white" 
              required 
            />
            <button className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg active:scale-95">
              Nhận mã OTP qua Mail
            </button>
          </form>
        ) : (
          /* TRANG NHẬP OTP (STEP 2) */
          <form onSubmit={handleVerify} className="space-y-6 text-center">
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-[0.2em] font-bold">
              Gửi đến: <span className="text-white lowercase">{formData.email}</span>
            </p>
            <input 
              type="text" 
              placeholder="Mã 6 số" 
              maxLength="6" 
              value={formData.otp}
              autoComplete="off"
              onChange={(e) => setFormData({...formData, otp: e.target.value})} 
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-center text-3xl font-black tracking-[0.5em] text-orange-500" 
              required 
            />
            <button className="w-full bg-green-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl active:scale-95">
              Xác nhận tài khoản
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="text-[9px] text-gray-600 uppercase font-bold hover:text-white transition"
            >
              ← Quay lại sửa thông tin
            </button>
          </form>
        )}

        <div className="mt-10 text-center">
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
            Đã có tài khoản? <Link to="/login" className="text-orange-500 ml-2 hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}