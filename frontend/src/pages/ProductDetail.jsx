import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  
  const { addToCart } = useCart();
  const user = JSON.parse(localStorage.getItem('fighub_user'));

  useEffect(() => {
    // 1. Lấy thông tin sản phẩm
    const fetchData = async () => {
      try {
        const prodRes = await fetch(`http://localhost:8080/api/products/${id}`);
        const prodData = await prodRes.json();
        setProduct(prodData);

        // 2. Lấy danh sách bình luận
        const revRes = await fetch(`http://localhost:8080/api/reviews/product/${id}`);
        const revData = await revRes.json();
        setReviews(revData);
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

    const reviewData = {
      productId: parseInt(id),
      username: user.username,
      comment: newComment,
      rating: rating
    };

    try {
      const response = await fetch("http://localhost:8080/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData)
      });
      if (response.ok) {
        const addedReview = await response.json();
        setReviews([addedReview, ...reviews]); // Cập nhật danh sách hiển thị ngay lập tức
        setNewComment("");
        alert("Cảm ơn bạn đã đánh giá!");
      }
    } catch (error) {
      alert("Lỗi gửi đánh giá!");
    }
  };

  if (loading) return <div className="pt-40 text-center animate-pulse">ĐANG TẢI CHI TIẾT...</div>;
  if (!product) return <div className="pt-40 text-center text-red-500 font-bold uppercase tracking-widest">Sản phẩm không tồn tại!</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen">
      <Link to="/" className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold hover:text-orange-500 mb-10 inline-block">← Trở về</Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Ảnh lớn */}
        <div className="rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
          <img src={product.imageUrl} className="w-full object-cover" alt={product.name} />
        </div>

        {/* Thông tin */}
        <div>
          <span className="bg-orange-600/10 text-orange-500 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">{product.brand}</span>
          <h1 className="text-5xl font-black italic uppercase leading-tight mb-8">{product.name}</h1>
          <div className="text-4xl font-black text-orange-500 italic mb-10">{product.price.toLocaleString()}đ</div>
          
          <button 
            onClick={() => addToCart(product)}
            className="w-full bg-white text-black py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>

      {/* --- PHẦN ĐÁNH GIÁ (REVIEWS) --- */}
      <div className="border-t border-white/5 pt-20">
        <h2 className="text-3xl font-black italic uppercase mb-12 tracking-tighter">Đánh giá từ <span className="text-orange-500">Khách hàng</span></h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Form gửi bình luận (Bên trái) */}
          <div className="lg:col-span-1">
            {user ? (
              <div className="bg-[#161616] p-8 rounded-[32px] border border-white/5">
                <h3 className="text-sm font-bold uppercase mb-6 text-gray-400 tracking-widest italic">Để lại đánh giá của bạn</h3>
                <form onSubmit={handleSendReview} className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} 
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-all ${rating >= star ? 'grayscale-0' : 'grayscale opacity-20'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết cảm nhận của bạn về mô hình này..."
                    className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-orange-500 h-32"
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

          {/* Danh sách bình luận (Bên phải) */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <p className="text-gray-500 italic py-10">Chưa có đánh giá nào cho siêu phẩm này. Hãy là người đầu tiên!</p>
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