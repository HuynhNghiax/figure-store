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

  const isValidPhone = (phone) => {
    return /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone);
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
      totalAmount: totalPrice,
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

          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest italic pt-4">Phương thức thanh toán</h3>
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
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Tổng số tiền thanh toán</p>
          <div className="text-6xl font-black text-orange-500 mb-10 italic">{totalPrice.toLocaleString()}đ</div>
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
