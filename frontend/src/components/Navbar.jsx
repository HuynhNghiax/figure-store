import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getStoredUser, clearAuth } from '../utils/api';

export default function Navbar() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setUser(getStoredUser());
    }, 0);
  }, [location]);
  
  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="w-9 h-9 bg-orange-600 rounded-lg rotate-12 flex items-center justify-center font-black">
            <span className="text-white -rotate-12">F</span>
          </div>
          <span className="text-xl font-black italic text-white uppercase">
            FIG<span className="text-orange-500">HUB</span>
          </span>
        </Link>

        {/* Menu */}
        <div className="hidden md:flex space-x-8 text-[11px] uppercase tracking-widest font-bold items-center">
          <Link to="/" className="text-gray-400 hover:text-orange-500 transition">Cửa hàng</Link>
          
          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="text-orange-500 hover:text-white flex items-center gap-1">
              <span className="animate-pulse">●</span> Dashboard
            </Link>
          )}

          {user && user.role !== 'ADMIN' && (
            <Link to="/profile" className="text-blue-400 hover:text-white flex items-center gap-1">
              👤 Trang cá nhân
            </Link>
          )}
        </div>

        {/* Auth & Cart */}
        <div className="flex items-center space-x-5">
          {user && (
            <Link to="/wishlist" className="text-white text-lg hover:text-orange-500 transition" title="Yêu thích">
              🤍
            </Link>
          )}
          <Link to="/cart" className="relative text-white text-xl">
             🛒 
             {totalItems > 0 && (
               <span className="absolute -top-2 -right-3 bg-orange-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] font-bold">
                  {totalItems}
               </span>
             )}
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Chào mừng,</p>
                  <p className="text-xs font-black text-white">{user.username}</p>
               </div>
               <button 
                onClick={handleLogout}
                className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl font-bold text-[10px] hover:bg-red-500 hover:text-white transition-all"
               >
                THOÁT
               </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-white text-black px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}