import { useState, useEffect, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { API_BASE } from '../utils/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 8;

  // Sử dụng useRef để nhận biết người dùng đổi trang hay đổi bộ lọc tìm kiếm
  const isInitialOrFilterChange = useRef(true);

  // Cơ chế kiểm soát Reset trang khi bộ lọc thay đổi trực tiếp
  const handleSearchChange = (value) => {
    isInitialOrFilterChange.current = true;
    setSearchTerm(value);
    setCurrentPage(1); 
  };

  const handleBrandSelect = (brandId) => {
    isInitialOrFilterChange.current = true;
    setSelectedBrand(brandId);
    setCurrentPage(1); 
  };

  const handlePriceFilter = (min, max) => {
    isInitialOrFilterChange.current = true;
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    isInitialOrFilterChange.current = true;
    setSortBy(value);
    setCurrentPage(1);
  };

  // Bộ máy Fetch dữ liệu chính
  useEffect(() => {
    const startFetching = () => {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(currentPage - 1),
        size: String(itemsPerPage),
        sortBy,
      });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedBrand !== 'All') params.set('brand', selectedBrand);
      if (minPrice !== '') params.set('minPrice', minPrice);
      if (maxPrice !== '') params.set('maxPrice', maxPrice);

      fetch(`${API_BASE}/api/products?${params}`)
        .then(res => {
          if (!res.ok) throw new Error('Network response error');
          return res.json();
        })
        .then(data => {
          setProducts(data.content || data || []);
          setTotalPages(data.totalPages || 1);
          setTotalElements(data.totalElements ?? (data.content?.length || 0));
          setLoading(false);

          if (!isInitialOrFilterChange.current) {
            const productListSection = document.getElementById('product-list-container');
            if (productListSection) {
              productListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }

          isInitialOrFilterChange.current = false;
        })
        .catch((err) => {
          console.error("Lỗi fetch dữ liệu:", err);
          setProducts([]);
          setLoading(false);
          isInitialOrFilterChange.current = false;
        });
    };

    startFetching();
  }, [currentPage, searchTerm, selectedBrand, minPrice, maxPrice, sortBy]);

  const brands = ['All', 'Sega', 'Furyu', 'Taito', 'MegaHouse', 'Banpresto'];

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto selection:bg-orange-500 selection:text-white">

      {/* ==================== BANNER ==================== */}
      <div className="relative h-[260px] md:h-[380px] rounded-[32px] md:rounded-[48px] overflow-hidden mb-16 shadow-2xl border border-white/[0.03]">
        <img
          src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=2070&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-80 filter brightness-90 grayscale-[20%]"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent flex flex-col justify-center px-8 md:px-16 space-y-2">
          <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-md border border-orange-500/20 w-fit">
            Authentic Figures Store
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase leading-tight tracking-tighter">
            Thế giới <br /> <span className="text-orange-500">Mô hình cao cấp</span>
          </h1>
        </div>
      </div>

      {/* BỐ CỤC CHÍNH */}
      <div id="product-list-container" className="flex flex-col lg:flex-row gap-10 items-start scroll-mt-28">

        {/* ==================== SIDEBAR ==================== */}
        <aside className="w-full lg:w-60 shrink-0 space-y-8 bg-[#0e0e0e] p-6 rounded-3xl border border-white/[0.04] shadow-xl">

          {/* Tìm kiếm */}
          <div className="space-y-2">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Tìm kiếm sản phẩm</h3>
            <input
              type="text"
              placeholder="Nhập tên mô hình..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-black border border-white/[0.08] rounded-xl px-4 py-3 text-xs focus:border-orange-500 outline-none transition-colors text-white"
            />
          </div>

          {/* Thương hiệu */}
          <div className="space-y-2">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Thương hiệu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
              {brands.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleBrandSelect(brand)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedBrand === brand
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10'
                      : 'text-gray-400 bg-black/40 border border-white/[0.03] hover:border-white/[0.1] hover:text-white'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Khoảng giá */}
          <div className="space-y-3">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Khoảng giá</h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Từ"
                value={minPrice}
                onChange={e => handlePriceFilter(e.target.value, maxPrice)}
                min="0"
                className="w-1/2 bg-black border border-white/[0.08] rounded-xl px-3 py-2.5 text-[10px] font-bold focus:border-orange-500 outline-none transition-colors text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <input
                type="number"
                placeholder="Đến"
                value={maxPrice}
                onChange={e => handlePriceFilter(minPrice, e.target.value)}
                min="0"
                className="w-1/2 bg-black border border-white/[0.08] rounded-xl px-3 py-2.5 text-[10px] font-bold focus:border-orange-500 outline-none transition-colors text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {/* Preset nhanh */}
            <div className="grid grid-cols-1 gap-1">
              {[
                { label: 'Dưới 500k', min: '', max: '500000' },
                { label: '500k – 1 triệu', min: '500000', max: '1000000' },
                { label: '1 – 2 triệu', min: '1000000', max: '2000000' },
                { label: 'Trên 2 triệu', min: '2000000', max: '' },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePriceFilter(p.min, p.max)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    minPrice === p.min && maxPrice === p.max
                      ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                      : 'text-gray-500 bg-black/40 border border-white/[0.03] hover:border-white/[0.1] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {(minPrice !== '' || maxPrice !== '') && (
              <button
                type="button"
                onClick={() => handlePriceFilter('', '')}
                className="w-full text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
              >
                × Xóa bộ lọc giá
              </button>
            )}
          </div>

          {/* Sắp xếp */}
          <div className="space-y-2">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Sắp xếp theo</h3>
            <div className="space-y-1.5">
              {[
                { value: 'newest', label: '🕒 Mới nhất' },
                { value: 'price_asc', label: '↑ Giá thấp → cao' },
                { value: 'price_desc', label: '↓ Giá cao → thấp' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSortChange(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === opt.value
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 bg-black/40 border border-white/[0.03] hover:border-white/[0.1] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ==================== DANH SÁCH SẢN PHẨM ==================== */}
        <div className="flex-1 w-full">

          {/* Header trạng thái */}
          <div className="h-4 mb-6 relative">
            {loading ? (
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest animate-pulse italic absolute top-0 left-0">
                ⚡ Đang bóc hộp dữ liệu mô hình...
              </p>
            ) : (
              products.length > 0 && (
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest absolute top-0 left-0">
                  Tìm thấy <span className="text-white font-mono">{totalElements}</span> tác phẩm trưng bày
                </p>
              )
            )}
          </div>

          {/* Lưới sản phẩm & Phân trang */}
          {products.length > 0 ? (
            <>
              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
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
            !loading && (
              <div className="py-24 text-center border border-dashed border-white/[0.06] rounded-[32px] bg-[#0c0c0c] max-w-lg mx-auto">
                <span className="text-3xl block mb-4">🔍</span>
                <p className="text-gray-500 italic text-xs tracking-widest uppercase font-black">
                  Không tìm thấy mô hình nào phù hợp bộ lọc!
                </p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}