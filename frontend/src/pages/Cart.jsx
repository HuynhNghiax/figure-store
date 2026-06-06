import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { imageUrl } from '../utils/api';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 selection:bg-orange-500 selection:text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-white/[0.02] border border-white/[0.05] rounded-[24px] flex items-center justify-center text-3xl mx-auto transform -rotate-6 shadow-xl">
            📦
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Túi đồ đang trống</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black">
              Hãy nhặt vài tác phẩm xịn xò vào đây nhé!
            </p>
          </div>
          <Link 
            to="/" 
            className="inline-block bg-white text-black px-10 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-lg shadow-white/5"
          >
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-32 pb-24 px-4 sm:px-6 max-w-6xl mx-auto selection:bg-orange-500 selection:text-white">
      {/* Tiêu đề trang */}
      <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 mb-12">
        <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white">
          Túi <span className="text-orange-500">Đồ Của Bạn</span>
        </h1>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
          ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ==================== DANH SÁCH GIỎ HÀNG (BÊN TRÁI) ==================== */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div 
              key={item.id} 
              className="bg-[#0e0e0e] p-5 sm:p-6 rounded-[24px] border border-white/[0.04] flex flex-col sm:flex-row items-center gap-6 group hover:border-white/[0.09] transition-all duration-300 relative overflow-hidden shadow-xl"
            >
              {/* Ảnh sản phẩm */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-black border border-white/[0.05] flex-shrink-0">
                <img 
                  src={imageUrl(item.imageUrl)} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  alt={item.name} 
                />
              </div>

              {/* Thông tin chữ */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-orange-500 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10 font-black">
                  {item.brand || 'Premium'}
                </span>
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-500 transition-colors pt-1">
                  {item.name}
                </h3>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 pt-1">
                  <p className="text-gray-400 font-mono font-black text-sm">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>
                  <span className="text-gray-700 text-xs">•</span>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    Kho: <span className="text-gray-400 font-mono">{item.stock}</span>
                  </p>
                </div>
              </div>

              {/* Bộ tăng giảm số lượng nâng cấp chỉn chu */}
              <div className="flex items-center bg-black rounded-xl p-1 border border-white/[0.08] shadow-inner">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white font-black text-base rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono font-black text-xs text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const ok = updateQuantity(item.id, item.quantity + 1);
                    if (!ok) toast.error(`Chỉ còn đúng ${item.stock} sản phẩm sẵn có!`);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-orange-500 font-black text-base rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  +
                </button>
              </div>

              {/* Nút Xóa sản phẩm thuần SVG tinh tế */}
              <button 
                type="button"
                onClick={() => removeFromCart(item.id)} 
                className="text-gray-600 hover:text-red-500 p-2.5 rounded-xl hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all self-center"
                title="Xóa khỏi túi đồ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* ==================== KHỐI TÓM TẮT ĐƠN HÀNG (BÊN PHẢI) ==================== */}
        <div className="h-fit sticky top-28">
          <div className="bg-[#0e0e0e] p-8 rounded-[32px] border border-white/[0.04] shadow-2xl relative overflow-hidden">
            {/* Hiệu ứng đèn hắt nhẹ góc trên */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
            
            <h2 className="text-base font-black mb-6 italic uppercase tracking-wider text-white border-b border-white/[0.04] pb-4">
              Tóm tắt đơn hàng
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-black uppercase tracking-widest">
                <span>Số lượng phân loại</span>
                <span className="font-mono text-sm text-white bg-white/[0.03] px-2.5 py-0.5 rounded-md border border-white/[0.05]">
                  {cartItems.length} dòng
                </span>
              </div>
              
              <div className="pt-4 border-t border-white/[0.03]">
                <p className="text-gray-500 text-[9px] uppercase font-black tracking-widest mb-1">Tổng chi phí dự tính</p>
                <div className="text-3xl font-black text-orange-500 italic tracking-tight">
                  {totalPrice.toLocaleString('vi-VN')}đ
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="block w-full bg-orange-600 text-white text-center py-4.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-500 shadow-lg shadow-orange-600/10 transition-all active:scale-[0.98]"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}