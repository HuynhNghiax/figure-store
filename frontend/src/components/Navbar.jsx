import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import { getStoredUser, clearAuth } from '../utils/api';

export default function Navbar() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setUser(getStoredUser());
    }, 0);
  }, [location]);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group shrink-0">
          <div className="w-9 h-9 bg-orange-600 rounded-lg rotate-12 flex items-center justify-center font-black">
            <span className="text-white -rotate-12">F</span>
          </div>
          <span className="text-xl font-black italic text-white uppercase">
            FIG<span className="text-orange-500">HUB</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 text-[11px] uppercase tracking-widest font-bold items-center">
          <Link to="/" className="text-gray-400 hover:text-orange-500 transition">Cửa hàng</Link>

          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="text-orange-500 hover:text-white flex items-center gap-1">
              <span className="animate-pulse">●</span> Dashboard
            </Link>
          )}

          {user && user.role !== 'ADMIN' && (
            <>
              <Link to="/wishlist" className="text-gray-400 hover:text-orange-500 transition">❤️ Yêu thích</Link>
              <Link to="/profile" className="text-gray-400 hover:text-orange-500 transition">👤 Tài khoản</Link>
            </>
          )}
        </div>

        {/* Desktop Right — Cart + Auth */}
        <div className="hidden md:flex items-center space-x-5">
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
              className="bg-white text-black px-5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>

        {/* Mobile Right — Cart + Hamburger */}
        <div className="flex md:hidden items-center gap-4">
          <Link to="/cart" className="relative text-white text-xl">
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-orange-600 text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0a0a0a] font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            id="hamburger-btn"
            onClick={() => setMenuOpen(prev => !prev)}
            className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-white/5 transition-all"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#0e0e0e] border-t border-white/5 px-6 py-4 space-y-1">

          {user && (
            <div className="flex items-center gap-3 py-3 border-b border-white/5 mb-3">
              <div className="w-9 h-9 bg-orange-600 rounded-full flex items-center justify-center text-white font-black uppercase text-sm">
                {user.username?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black text-white">{user.username}</p>
                <p className="text-[10px] text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          <Link to="/" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
            🏠 Cửa hàng
          </Link>

          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-orange-500 hover:bg-orange-500/10 transition-all">
              ⚡ Admin Dashboard
            </Link>
          )}

          {user && user.role !== 'ADMIN' && (
            <>
              <Link to="/wishlist" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                ❤️ Yêu thích
              </Link>
              <Link to="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                👤 Tài khoản & Đơn hàng
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-white/5 mt-3">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
              >
                Đăng xuất
              </button>
            ) : (
              <Link
                to="/login"
                className="block text-center py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}