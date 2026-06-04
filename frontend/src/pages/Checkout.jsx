import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE, getAuthHeaders, getStoredUser } from '../utils/api';

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState({
    customerName: '',
    phone: '',
    address: ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);

  const isValidPhone = (phone) => {
    return /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone);
  };

  const finalPrice = totalPrice - (totalPrice * couponDiscount / 100);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return toast.error("Vui lòng nhập mã giảm giá!");
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode })
      });
      const data = await res.json();
      if (res.ok) {
        setCouponDiscount(data.discountPercent);
        setCouponApplied(data);
        toast.success(`Áp dụng mã giảm ${data.discountPercent}% thành công!`);
      } else {
        toast.error(data.message);
        setCouponDiscount(0);
        setCouponApplied(null);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  const handleConfirmOrder = async () => {
    if (!customer.customerName || !customer.phone || !customer.address) {
      toast.error("Vui lòng nhập đủ thông tin giao hàng!");
      return;
    }
    if (!isValidPhone(customer.phone)) {
      toast.error("Số điện thoại không hợp lệ! Phải là số điện thoại Việt Nam 10 số (03, 05, 07, 08, 09)");
      return;
    }

    const orderData = {
      ...customer,
      userId: user ? user.id : null,
      totalAmount: finalPrice,
      paymentMethod,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (response.ok) {
        if (paymentMethod === 'PAYPAL' && result.approvalUrl) {
          toast.success("Chuyển sang PayPal...");
          clearCart();
          window.location.href = result.approvalUrl;
          return;
        }
        toast.success("Đặt hàng thành công!");
        clearCart();
        navigate("/order-success", { state: { order: result.order || result } });
      } else {
        toast.error(result.message || result.error || "Không thể đặt hàng!");
      }
    } catch {
      toast.error("Lỗi hệ thống, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <h1 className="text-3xl font-black italic uppercase mb-10">Thanh toán đơn hàng</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-[#161616] p-10 rounded-[40px] border border-white/5 space-y-6">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest italic">Người nhận hàng</h3>
          <input onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })} type="text" placeholder="Họ và tên" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white" />
          <input onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} type="text" placeholder="Số điện thoại" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white" />
          <textarea onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Địa chỉ nhận mô hình" rows="3" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white"></textarea>

          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest italic">Phương thức thanh toán</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('COD')}
              className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition ${paymentMethod === 'COD' ? 'bg-orange-600 border-orange-600 text-white' : 'border-white/10 text-gray-500'}`}
            >
              COD — Thanh toán khi nhận
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('PAYPAL')}
              className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition ${paymentMethod === 'PAYPAL' ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/10 text-gray-500'}`}
            >
              PayPal — Thẻ quốc tế
            </button>
          </div>
        </div>

        <div className="bg-orange-600/5 border border-orange-600/20 p-10 rounded-[40px] h-fit flex flex-col items-center">
          {/* Mã giảm giá */}
          <div className="w-full mb-6">
            <h3 className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Mã giảm giá</h3>
            <div className="flex gap-3">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                placeholder="Nhập mã giảm giá..."
                className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 text-white text-sm"
              />
              <button
                onClick={handleApplyCoupon}
                className="bg-green-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-green-600 transition"
              >
                Áp dụng
              </button>
            </div>
            {couponApplied && (
              <p className="text-green-500 text-[10px] font-bold mt-2">
                ✅ Giảm {couponDiscount}% (mã: {couponApplied.code})
              </p>
            )}
          </div>

          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">
            {couponDiscount > 0 ? 'Tổng tiền hàng' : 'Tổng số tiền thanh toán'}
          </p>
          {couponDiscount > 0 && (
            <div className="text-center mb-2">
              <div className="text-2xl font-black text-gray-500 line-through italic">{totalPrice.toLocaleString()}đ</div>
            </div>
          )}
          <div className="text-5xl font-black text-orange-500 mb-8 italic">{finalPrice.toLocaleString()}đ</div>

          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : paymentMethod === 'PAYPAL' ? 'Thanh toán PayPal' : 'Xác nhận đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}