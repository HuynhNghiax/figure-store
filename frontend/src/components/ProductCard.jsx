import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { imageUrl } from '../utils/api';

export default function ProductCard({ item }) {
  const { addToCartWithCheck } = useCart();

  // BƯỚC 1: KIỂM TRA TRẠNG THÁI TỒN KHO TỪ ĐÂY
  const isOutOfStock = item.stock <= 0; // Nếu stock = 0 thì là hết hàng

  const handleAddToCart = (product) => {
    // Chặn an toàn thêm một lần nữa ở Frontend, dù nút đã bị disabled
    if (isOutOfStock) {
      toast.error("Mô hình này đã cháy hàng rồi Nghĩa ơi! Đừng cố đấm ăn xôi 😢");
      return;
    }
    // Nếu còn hàng thì thêm vào giỏ như bình thường
    const ok = addToCartWithCheck(product, (msg) => toast.error(msg));
    if (ok) toast.success(`Đã thêm ${product.name} vào giỏ hàng thành công!`);
  };

  return (
    <div className="bg-[#111] rounded-[32px] border border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all relative">
      
      {/* 1. Phần Ảnh sản phẩm + Tag trạng thái */}
      <div className="relative aspect-square bg-black overflow-hidden">
        <img 
          src={imageUrl(item.imageUrl)} 
          alt={item.name} 
          // BƯỚC 2: NẾU HẾT HÀNG THÌ LÀM MỜ VÀ BLUR ẢNH ĐI
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${isOutOfStock ? 'opacity-30 blur-[1px]' : ''}`} 
        />
        
        {/* HIỂN THỊ TAG TRẠNG THÁI TƯƠNG ỨNG */}
        {isOutOfStock ? (
          // Tag Đỏ: Cháy hàng
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg z-10">
            Cháy hàng 
          </div>
        ) : item.isPreOrder ? (
          // Tag Xanh: Hàng Pre-order (giữ nguyên logic cũ của bạn nếu có)
          <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg z-10">
            Pre-Order
          </div>
        ) : null}
      </div>

      {/* 2. Phần Thông tin chữ nghĩa */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">{item.brand}</p>
          <Link 
            to={`/product/${item.id}`} 
            className="font-bold text-white text-sm hover:text-orange-500 transition line-clamp-2"
          >
            {item.name}
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-lg font-black italic text-orange-500">{item.price?.toLocaleString()}đ</span>
            {/* Hiển thị số lượng kho cho khách xem luôn */}
            <span className="text-[10px] text-gray-600 font-bold shrink-0">Kho: {item.stock} cái</span>
          </div>

          {/* BƯỚC 3: THAY ĐỔI NÚT MUA THEO TRẠNG THÁI TỒN KHO */}
          <button
            onClick={() => handleAddToCart(item)}
            // VÔ HIỆU HÓA (DISABLE) NÚT BẤM KHI HẾT HÀNG
            disabled={isOutOfStock} 
            // ĐỔI MÀU SẮC THEO TRẠNG THÁI (HẾT HÀNG -> XÁM VIỀN TRONG)
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed' // Style khi hết hàng
                : 'bg-white text-black hover:bg-orange-600 hover:text-white shadow-lg active:scale-95' // Style khi còn hàng
            }`}
          >
            {/* THAY ĐỔI CHỮ HIỂN THỊ TRÊN NÚT */}
            {isOutOfStock ? '❌ HẾT HÀNG' : '🛒 THÊM VÀO GIỎ'}
          </button>
        </div>
      </div>
    </div>
  );
}