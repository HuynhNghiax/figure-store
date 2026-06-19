import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status  = params.get('status');
  const orderId = params.get('orderId');
  const message = params.get('message');

  const isSuccess   = status === 'success';
  const isCancelled = status === 'cancelled';
  const isFailed    = !isSuccess && !isCancelled;

  const [order, setOrder]       = useState(null);
  const [countdown, setCountdown] = useState(isSuccess ? 8 : null);

  // Fetch order summary nếu có orderId và thành công
  useEffect(() => {
    if (orderId && isSuccess) {
      authFetch(`/api/orders/${orderId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setOrder(data))
        .catch(() => {});
    }
  }, [orderId, isSuccess]);

  // Countdown redirect khi success
  useEffect(() => {
    if (!isSuccess || countdown === null) return;
    if (countdown <= 0) {
      window.location.href = `/order/${orderId}`;
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, isSuccess, orderId]);

  const config = isSuccess ? {
    icon: '✅',
    gradient: 'from-green-500/10 via-transparent',
    ring: 'border-green-500/20',
    glow: 'shadow-green-500/10',
    title: 'Thanh toán thành công!',
    sub: 'Đơn hàng của bạn đã được xác nhận và đang được xử lý.',
    titleColor: 'text-green-400',
  } : isCancelled ? {
    icon: '↩️',
    gradient: 'from-gray-500/10 via-transparent',
    ring: 'border-gray-500/20',
    glow: 'shadow-gray-500/10',
    title: 'Đã hủy thanh toán',
    sub: 'Bạn đã hủy quá trình thanh toán PayPal. Đơn hàng chưa được tạo.',
    titleColor: 'text-gray-300',
  } : {
    icon: '❌',
    gradient: 'from-red-500/10 via-transparent',
    ring: 'border-red-500/20',
    glow: 'shadow-red-500/10',
    title: 'Thanh toán thất bại',
    sub: message || 'Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.',
    titleColor: 'text-red-400',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0a]">
      {/* Animated background */}
      <div className={`fixed inset-0 bg-gradient-to-b ${config.gradient} to-transparent pointer-events-none`} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className={`bg-[#111] border ${config.ring} rounded-[40px] p-10 shadow-2xl ${config.glow} text-center`}
          style={{ animation: 'slideUp 0.4s ease-out' }}>

          {/* Icon */}
          <div className="text-7xl mb-6" style={{ animation: isSuccess ? 'bounceIn 0.6s 0.2s both' : 'none' }}>
            {config.icon}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-black italic uppercase mb-3 ${config.titleColor}`}>
            {config.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{config.sub}</p>

          {/* Order ID badge */}
          {orderId && (
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 mb-6">
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Mã đơn</span>
              <span className="text-white font-black text-sm">#FIG-{orderId}</span>
            </div>
          )}

          {/* Order summary (nếu fetch được) */}
          {isSuccess && order && order.items && (
            <div className="bg-black/30 rounded-2xl border border-white/5 p-4 mb-6 text-left space-y-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Tóm tắt đơn hàng</p>
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 truncate flex-1 mr-2">
                    {item.productName || `Sản phẩm #${item.productId}`}
                    <span className="text-gray-600 ml-1">x{item.quantity}</span>
                  </span>
                  <span className="text-white font-bold shrink-0">
                    {(item.price * item.quantity).toLocaleString()}đ
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-[10px] text-gray-600 italic">+{order.items.length - 3} sản phẩm khác...</p>
              )}
              <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Tổng</span>
                <span className="text-orange-400 font-black">{order.totalAmount?.toLocaleString()}đ</span>
              </div>
            </div>
          )}

          {/* Countdown */}
          {isSuccess && orderId && countdown !== null && countdown > 0 && (
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-6">
              Chuyển đến đơn hàng sau{' '}
              <span className="text-orange-400 font-black text-sm">{countdown}s</span>
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 mt-4">
            {isSuccess && orderId ? (
              <Link
                to={`/order/${orderId}`}
                className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20"
              >
                Xem chi tiết đơn hàng →
              </Link>
            ) : isFailed ? (
              <Link
                to="/checkout"
                className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20"
              >
                Thử lại thanh toán
              </Link>
            ) : null}

            <Link
              to="/"
              className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-white/20"
            >
              Về cửa hàng
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.1); }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
