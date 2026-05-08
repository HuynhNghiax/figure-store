import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Thống kê', path: '/admin/dashboard', icon: '📊' },
    { name: 'Đơn hàng', path: '/admin/orders', icon: '📋' },
    { name: 'Sản phẩm', path: '/admin/products', icon: '📦' },
    { name: 'Khách hàng', path: '/admin/users', icon: '👤' }, // Đã thêm mục này
  ];

  const handleLogout = () => {
    localStorage.removeItem('fighub_user');
    navigate("/");
  };

  return (
    <div className="w-64 bg-[#111] h-screen sticky top-0 border-r border-white/5 flex flex-col p-6">
      <div className="mb-10 px-2">
        <h2 className="text-xl font-black italic uppercase text-orange-500 tracking-tighter">
          FigHub <span className="text-white text-xs block font-medium not-italic tracking-widest opacity-50">Admin Panel</span>
        </h2>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                isActive 
                ? 'bg-orange-600 text-white shadow-lg' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout} className="mt-auto text-left px-4 py-3 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 rounded-2xl transition-all">
        🚪 Thoát quản trị
      </button>
    </div>
  );
}