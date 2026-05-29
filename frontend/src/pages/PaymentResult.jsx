import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const orderId = params.get('orderId');
  const message = params.get('message');

  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">
          {isSuccess ? '✅' : isCancelled ? '↩️' : '❌'}
        </div>
        <h1 className="text-3xl font-black italic uppercase text-white mb-4">
          {isSuccess ? 'Thanh toán thành công' : isCancelled ? 'Đã hủy thanh toán' : 'Thanh toán thất bại'}
        </h1>
        {isCancelled && (
          <p className="text-gray-400 mb-6">Bạn đã hủy thanh toán qua PayPal. Đơn hàng chưa được tạo.</p>
        )}
        {orderId && (
          <p className="text-gray-500 text-sm mb-8">Mã đơn: #FIG-{orderId}</p>
        )}
        {message && !isCancelled && (
          <p className="text-red-400 text-sm mb-8">{message}</p>
        )}
        <div className="flex flex-col gap-4">
          <Link to="/" className="bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">
            Về cửa hàng
          </Link>
          <Link to="/profile" className="text-gray-500 text-[10px] uppercase font-bold hover:text-white">
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
