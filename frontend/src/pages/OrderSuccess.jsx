import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  
  // 🛡️ Bọc an toàn: Tự động bắt cả 2 kiểu truyền data từ trang Checkout qua (dù là .order hay trực tiếp)
  const orderData = location.state?.order || location.state; 

  if (!orderData) {
    return (
      <div className="pt-40 text-center text-red-500 font-bold">
        <p>Không tìm thấy thông tin đơn hàng!</p>
        <Link to="/" className="text-blue-500 underline text-sm block mt-4">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-screen text-center">
      {/* Header Section */}
      <div className="mb-10">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-lg shadow-green-500/20">
          ✓
        </div>
        <h1 className="text-4xl font-black italic uppercase mb-2">
          Đặt hàng <span className="text-green-500">Thành công</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Mã đơn hàng của bạn: #FIG-{orderData.id || 'N/A'}
        </p>
      </div>

      {/* Thông tin đơn hàng COD gọn gàng */}
      <div className="max-w-xl mx-auto bg-[#161616] p-10 rounded-[50px] border border-white/5 space-y-6 shadow-xl">
        <div className="text-4xl mx-auto">🚚</div>
        
        <h2 className="text-xl font-bold italic uppercase text-white">Thanh toán khi nhận hàng (COD)</h2>
        
        <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
          Hệ thống đã ghi nhận đơn hàng thành công và đang chuẩn bị đóng gói gửi đến bạn. 
          Bạn sẽ thanh toán bằng tiền mặt trực tiếp cho nhân viên bưu tá khi nhận được gói hàng. 
          Vui lòng chú ý điện thoại trong những ngày tới nhé!
        </p>
        
        <div className="p-6 bg-black rounded-2xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Số tiền cần chuẩn bị sẵn</p>
          <p className="text-3xl font-black text-orange-500 italic">
            {orderData.totalAmount ? orderData.totalAmount.toLocaleString('vi-VN') : '0'}đ
          </p>
        </div>
      </div>

      {/* Điều hướng chân trang */}
      <div className="mt-12 flex justify-center gap-6">
        <Link 
          to="/" 
          className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-md"
        >
          Quay về cửa hàng
        </Link>
        <Link 
          to="/profile" 
          className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
        >
          Xem lịch sử đơn
        </Link>
      </div>
    </div>
  );
}