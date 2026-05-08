import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="pt-60 text-center px-6">
        <h2 className="text-3xl font-black italic uppercase mb-4">Túi đồ đang trống</h2>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-10 font-bold">Hãy nhặt vài con mô hình xịn xò vào đây nhé Luật ơi!</p>
        <Link to="/" className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all">
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <h1 className="text-4xl font-black italic uppercase mb-12">Túi <span className="text-orange-500">Đồ</span></h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Danh sách món hàng */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(item => (
            <div key={item.id} className="bg-[#161616] p-6 rounded-[32px] border border-white/5 flex flex-col sm:flex-row items-center gap-6 group hover:border-white/10 transition-all">
              <img src={item.imageUrl} className="w-24 h-24 rounded-2xl object-cover" alt={item.name} />
              
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{item.brand}</p>
                <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">{item.name}</h3>
                <p className="text-orange-500 font-black italic mt-1">{item.price.toLocaleString()}đ</p>
              </div>

              {/* Bộ điều khiển số lượng */}
              <div className="flex items-center bg-black rounded-xl p-1 border border-white/5">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center font-bold hover:text-orange-500"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center font-bold hover:text-orange-500"
                >
                  +
                </button>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)}
                className="text-gray-600 hover:text-red-500 transition p-2"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Tóm tắt thanh toán */}
        <div className="h-fit sticky top-24">
          <div className="bg-[#161616] p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold mb-8 italic uppercase">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4 mb-10">
              <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span>Số lượng món</span>
                <span className="text-white">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                <span>Phí vận chuyển</span>
                <span className="text-green-500 font-bold italic">FREE</span>
              </div>
              <div className="pt-6">
                <p className="text-gray-500 text-[9px] uppercase font-bold tracking-widest mb-1">Tổng thanh toán</p>
                <div className="text-4xl font-black text-orange-500 italic">
                  {totalPrice.toLocaleString()}đ
                </div>
              </div>
            </div>

            <Link 
              to="/checkout"
              className="block w-full bg-orange-600 text-white text-center py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all active:scale-95"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}