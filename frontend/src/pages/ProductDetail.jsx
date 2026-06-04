import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { API_BASE, authFetch, getStoredUser, getAuthHeaders, imageUrl } from '../utils/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const { addToCartWithCheck } = useCart();
  const user = getStoredUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await fetch(`${API_BASE}/api/products/${id}`);
        if (!prodRes.ok) {
          setProduct(null);
          return;
        }
        const prodData = await prodRes.json();
        setProduct(prodData);

        const revRes = await fetch(`${API_BASE}/api/reviews/product/${id}`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(revData);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSendReview = async (e) => {
    e.preventDefault();
    if (!newComment) return;

    try {
      const response = await authFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: parseInt(id),
          comment: newComment,
          rating: rating
        })
      });
      if (response.ok) {
        const addedReview = await response.json();
        setReviews([addedReview, ...reviews]);
        setNewComment("");
        toast.success("Cảm ơn bạn đã đánh giá!");
      } else {
        const data = await response.json();
        toast.error(data.message || "Lỗi gửi đánh giá!");
      }
    } catch {
      toast.error("Lỗi gửi đánh giá!");
    }
  };

  const allImages = (() => {
    if (!product) return [];
    const main = imageUrl(product.imageUrl);
    let extras = [];
    try {
      if (product.images) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) extras = parsed;
      }
    } catch (error) {
      console.error(error);
    }
    return [main, ...extras.map(u => imageUrl(u))];
  })();

  const goToPrev = () => {
    setCurrentImgIndex(i => (i === 0 ? allImages.length - 1 : i - 1));
  };

  const goToNext = () => {
    setCurrentImgIndex(i => (i === allImages.length - 1 ? 0 : i + 1));
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen animate-pulse">
      <div className="h-4 bg-white/5 rounded w-24 mb-10"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        <div className="rounded-[40px] bg-[#111] aspect-square"></div>
        <div className="space-y-6">
          <div className="h-6 bg-white/5 rounded-full w-24"></div>
          <div className="h-12 bg-white/5 rounded w-3/4"></div>
          <div className="h-10 bg-white/5 rounded w-1/3"></div>
          <div className="h-4 bg-white/5 rounded w-1/2"></div>
          <div className="h-16 bg-white/5 rounded-2xl w-full mt-8"></div>
        </div>
      </div>
      <div className="border-t border-white/5 pt-20">
        <div className="h-8 bg-white/5 rounded w-72 mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1">
            <div className="bg-[#161616] rounded-[32px] p-8 h-48"></div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[#111] rounded-[32px] p-8 h-28"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (!product) return <div className="pt-40 text-center text-red-500 font-bold uppercase tracking-widest">Sản phẩm không tồn tại!</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <Link to="/" className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold hover:text-orange-500 mb-10 inline-block">← Trở về</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Image Slider */}
        <div>
          <div className="rounded-[40px] overflow-hidden border border-white/5 shadow-2xl relative bg-black group">
            <img
              key={currentImgIndex}
              src={allImages[currentImgIndex]}
              className="w-full object-cover aspect-square"
              alt={product.name}
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-orange-600 transition text-lg opacity-0 group-hover:opacity-100"
                >
                  ←
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-orange-600 transition text-lg opacity-0 group-hover:opacity-100"
                >
                  →
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImgIndex ? 'bg-orange-500 w-4' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImgIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentImgIndex ? 'border-orange-500 opacity-100' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between">
            <div>
              <span className="bg-orange-600/10 text-orange-500 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">{product.brand}</span>
              <h1 className="text-5xl font-black italic uppercase leading-tight mb-8">{product.name}</h1>
            </div>
            {user && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/wishlist`, {
                      method: "POST",
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ productId: product.id })
                    });
                    const data = await res.json();
                    if (res.ok) toast.success("Đã thêm vào yêu thích!");
                    else toast.error(data.message);
                  } catch { toast.error("Lỗi kết nối!"); }
                }}
                className="text-2xl hover:scale-110 transition-transform"
                title="Yêu thích"
              >
                🤍
              </button>
            )}
          </div>
          <div className="text-4xl font-black text-orange-500 italic mb-4">{product.price.toLocaleString()}đ</div>
          <p className="text-gray-500 text-sm mb-6">Còn {product.stock} sản phẩm trong kho</p>
          {product.description && (
            <p className="text-gray-400 text-sm leading-relaxed mb-6 border-l-2 border-orange-500/30 pl-4 italic">
              {product.description}
            </p>
          )}

          <button
            onClick={() => {
              const ok = addToCartWithCheck(product, (msg) => toast.error(msg));
              if (ok) toast.success('Đã thêm vào giỏ!');
            }}
            disabled={product.stock <= 0}
            className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-40"
          >
            {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
          </button>
        </div>
      </div>

      <div className="border-t border-white/5 pt-20">
        <h2 className="text-3xl font-black italic uppercase mb-12 tracking-tighter">Đánh giá từ <span className="text-orange-500">Khách hàng</span></h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1">
            {user ? (
              <div className="bg-[#161616] p-8 rounded-[32px] border border-white/5">
                <h3 className="text-sm font-bold uppercase mb-6 text-gray-400 tracking-widest italic">Để lại đánh giá của bạn</h3>
                <form onSubmit={handleSendReview} className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setRating(star)} className={`text-2xl transition-all ${rating >= star ? 'grayscale-0' : 'grayscale opacity-20'}`}>⭐</button>
                    ))}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết cảm nhận của bạn về mô hình này..."
                    className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 h-32 text-white"
                  />
                  <button className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all">
                    Gửi bình luận
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#161616] p-10 rounded-[32px] border border-dashed border-white/10 text-center">
                <p className="text-gray-500 text-xs italic mb-6">Bạn cần đăng nhập để đánh giá mô hình này.</p>
                <Link to="/login" className="text-orange-500 font-bold uppercase text-[10px] tracking-widest underline underline-offset-8">Đăng nhập ngay</Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500 italic py-10">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="bg-[#111] p-8 rounded-[32px] border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-white uppercase text-xs tracking-widest mb-1">{rev.username}</h4>
                      <div className="flex text-[10px]">
                        {[...Array(rev.rating)].map((_, i) => <span key={i}>⭐</span>)}
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 font-bold uppercase">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed italic">"{rev.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}