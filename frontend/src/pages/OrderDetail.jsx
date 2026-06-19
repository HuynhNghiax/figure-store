import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authFetch, imageUrl } from '../utils/api';

const STATUS_MAP = {
  PENDING:    { label: 'Chờ xử lý',    color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/20' },
  CONFIRMED:  { label: 'Đã xác nhận',  color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  SHIPPED:    { label: 'Đang giao',     color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20' },
  DELIVERED:  { label: 'Đã giao',      color: 'text-green-400',   bg: 'bg-green-400/10 border-green-400/20' },
  COMPLETED:  { label: 'Hoàn thành',   color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  CANCELLED:  { label: 'Đã huỷ',       color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
};

export default function OrderDetail() {
  const { id }    = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    document.title = `Đơn hàng #FIG-${id} — FigHub`;
    authFetch(`/api/orders/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
    return () => { document.title = 'FigHub — Cửa hàng mô hình anime cao cấp'; };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này?')) return;
    setCancelling(true);
    try {
      const res = await authFetch(`/api/orders/${id}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        setOrder(prev => ({ ...prev, status: 'CANCELLED' }));
        alert('Đã huỷ đơn hàng thành công!');
      } else {
        alert(data.message || 'Không thể huỷ đơn hàng.');
      }
    } catch {
      alert('Lỗi kết nối!');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-28 pb-24 px-4 max-w-3xl mx-auto">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-white/5 rounded-2xl w-1/3" />
          <div className="h-48 bg-white/5 rounded-3xl" />
          <div className="h-32 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black pt-28 pb-24 px-4 max-w-3xl mx-auto text-center">
        <p className="text-gray-500 italic text-sm">Không tìm thấy đơn hàng này.</p>
        <Link to="/profile" className="text-orange-500 text-xs font-bold uppercase tracking-widest mt-4 inline-block">← Quay lại tài khoản</Link>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' };
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-24 px-4 max-w-3xl mx-auto space-y-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
        <Link to="/profile" className="hover:text-orange-500 transition">Tài khoản</Link>
        <span>/</span>
        <span className="text-white">Đơn #{id}</span>
      </div>

      {/* Header card */}
      <div className="bg-[#111] rounded-[32px] border border-white/5 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Mã đơn hàng</p>
            <h1 className="text-2xl font-black italic text-orange-500">#FIG-{order.id}</h1>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${status.bg} ${status.color} w-fit`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ngày đặt</p>
            <p className="text-xs font-bold text-white">{createdAt}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Thanh toán</p>
            <p className="text-xs font-bold text-white">
              {order.paymentMethod === 'paypal' ? '💳 PayPal' : '💵 COD'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Trạng thái TT</p>
            <p className={`text-xs font-bold ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
              {order.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Địa chỉ giao hàng</p>
          <p className="text-sm text-white">{order.customerName} • {order.phone}</p>
          <p className="text-xs text-gray-400 mt-0.5">{order.address}</p>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-[#111] rounded-[32px] border border-white/5 overflow-hidden">
        <div className="px-8 py-4 border-b border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Sản phẩm đặt mua</h2>
        </div>
        <div className="divide-y divide-white/5">
          {(order.items || []).map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 px-8 py-5">
              {item.imageUrl && (
                <img src={imageUrl(item.imageUrl)} className="w-14 h-14 rounded-xl object-cover border border-white/10 bg-black shrink-0" alt="" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{item.productName}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">x{item.quantity}</p>
              </div>
              <p className="font-black italic text-orange-500 text-sm shrink-0">
                {(item.price * item.quantity)?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>

        {/* Tổng tiền */}
        <div className="px-8 py-6 border-t border-white/5 flex justify-between items-center bg-black/20">
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">Tổng thanh toán</span>
          <span className="text-2xl font-black italic text-orange-500">{order.totalAmount?.toLocaleString()}đ</span>
        </div>
      </div>

      {/* Nút huỷ */}
      {order.status === 'PENDING' && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        >
          {cancelling ? 'Đang huỷ...' : '✕ Huỷ đơn hàng này'}
        </button>
      )}

      <Link to="/profile" className="block text-center text-[10px] uppercase tracking-widest text-gray-500 hover:text-orange-500 transition font-bold">
        ← Quay lại tài khoản
      </Link>
    </div>
  );
}
