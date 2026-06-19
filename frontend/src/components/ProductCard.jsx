import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE, getAuthHeaders, getStoredUser, imageUrl } from '../utils/api';

export default function ProductCard({ item }) {
  const { addToCartWithCheck } = useCart();
  const user = getStoredUser();
  const [isFavorited, setIsFavorited] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const isOutOfStock = item.stock <= 0;

  useEffect(() => {
    // Fetch avg rating
    fetch(`${API_BASE}/api/reviews/product/${item.id}/avg`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setAvgRating(d.avgRating); setReviewCount(d.reviewCount); } })
      .catch(() => {});

    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wishlist`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          const found = data.some(w => w.productId === item.id);
          setIsFavorited(found);
        }
      } catch {
        // ignore
      }
    })();
  }, [user, item.id]);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Vui lòng đăng nhập để yêu thích!");

    try {
      if (isFavorited) {
        const res = await fetch(`${API_BASE}/api/wishlist/${item.id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setIsFavorited(false);
          toast.success("Đã xoá khỏi yêu thích!");
        } else {
          toast.error(data.message || `Lỗi ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/wishlist`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ productId: item.id })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setIsFavorited(true);
          toast.success("Đã thêm vào yêu thích!");
        } else {
          toast.error(data.message || `Lỗi ${res.status}`);
        }
      }
    } catch { toast.error("Lỗi kết nối!"); }
  };

  const handleAddToCart = (product) => {
    if (isOutOfStock) {
      toast.error("Mô hình này hiện đã hết hàng!");
      return;
    }
    const ok = addToCartWithCheck(product, (msg) => toast.error(msg));
    if (ok) toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="bg-[#111] rounded-[32px] border border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all relative">
      
      <Link to={`/product/${item.id}`} className="relative aspect-square bg-black overflow-hidden block">
        <img 
          src={imageUrl(item.imageUrl)} 
          alt={item.name} 
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${isOutOfStock ? 'opacity-30 blur-[1px]' : ''}`} 
        />
        
        {user && (
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-all z-10 ${
              isFavorited ? 'bg-red-600/80' : 'bg-black/60 backdrop-blur-md'
            }`}
            title={isFavorited ? "Bỏ yêu thích" : "Yêu thích"}
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
        )}

        {isOutOfStock ? (
          <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg z-10">
            Hết hàng 
          </div>
        ) : item.isPreOrder ? (
          <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg z-10">
            Pre-Order
          </div>
        ) : null}
      </Link>

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
            <span className="text-[10px] text-gray-600 font-bold shrink-0">Kho: {item.stock} cái</span>
          </div>

          {/* Rating trung bình */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={`text-xs ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                ))}
              </div>
              <span className="text-[10px] text-gray-500 font-bold">{avgRating.toFixed(1)} ({reviewCount})</span>
            </div>
          )}
          <button
            onClick={() => handleAddToCart(item)}
            disabled={isOutOfStock}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                : 'bg-white text-black hover:bg-orange-600 hover:text-white shadow-lg active:scale-95'
            }`}
          >
            {isOutOfStock ? '❌ HẾT HÀNG' : '🛒 THÊM VÀO GIỎ'}
          </button>
        </div>
      </div>
    </div>
  );
}