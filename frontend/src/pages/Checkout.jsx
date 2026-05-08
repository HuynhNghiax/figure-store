import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Import thư viện thông báo mới

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('fighub_user'));
  
  const [customer, setCustomer] = useState({
    customerName: '',
    phone: '',
    address: ''
  });

  const handleConfirmOrder = async () => {
    if (!customer.customerName || !customer.phone || !customer.address) {
      toast.error("Vui lòng nhập đủ thông tin giao hàng!");
      return;
    }

    const orderData = {
      ...customer,
      userId: user ? user.id : null,
      totalAmount: totalPrice,
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const response = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Đặt hàng thành công!");
        clearCart();
        // Chuyển sang trang Success kèm dữ liệu đơn hàng
        navigate("/order-success", { state: { order: result } });
      }
    } catch (error) {
      toast.error("Lỗi hệ thống, vui lòng thử lại!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <h1 className="text-3xl font-black italic uppercase mb-10">Thanh toán đơn hàng</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-[#161616] p-10 rounded-[40px] border border-white/5 space-y-6">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest italic">Người nhận hàng</h3>
          <input name="customerName" onChange={(e) => setCustomer({...customer, customerName: e.target.value})} type="text" placeholder="Họ và tên" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500" />
          <input name="phone" onChange={(e) => setCustomer({...customer, phone: e.target.value})} type="text" placeholder="Số điện thoại" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500" />
          <textarea name="address" onChange={(e) => setCustomer({...customer, address: e.target.value})} placeholder="Địa chỉ nhận mô hình" rows="3" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500"></textarea>
        </div>
        
        <div className="bg-orange-600/5 border border-orange-600/20 p-10 rounded-[40px] h-fit flex flex-col items-center">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Tổng số tiền thanh toán</p>
          <div className="text-6xl font-black text-orange-500 mb-10 italic">{totalPrice.toLocaleString()}đ</div>
          <button 
            onClick={handleConfirmOrder}
            className="w-full bg-orange-600 text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95"
          >
            Xác nhận đặt hàng ngay
          </button>
        </div>
      </div>
    </div>
  );
}