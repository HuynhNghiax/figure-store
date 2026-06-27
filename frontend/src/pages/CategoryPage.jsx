import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { API_BASE } from '../utils/api';

export default function CategoryPage() {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 8;
  const isInitialOrFilterChange = useRef(true);

  // Lấy tên danh mục
  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then(res => res.json())
      .then(data => {
        const cat = data.find(c => String(c.id) === String(id));
        setCategoryName(cat ? cat.name : 'Danh mục');
        document.title = `${cat ? cat.name : 'Danh mục'} — FigHub`;
      })
      .catch(() => setCategoryName('Danh mục'));

    return () => { document.title = 'FigHub — Cửa hàng mô hình anime cao cấp'; };
  }, [id]);

  // Fetch sản phẩm theo danh mục
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage - 1),
      size: String(itemsPerPage),
      sortBy,
      categoryId: id,
    });
    if (searchTerm) params.set('search', searchTerm);

    fetch(`${API_BASE}/api/products?${params}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements ?? 0);
        setLoading(false);
        if (!isInitialOrFilterChange.current) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        isInitialOrFilterChange.current = false;
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
        isInitialOrFilterChange.current = false;
      });
  }, [id, currentPage, searchTerm, sortBy]);

  const handleSearch = (val) => {
    isInitialOrFilterChange.current = true;
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSort = (val) => {
    isInitialOrFilterChange.current = true;
    setSortBy(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest">
        <Link to="/" className="text-gray-500 hover:text-orange-500 transition-colors">Trang chủ</Link>
        <span className="text-gray-700">›</span>
        <span className="text-orange-500">{categoryName}</span>
      </div>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
          Danh mục <span className="text-orange-500">{categoryName}</span>
        </h1>
        {!loading && (
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-3">
            {totalElements} sản phẩm
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <input
          type="text"
          placeholder="Tìm trong danh mục..."
          value={searchTerm}
          onChange={e => handleSearch(e.target.value)}
          className="flex-1 bg-[#0e0e0e] border border-white/[0.08] rounded-xl px-4 py-3 text-xs focus:border-orange-500 outline-none transition-colors text-white"
        />
        <div className="flex gap-2">
          {[
            { value: 'newest', label: '🕒 Mới nhất' },
            { value: 'price_asc', label: '↑ Giá tăng' },
            { value: 'price_desc', label: '↓ Giá giảm' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSort(opt.value)}
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                sortBy === opt.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-[#0e0e0e] text-gray-400 border border-white/[0.06] hover:border-white/[0.15] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#0e0e0e] rounded-[28px] aspect-square animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {products.map(item => <ProductCard key={item.id} item={item} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-2">
              <button
                type="button"
                onClick={() => { isInitialOrFilterChange.current = false; setCurrentPage(p => Math.max(p - 1, 1)); }}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-[#0e0e0e] border border-white/[0.06] disabled:opacity-20 hover:border-white/[0.2] transition text-sm font-bold text-white flex items-center justify-center disabled:cursor-not-allowed"
              >
                ←
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { isInitialOrFilterChange.current = false; setCurrentPage(i + 1); }}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    currentPage === i + 1
                      ? 'bg-orange-600 text-white shadow-orange-600/20 shadow-lg'
                      : 'bg-[#0e0e0e] text-gray-500 border border-white/[0.04] hover:border-white/[0.1] hover:text-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => { isInitialOrFilterChange.current = false; setCurrentPage(p => Math.min(p + 1, totalPages)); }}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-[#0e0e0e] border border-white/[0.06] disabled:opacity-20 hover:border-white/[0.2] transition text-sm font-bold text-white flex items-center justify-center disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-24 text-center border border-dashed border-white/[0.06] rounded-[32px] bg-[#0c0c0c] max-w-lg mx-auto">
          <span className="text-3xl block mb-4">📦</span>
          <p className="text-gray-500 italic text-xs tracking-widest uppercase font-black">
            Chưa có sản phẩm trong danh mục này!
          </p>
          <Link to="/" className="mt-6 inline-block text-orange-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
            ← Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
}
