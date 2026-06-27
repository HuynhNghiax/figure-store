import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authFetch, getStoredUser, saveAuth, API_BASE, getAuthHeaders, imageUrl } from '../utils/api';

export default function Profile() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [pwData, setPwData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileData, setProfileData] = useState({ fullName: '', phone: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập!');
      navigate('/login');
      return;
    }

    // Lấy thông tin mới nhất từ server
    authFetch('/api/users/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfileData({
            fullName: data.fullName || '',
            phone:    data.phone    || '',
            email:    data.email    || '',
          });
          // Cập nhật avatarUrl vào state user local
          setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl, email: data.email }));
        }
      })
      .catch(() => {});

    authFetch(`/api/orders/user/${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => { toast.error('Không thể tải đơn hàng!'); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Đổi mật khẩu ----
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) return toast.error('Mật khẩu không khớp!');
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST',
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
    } catch { toast.error('Lỗi kết nối!'); }
  };

  // ---- Cập nhật thông tin cá nhân ----
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Cập nhật thành công!');
        setShowEditProfile(false);
        // Cập nhật email trong localStorage nếu đã thay đổi
        if (data.email) {
          const storedUser = getStoredUser();
          if (storedUser) {
            saveAuth({ id: storedUser.id, username: storedUser.username, role: storedUser.role, email: data.email });
          }
          setUser(prev => ({ ...prev, email: data.email }));
        }
      } else {
        toast.error(data.message || 'Cập nhật thất bại!');
      }
    } catch { toast.error('Lỗi kết nối!'); }
    finally { setSavingProfile(false); }
  };

  // ---- Upload avatar ----
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Chỉ chấp nhận file ảnh!');
    if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh không được vượt quá 5MB!');

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('fighub_token');
      const res = await fetch(`${API_BASE}/api/users/me/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Cập nhật ảnh thành công!');
        setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
      } else {
        toast.error(data.message || 'Upload thất bại!');
      }
    } catch { toast.error('Lỗi upload!'); }
    finally { setUploadingAvatar(false); }
  };

  // ---- Helper: badge trạng thái đơn hàng ----
  const statusConfig = {
    PENDING:   { label: '⏳ Chờ xử lý',      cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    SHIPPED:   { label: '🚚 Đang giao hàng', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    DELIVERED: { label: '📦 Đã giao',         cls: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    COMPLETED: { label: '✓ Hoàn thành',       cls: 'bg-green-500/10 text-green-500 border-green-500/20' },
    CANCELLED: { label: '❌ Đã huỷ',          cls: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };

  if (loading) return <div className="text-center pt-20 text-gray-400 animate-pulse">Đang tải...</div>;

  const avatarSrc = user?.avatarUrl ? imageUrl(user.avatarUrl) : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 min-h-screen animate-in fade-in duration-500">

      {/* ==================== THÔNG TIN TÀI KHOẢN ==================== */}
      <div className="bg-[#161616] p-8 md:p-10 rounded-[40px] border border-white/5 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-orange-600 flex items-center justify-center text-white text-3xl font-black uppercase shadow-lg shadow-orange-600/20 cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
              title="Đổi ảnh đại diện"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0)
              )}
              {/* Overlay khi hover */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <span className="text-white text-xs animate-spin">⟳</span>
                ) : (
                  <span className="text-white text-lg">📷</span>
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">{user?.username}</h1>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">{user?.email}</p>
            {profileData.fullName && (
              <p className="text-xs text-gray-600 mt-0.5">{profileData.fullName}{profileData.phone ? ` · ${profileData.phone}` : ''}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Đơn đã đặt</p>
            <p className="text-2xl font-black text-orange-500 italic">{orders.length} đơn</p>
          </div>
          <button
            onClick={() => setShowEditProfile(!showEditProfile)}
            className="bg-white/5 hover:bg-orange-600/20 border border-white/10 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-all"
          >
            ✏️ Sửa thông tin
          </button>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="bg-white/5 hover:bg-orange-600/20 border border-white/10 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-500 transition-all"
          >
            🔑 Đổi mật khẩu
          </button>
        </div>
      </div>

      {/* ==================== FORM SỬA THÔNG TIN ==================== */}
      {showEditProfile && (
        <div className="bg-[#161616] p-8 rounded-[32px] border border-white/5 mb-6 max-w-lg mx-auto">
          <h3 className="text-sm font-black uppercase mb-6 text-orange-500 italic">Sửa thông tin cá nhân</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1.5">Họ và tên</label>
              <input
                type="text"
                placeholder="Nhập họ tên đầy đủ..."
                value={profileData.fullName}
                onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1.5">Số điện thoại</label>
              <input
                type="tel"
                placeholder="0xxxxxxxxx"
                value={profileData.phone}
                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditProfile(false)}
                className="flex-1 bg-white/5 border border-white/10 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== FORM ĐỔI MẬT KHẨU ==================== */}
      {showChangePassword && (
        <div className="bg-[#161616] p-8 rounded-[32px] border border-white/5 mb-6 max-w-lg mx-auto">
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
            <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all">
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      )}

      {/* ==================== LỊCH SỬ ĐƠN HÀNG ==================== */}
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
          orders.map((order) => {
            const status = statusConfig[order.status] ?? { label: order.status, cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
            return (
              <div key={order.id} className="bg-[#111] p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-white/10 transition-all space-y-6">

                {/* Header đơn */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Mã đơn: <span className="text-orange-500">#FIG-{order.id}</span></p>
                    <p className="text-[10px] text-gray-600 uppercase font-bold mt-1">Người nhận: {order.customerName} · {order.phone}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.cls}`}>
                      {status.label}
                    </span>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return;
                          try {
                            const res = await authFetch(`/api/orders/${order.id}/cancel`, { method: 'PUT' });
                            if (res.ok) {
                              const data = await res.json();
                              toast.success(data.message || 'Đã huỷ đơn!');
                              const ordersRes = await authFetch(`/api/orders/user/${user.id}`);
                              if (ordersRes.ok) setOrders(await ordersRes.json());
                            } else {
                              const errorData = await res.json();
                              toast.error(errorData.message || 'Không thể huỷ đơn!');
                            }
                          } catch { toast.error('Lỗi kết nối với máy chủ!'); }
                        }}
                        className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 px-3 py-1.5 border border-red-500/20 rounded-full transition-all hover:bg-red-500/10"
                      >
                        Huỷ đơn
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600 font-mono text-xs">[{item.quantity}x]</span>
                        <span className="text-white font-medium text-xs">{item.productName || `Sản phẩm #${item.productId}`}</span>
                      </div>
                      <span className="font-bold text-xs">{item.price?.toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>

                {/* Footer đơn */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-white/5 pt-4 text-xs">
                  <p className="text-gray-500 italic">📍 Giao đến: {order.address}</p>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <Link
                      to={`/order/${order.id}`}
                      className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-white border border-orange-500/20 hover:border-orange-500 px-3 py-1.5 rounded-full transition-all hover:bg-orange-500/10"
                    >
                      Xem chi tiết →
                    </Link>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Tổng tiền thanh toán</p>
                      <p className="text-xl font-black text-orange-500 italic mt-0.5">{order.totalAmount?.toLocaleString()}đ</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}