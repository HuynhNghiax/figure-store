import { useLocation, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const orderData = location.state?.order; // Nhận dữ liệu đơn hàng từ trang Checkout gửi qua

  if (!orderData) return <div className="pt-40 text-center">Không tìm thấy thông tin đơn hàng!</div>;

  // Cấu hình VietQR: Bạn thay số tài khoản và ngân hàng thật của bạn vào đây
  const BANK_ID = "MB"; // Ví dụ: MB, VCB, ICB...
  const ACCOUNT_NO = "0123456789"; // Số tài khoản của Nghĩa
  const ACCOUNT_NAME = "NGUYEN VAN NGHIA"; // Tên chủ tài khoản
  
  // Link tạo QR tự động từ VietQR API
  const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${orderData.totalAmount}&addInfo=THANH TOAN DON HANG FIG-${orderData.id}&accountName=${ACCOUNT_NAME}`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 min-h-screen text-center">
      <div className="mb-10">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-green-500/20">✓</div>
        <h1 className="text-4xl font-black italic uppercase mb-2">Đặt hàng <span className="text-green-500">Thành công</span></h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Mã đơn hàng của bạn: #FIG-{orderData.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-[#161616] p-10 rounded-[50px] border border-white/5">
        {/* Bên trái: Thông báo */}
        <div className="text-left space-y-6">
          <h2 className="text-xl font-bold italic uppercase">Quét mã để thanh toán</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Hệ thống đã ghi nhận đơn hàng. Bạn vui lòng quét mã QR bên cạnh để hoàn tất thanh toán. 
            Nội dung chuyển khoản đã được tạo sẵn bên trong mã.
          </p>
          <div className="p-6 bg-black rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Số tiền cần trả</p>
            <p className="text-3xl font-black text-orange-500 italic">{orderData.totalAmount?.toLocaleString()}đ</p>
          </div>
        </div>

        {/* Bên phải: Mã QR */}
        <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
          <img src={qrUrl} alt="VietQR" className="w-full max-w-[280px] mx-auto" />
          <p className="mt-4 text-[10px] text-black font-black uppercase tracking-tighter">Quét bằng ứng dụng Ngân hàng / MoMo</p>
        </div>
      </div>

      <div className="mt-12 flex justify-center gap-6">
        <Link to="/" className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 hover:text-white transition-all">Quay về cửa hàng</Link>
        <Link to="/profile" className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Xem lịch sử đơn</Link>
      </div>
    </div>
  );
}