import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem('fighub_user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Lấy đơn hàng của riêng User này từ API
    fetch(`http://localhost:8080/api/orders/user/${user.id}`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 min-h-screen">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Thông tin hồ sơ */}
        <div className="md:w-1/3">
          <div className="bg-[#161616] p-10 rounded-[40px] border border-white/5 text-center">
            <div className="w-24 h-24 bg-orange-600 rounded-full mx-auto flex items-center justify-center text-4xl mb-6 shadow-lg shadow-orange-600/20">👤</div>
            <h2 className="text-2xl font-black italic uppercase mb-2">{user?.username}</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">Thành viên FigHub</p>
            <div className="space-y-3">
               <button className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase hover:bg-white/10 transition">Sửa thông tin</button>
               <button className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase hover:bg-white/10 transition">Đổi mật khẩu</button>
            </div>
          </div>
        </div>

        {/* Lịch sử đơn hàng */}
        <div className="md:w-2/3">
          <h3 className="text-2xl font-black italic uppercase mb-8">Đơn hàng của <span className="text-orange-500">tôi</span></h3>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-gray-500 italic py-10 border border-dashed border-white/10 rounded-[32px] text-center">Bạn chưa mua con Gundam nào cả...</p>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-[#161616] p-6 rounded-[32px] border border-white/5 flex items-center justify-between hover:border-white/10 transition-all group">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Mã đơn #FIG-{order.id}</p>
                    <p className="text-lg font-black text-white">{order.totalAmount?.toLocaleString()}đ</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-[9px] text-gray-600 mt-2 font-bold italic">Xem chi tiết →</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}