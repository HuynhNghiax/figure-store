import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authFetch, getStoredUser } from '../utils/api';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Nếu chưa đăng nhập thì đá về trang login
    if (!user) {
      toast.error("Vui lòng đăng nhập để xem lịch sử đơn hàng!");
      navigate("/login");
      return;
    }

    // Gọi API lấy đơn hàng theo UserId của khách
    authFetch(`/api/orders/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể lấy dữ liệu đơn hàng");
        return res.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Lỗi tải danh sách đơn hàng!");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return <div className="pt-40 text-center animate-pulse uppercase tracking-[0.5em] text-orange-500 font-black">Đang lục tìm đơn hàng của bạn...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 min-h-screen animate-in fade-in duration-500">
      
      {/* Thông tin tài khoản */}
      <div className="bg-[#161616] p-8 md:p-10 rounded-[40px] border border-white/5 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-black uppercase shadow-lg shadow-orange-600/20">
            {user?.username?.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">{user?.username}</h1>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Thành viên hạng kim cương</p>
          </div>
        </div>
        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Đơn hàng đã đặt</p>
          <p className="text-2xl font-black text-orange-500 italic">{orders.length} đơn</p>
        </div>
      </div>

      {/* Danh sách lịch sử đơn hàng */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-8">
          Lịch sử <span className="text-orange-500">Mua hàng</span>
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-[40px] bg-[#111]">
            <p className="text-gray-500 italic text-sm mb-6 uppercase tracking-widest">Nghĩa ơi, bạn chưa đặt đơn hàng nào hết!</p>
            <Link to="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all">
              Mua sắm ngay thôi
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-[#111] p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-white/10 transition-all space-y-6">
              
              {/* Đầu đơn hàng: Mã đơn & Trạng thái */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Mã đơn: <span className="text-orange-500">#FIG-{order.id}</span></p>
                  <p className="text-[10px] text-gray-600 uppercase font-bold mt-1">Người nhận: {order.customerName} • {order.phone}</p>
                </div>
                
                {/* Trạng thái hiển thị màu sắc chuyên nghiệp */}
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                  order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                  'bg-green-500/10 text-green-500 border-green-500/20'
                }`}>
                  {order.status === 'PENDING' ? '⏳ Chờ xử lý' : 
                   order.status === 'SHIPPED' ? '🚚 Đang giao hàng' : 
                   '✓ Đã hoàn thành'}
                </span>
              </div>

              {/* Thân đơn hàng: Danh sách các món đồ */}
              <div className="space-y-3">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-xs">[{item.quantity}x]</span>
                      <span className="text-white font-medium text-xs">Sản phẩm mã số #{item.productId}</span>
                    </div>
                    <span className="font-bold text-xs">{item.price?.toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              {/* Chân đơn hàng: Địa chỉ giao & Tổng tiền */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/5 pt-4 text-xs">
                <p className="text-gray-500 italic">📍 Giao đến: {order.address}</p>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Tổng tiền thanh toán</p>
                  <p className="text-xl font-black text-orange-500 italic mt-0.5">{order.totalAmount?.toLocaleString()}đ</p>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}