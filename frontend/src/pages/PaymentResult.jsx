import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const orderId = params.get('orderId');

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">{isSuccess ? '✅' : status === 'failed' ? '❌' : '⚠️'}</div>
        <h1 className="text-3xl font-black italic uppercase text-white mb-4">
          {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
        </h1>
        {orderId && (
          <p className="text-gray-500 text-sm mb-8">Mã đơn: #FIG-{orderId}</p>
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
