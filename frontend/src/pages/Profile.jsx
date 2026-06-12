import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authFetch, getStoredUser, API_BASE, getAuthHeaders } from '../utils/api';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();

  // Quan trọng: Chỉ lấy user một lần để tránh làm React hiểu lầm là user thay đổi liên tục
  const [user] = useState(getStoredUser());

  useEffect(() => {
    // 1. Kiểm tra đăng nhập
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      navigate("/login");
      return;
    }

    // 2. Gọi API danh sách đơn hàng
    // Dependency [user.id] đảm bảo hàm này chỉ chạy 1 lần duy nhất khi load trang
    const fetchOrders = async () => {
      try {
        const res = await authFetch(`/api/orders/user/${user.id}`);
        if (!res.ok) throw new Error("Lỗi tải đơn hàng");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải đơn hàng!");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]); // Đã ổn định hơn

  // Hàm xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) return toast.error("Mật khẩu không khớp!");

    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword: pwData.oldPassword, newPassword: pwData.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setShowChangePassword(false);
        setPwData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message);
      }
    } catch { toast.error("Lỗi kết nối!"); }
  };

  if (loading) return <div className="text-center pt-20">Đang tải...</div>;

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
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Đơn hàng đã đặt</p>
            <p className="text-2xl font-black text-orange-500 italic">{orders.length} đơn</p>
          </div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="bg-white/5 hover:bg-orange-600/20 border border-white/10 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-all"
          >
            🔑 Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* Form đổi mật khẩu */}
      {showChangePassword && (
        <div className="bg-[#161616] p-8 rounded-[32px] border border-white/5 mb-12 max-w-lg mx-auto">
          <h3 className="text-sm font-black uppercase mb-6 text-orange-500 italic">Đổi mật khẩu</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={pwData.oldPassword}
              onChange={e => setPwData({ ...pwData, oldPassword: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={pwData.newPassword}
              onChange={e => setPwData({ ...pwData, newPassword: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={pwData.confirmPassword}
              onChange={e => setPwData({ ...pwData, confirmPassword: e.target.value })}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
              required
              minLength={6}
            />
            <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      )}

      {/* Danh sách lịch sử đơn hàng */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-8">
          Lịch sử <span className="text-orange-500">Mua hàng</span>
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-[40px] bg-[#111]">
            <p className="text-gray-500 italic text-sm mb-6 uppercase tracking-widest">Bạn chưa đặt đơn hàng nào!</p>
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

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : // Thêm dòng này
                          'bg-green-500/10 text-green-500 border-green-500/20' // Đã hoàn thành
                    }`}>
                    {order.status === 'PENDING' ? '⏳ Chờ xử lý' :
                      order.status === 'SHIPPED' ? '🚚 Đang giao hàng' :
                        order.status === 'CANCELLED' ? '❌ Đã huỷ' : // Thêm dòng này
                          '✓ Đã hoàn thành'}
                  </span>
                  {order.status === 'PENDING' && (
                    // Tìm đoạn onClick trong hàm map orders và sửa lại như sau:
                    <button
                      onClick={async () => {
                        if (!window.confirm("Bạn có chắc muốn huỷ đơn hàng này?")) return;
                        try {
                          // SỬA ĐỔI: Sử dụng authFetch thay vì fetch thuần
                          // authFetch tự động gắn Token vào header giúp bạn
                          const res = await authFetch(`/api/orders/${order.id}/cancel`, {
                            method: "PUT",
                          });

                          if (res.ok) {
                            const data = await res.json();
                            toast.success(data.message || "Đã huỷ đơn!");

                            // Refresh lại danh sách đơn hàng sau khi hủy thành công
                            const ordersRes = await authFetch(`/api/orders/user/${user.id}`);
                            if (ordersRes.ok) {
                              const updatedOrders = await ordersRes.json();
                              setOrders(updatedOrders);
                            }
                          } else {
                            const errorData = await res.json();
                            toast.error(errorData.message || "Không thể huỷ đơn!");
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error("Lỗi kết nối với máy chủ!");
                        }
                      }}
                      className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 px-3 py-1.5 border border-red-500/20 rounded-full transition-all hover:bg-red-500/10"
                    >
                      Huỷ đơn
                    </button>
                  )}
                </div>
              </div>

              {/* Thân đơn hàng: Danh sách các món đồ */}
              <div className="space-y-3">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-xs">[{item.quantity}x]</span>
                      <span className="text-white font-medium text-xs">
                        {item.productName || `Sản phẩm #${item.productId}`}
                      </span>
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