import { useState, useEffect, useRef } from 'react';
import ProductCard from '../components/ProductCard';
import { API_BASE } from '../utils/api';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const itemsPerPage = 8;

  // Sử dụng useRef để nhận biết người dùng đổi trang hay đổi bộ lọc tìm kiếm
  const isInitialOrFilterChange = useRef(true);

  // Cơ chế kiểm soát Reset trang khi bộ lọc thay đổi trực tiếp
  useEffect(() => {
    setCurrentPage(1);
    isInitialOrFilterChange.current = true;
  }, [searchTerm, selectedBrand]);

  // Bộ máy Fetch dữ liệu chính
  useEffect(() => {
    setLoading(true);
    
    const params = new URLSearchParams({
      page: String(currentPage - 1),
      size: String(itemsPerPage),
    });
    if (searchTerm) params.set('search', searchTerm);
    if (selectedBrand !== 'All') params.set('brand', selectedBrand);

    fetch(`${API_BASE}/api/products?${params}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.content || data);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements ?? (data.content?.length || 0));
        setLoading(false);

        // 🎯 CHỈ CUỘN LÊN ĐẦU DANH SÁCH KHI BẤM CHUYỂN TRANG
        if (!isInitialOrFilterChange.current) {
          const productListSection = document.getElementById('product-list-container');
          if (productListSection) {
            productListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        
        // Trả trạng thái về false sau khi lượt fetch hoàn tất
        isInitialOrFilterChange.current = false;
      })
      .catch(() => setLoading(false));
  }, [currentPage, searchTerm, selectedBrand]);

  const brands = ['All', 'Sega', 'Furyu', 'Taito', 'MegaHouse', 'Banpresto'];

  return (
    <div className="min-h-screen bg-black text-gray-100 pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto selection:bg-orange-500 selection:text-white">
      
      {/* ==================== BANNER KHU VỰC ĐẦU TRANG ==================== */}
      <div className="relative h-[260px] md:h-[380px] rounded-[32px] md:rounded-[48px] overflow-hidden mb-16 shadow-2xl border border-white/[0.03]">
        <img
          src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=2070&auto=format&fit=crop"
          className="w-full h-full object-cover opacity-80 filter brightness-90 grayscale-[20%] group-hover:scale-105 transition-transform duration-700"
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
        
        {/* ==================== THANH BỘ LỌC (SIDEBAR) ==================== */}
        <aside className="w-full lg:w-60 shrink-0 space-y-8 bg-[#0e0e0e] p-6 rounded-3xl border border-white/[0.04] shadow-xl">
          {/* Tìm kiếm */}
          <div className="space-y-2">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Tìm kiếm sản phẩm</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên mô hình..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/[0.08] rounded-xl px-4 py-3 text-xs focus:border-orange-500 outline-none transition-colors text-white"
              />
            </div>
          </div>

          {/* Danh mục hãng */}
          <div className="space-y-2">
            <h3 className="text-gray-500 font-black uppercase tracking-widest text-[9px] italic">Thương hiệu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
              {brands.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
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
        </aside>

        {/* ==================== DANH SÁCH MÔ HÌNH (BÊN PHẢI) ==================== */}
        <div className="flex-1 w-full">
          
          {/* Header trạng thái tải ngầm */}
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${
                loading ? 'opacity-40 pointer-events-none' : 'opacity-100'
              }`}>
                {products.map(item => <ProductCard key={item.id} item={item} />)}
              </div>

              {/* Thanh điều hướng phân trang (Pagination) */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                    disabled={currentPage === 1} 
                    className="w-10 h-10 rounded-xl bg-[#0e0e0e] border border-white/[0.06] disabled:opacity-20 hover:border-white/[0.2] transition text-sm font-bold text-white flex items-center justify-center disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => {
                        isInitialOrFilterChange.current = false; // Bấm nút trang => Cho phép cuộn
                        setCurrentPage(i + 1);
                      }} 
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
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
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