import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE, authFetch, getAuthHeaders, getStoredUser, imageUrl } from '../utils/api';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState({});
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await authFetch(`/api/wishlist`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setItems(data);
        const productMap = {};
        await Promise.all(data.map(async (item) => {
          if (!productMap[item.productId]) {
            try {
              const prodRes = await fetch(`${API_BASE}/api/products/${item.productId}`);
              if (prodRes.ok) productMap[item.productId] = await prodRes.json();
            } catch {
              // ignore
            }
          }
        }));
        if (cancelled) return;
        setProducts(productMap);
      } catch {
        toast.error("Lỗi tải danh sách yêu thích!");
      } finally {
        if (!cancelled) setTimeout(() => setLoading(false), 0);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const handleRemove = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Đã xóa khỏi yêu thích!");
        // Refetch wishlist after removal
        const wishRes = await authFetch(`/api/wishlist`);
        if (wishRes.ok) {
          const newData = await wishRes.json();
          setItems(newData);
          const productMap = {};
          await Promise.all(newData.map(async (item) => {
            if (!productMap[item.productId]) {
              try {
                const prodRes = await fetch(`${API_BASE}/api/products/${item.productId}`);
                if (prodRes.ok) productMap[item.productId] = await prodRes.json();
              } catch {
                // ignore
              }
            }
          }));
          setProducts(productMap);
        }
      } else {
        toast.error(data.message || `Lỗi ${res.status}: Không thể xoá`);
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  if (loading) {
    return (
      <div className="pt-40 text-center animate-pulse uppercase tracking-[0.5em] text-orange-500 font-black">
        Đang tải danh sách yêu thích...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-28 min-h-screen">
      <h1 className="text-3xl font-black italic uppercase mb-10">
        Sản phẩm <span className="text-orange-500">Yêu thích</span>
        {items.length > 0 && (
          <span className="text-sm text-gray-500 font-bold ml-4 not-italic">({items.length} sản phẩm)</span>
        )}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/5 rounded-[40px] bg-[#111]">
          <p className="text-gray-500 italic text-sm mb-6 uppercase tracking-widest">
            Bạn chưa yêu thích sản phẩm nào!
          </p>
          <Link
            to="/"
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all"
          >
            Khám phá ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const product = products[item.productId];
            return (
              <div
                key={item.id}
                className="bg-[#161616] rounded-[28px] border border-white/5 overflow-hidden group hover:border-orange-500/30 transition-all flex flex-row"
              >
                {/* Ảnh nhỏ bên trái */}
                <Link to={`/product/${item.productId}`} className="shrink-0 w-[140px] sm:w-[180px] bg-black overflow-hidden">
                  {product?.imageUrl ? (
                    <img
                      src={imageUrl(product.imageUrl)}
                      alt={product?.name}
                      className="w-full h-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full aspect-square flex items-center justify-center text-gray-600 text-xs">
                      Đang tải...
                    </div>
                  )}
                </Link>

                {/* Thông tin bên phải */}
                <div className="flex-1 flex flex-col justify-between p-5 sm:p-6 min-w-0">
                  <div>
                    <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-1">
                      {product?.brand || '...'}
                    </p>
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-bold text-white text-sm sm:text-base hover:text-orange-500 transition line-clamp-2 block"
                    >
                      {product?.name || `Sản phẩm #${item.productId}`}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mt-3 sm:mt-4">
                    <p className="font-black text-orange-500 italic text-lg">
                      {product?.price?.toLocaleString() || '?'}đ
                    </p>
                    <div className="flex items-center gap-3">
                      {product && product.stock > 0 && (
                        <span className="text-[10px] text-gray-600 font-bold">Kho: {product.stock} cái</span>
                      )}
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="w-9 h-9 rounded-full bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center text-sm"
                        title="Xóa khỏi yêu thích"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}