import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  useEffect(() => {
    fetch("http://localhost:8080/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setFilteredProducts(data);
        setLoading(false);
      })
      .catch(err => console.error("Lỗi:", err));
  }, []);

  useEffect(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedBrand !== 'All') {
      result = result.filter(p => p.brand === selectedBrand);
    }
    setFilteredProducts(result);
    setCurrentPage(1); 
  }, [searchTerm, selectedBrand, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const brands = ['All', 'Bandai', 'Good Smile', 'Hot Toys', 'MegaHouse', 'Banpresto'];

  if (loading) return <div className="pt-40 text-center animate-pulse uppercase tracking-[0.5em] text-orange-500 font-black italic">Đang bóc hộp mô hình...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      {/* Banner */}
      <div className="relative h-[300px] md:h-[400px] rounded-[50px] overflow-hidden mb-16 group shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8 md:px-16">
          <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase leading-tight">
            Thế giới <br /> <span className="text-orange-500">Mô hình</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 space-y-10">
          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 italic opacity-50">Tìm kiếm</h3>
            <input 
              type="text" 
              placeholder="Tên mô hình..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161616] border border-white/5 rounded-2xl px-5 py-3 text-sm focus:border-orange-500 outline-none transition-all"
            />
          </div>

          <div>
            <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 italic opacity-50">Thương hiệu</h3>
            <div className="space-y-2">
              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`w-full text-left px-5 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                    selectedBrand === brand ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Danh sách */}
        <div className="flex-1">
          {currentItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
                {currentItems.map(item => <ProductCard key={item.id} item={item} />)}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-12 h-12 rounded-xl border border-white/10 disabled:opacity-20 cursor-pointer hover:bg-white/10 transition">←</button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-12 h-12 rounded-xl text-xs font-black transition ${currentPage === i + 1 ? 'bg-orange-600 text-white shadow-orange-600/20 shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-12 h-12 rounded-xl border border-white/10 disabled:opacity-20 cursor-pointer hover:bg-white/10 transition">→</button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/5 rounded-[40px]">
              <p className="text-gray-500 italic text-xs tracking-widest uppercase font-bold">Không tìm thấy sản phẩm nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}