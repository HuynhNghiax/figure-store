import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { API_BASE, getAdminHeaders, getToken, imageUrl } from '../../utils/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [formData, setFormData] = useState({ 
    id: null, 
    name: '', 
    price: '', 
    brand: 'Bandai', 
    imageUrl: '', 
    images: '', 
    stock: 10, 
    isPreOrder: false,
    description: ''
  });
  const [brandInputMode, setBrandInputMode] = useState('select');
  const [extraImages, setExtraImages] = useState([]);

  const fetchProducts = () => {
    fetch(`${API_BASE}/api/products/admin`, { headers: getAdminHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải sản phẩm');
        return res.json();
      })
      .then(data => {
        const list = data.content || data;
        setProducts(list);
        setFilteredProducts(list);
      })
      .catch(() => toast.error('Lỗi tải danh sách sản phẩm!'));
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedBrand !== 'All') {
      result = result.filter(p => p.brand === selectedBrand);
    }
    setTimeout(() => {
      setFilteredProducts(result);
      setCurrentPage(1);
    }, 0);
  }, [searchTerm, selectedBrand, products]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleOpenEdit = (product) => {
    setFormData({ ...product, images: product.images || '' });
    try {
      setExtraImages(product.images ? JSON.parse(product.images) : []);
    } catch {
      setExtraImages([]);
    }
    setIsEdit(true);
    setShowModal(true);
  };

  const handleExtraImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const loadingToast = toast.loading(`Đang tải ${files.length} ảnh phụ...`);
    const uploadedUrls = [];

    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE}/api/products/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        const result = await response.json();
        if (response.ok) uploadedUrls.push(result.imageUrl);
      } catch (error){
        console.error(error);

      }
    }

    toast.dismiss(loadingToast);
    if (uploadedUrls.length > 0) {
      const newExtras = [...extraImages, ...uploadedUrls];
      setExtraImages(newExtras);
      setFormData(prev => ({ ...prev, images: JSON.stringify(newExtras) }));
      toast.success(`Đã thêm ${uploadedUrls.length} ảnh phụ!`);
    }
  };

  const removeExtraImage = (index) => {
    const newExtras = extraImages.filter((_, i) => i !== index);
    setExtraImages(newExtras);
    setFormData(prev => ({ ...prev, images: JSON.stringify(newExtras) }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    setUploading(true);
    const loadingToast = toast.loading("Đang đẩy file ảnh lên hệ thống...");

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/products/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data
      });
      const result = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
        toast.success("Tải ảnh thành công!");
      } else {
        toast.error(result.message || "Tải ảnh thất bại!");
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Lỗi kết nối Server!");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.imageUrl) {
      return toast.error("Vui lòng tải ảnh lên trước khi lưu mô hình!");
    }

    const url = isEdit
      ? `${API_BASE}/api/products/${formData.id}`
      : `${API_BASE}/api/products`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAdminHeaders(),
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          stock: Number(formData.stock),
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "Cập nhật thành công!" : "Đã thêm hàng mới!");
        setShowModal(false);
        setIsEdit(false);
        setBrandInputMode('select');
        setFormData({ id: null, name: '', price: '', brand: 'Bandai', imageUrl: '', stock: 10, isPreOrder: false });
        fetchProducts();
      } else {
        if (typeof result === 'object') {
          Object.values(result).forEach(msg => toast.error(msg));
        } else {
          toast.error("Lỗi hệ thống, vui lòng kiểm tra lại!");
        }
      }
    } catch {
      toast.error("Không thể kết nối đến Backend!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa mô hình này?")) {
      try {
        const response = await fetch(`${API_BASE}/api/products/${id}`, {
          method: "DELETE",
          headers: getAdminHeaders(),
        });
        if (response.ok) {
          toast.success("Đã xóa khỏi kho!");
          fetchProducts();
        } else {
          toast.error("Không thể xóa sản phẩm này vì nó đang nằm trong lịch sử đơn hàng của khách!");
        }
      } catch {
        toast.error("Lỗi xóa sản phẩm!");
      }
    }
  };

  const brands = ['Bandai', 'Good Smile', 'Hot Toys', 'MegaHouse', 'Banpresto'];
  const filterBrands = ['All', ...brands];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <h1 className="text-3xl font-black italic uppercase text-white">Kho <span className="text-orange-500">Sản phẩm</span></h1>
        <button 
          onClick={() => { 
            setIsEdit(false); 
            setBrandInputMode('select');
            setFormData({ id: null, name: '', price: '', brand: 'Bandai', imageUrl: '', stock: 10, isPreOrder: false });
            setShowModal(true); 
          }} 
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 shrink-0"
        >
          + Thêm mô hình mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-[#161616] p-6 rounded-[24px] border border-white/5 shadow-xl">
        <div className="sm:col-span-2">
          <input 
            type="text" 
            placeholder="Gõ tên mô hình cần tìm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
          />
        </div>
        <div>
          <select 
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500 transition-all h-full cursor-pointer"
          >
            {filterBrands.map(b => (
              <option key={b} value={b}>{b === 'All' ? 'Tất cả thương hiệu' : b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="border-b border-white/5 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
            <tr>
              <th className="p-6">Sản phẩm</th>
              <th className="p-6">Thương hiệu</th>
              <th className="p-6 text-right">Giá</th>
              <th className="p-6 text-right">Tồn kho</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className={`hover:bg-white/[0.02] transition-all ${item.deleted ? 'opacity-50' : ''}`}>
                  <td className="p-6 flex items-center gap-4">
                    <img src={imageUrl(item.imageUrl)} className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-black" alt="" />
                    <span className="font-bold text-sm text-white">
                      {item.name}
                      {item.deleted && <span className="ml-2 text-[9px] text-red-400 uppercase">(đã xóa)</span>}
                    </span>
                  </td>
                  <td className="p-6 text-xs text-gray-400 font-bold uppercase">{item.brand}</td>
                  <td className="p-6 text-right text-sm font-black italic text-orange-500">{item.price?.toLocaleString()}đ</td>
                  <td className="p-6 text-right text-xs font-bold">{item.stock} cái</td>
                  <td className="p-6 text-right space-x-4">
                    {!item.deleted ? (
                      <>
                        <button onClick={() => handleOpenEdit(item)} className="text-lg hover:text-blue-500 transition">📝</button>
                        <button onClick={() => handleDelete(item.id)} className="text-lg hover:text-red-500 transition">🗑️</button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/products/${item.id}/restore`, {
                            method: 'PUT',
                            headers: getAdminHeaders(),
                          });
                          if (res.ok) {
                            toast.success('Đã khôi phục sản phẩm!');
                            fetchProducts();
                          } else {
                            toast.error('Khôi phục thất bại!');
                          }
                        }}
                        className="text-[10px] font-black uppercase text-green-500 hover:text-green-400"
                      >
                        Khôi phục
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-500 italic text-xs uppercase tracking-widest">
                  Không tìm thấy mô hình nào khớp với bộ lọc...
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="p-6 border-t border-white/5 flex justify-between items-center gap-4 bg-black/20">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Hiển thị mô hình {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} của {filteredProducts.length} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1} 
                className="w-8 h-8 rounded-lg border border-white/10 text-xs disabled:opacity-20 transition hover:bg-white/5 text-white"
              >
                ←
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)} 
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition ${currentPage === i + 1 ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages} 
                className="w-8 h-8 rounded-lg border border-white/10 text-xs disabled:opacity-20 transition hover:bg-white/5 text-white"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#161616] w-full max-w-xl p-10 rounded-[50px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black italic uppercase mb-8">{isEdit ? 'Cập nhật' : 'Nhập'} <span className="text-orange-500">Mô hình</span></h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <input 
                type="text" 
                value={formData.name} 
                placeholder="Tên mô hình" 
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  value={formData.price} 
                  placeholder="Giá bán (VND)" 
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm" 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  required 
                />
                <input 
                  type="number" 
                  value={formData.stock} 
                  placeholder="Số lượng kho" 
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm" 
                  onChange={e => setFormData({...formData, stock: e.target.value})} 
                  required 
                />
              </div>

              <textarea
                value={formData.description}
                placeholder="Mô tả sản phẩm..."
                rows={4}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm"
                onChange={e => setFormData({...formData, description: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2 items-center mb-1">
                    <button
                      type="button"
                      onClick={() => { setBrandInputMode('select'); setFormData({...formData, brand: brands[0]}); }}
                      className={`text-[9px] px-3 py-1 rounded-lg font-bold uppercase transition ${brandInputMode === 'select' ? 'bg-orange-600 text-white' : 'text-gray-500 border border-white/10'}`}
                    >
                      Chọn
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBrandInputMode('custom'); setFormData({...formData, brand: ''}); }}
                      className={`text-[9px] px-3 py-1 rounded-lg font-bold uppercase transition ${brandInputMode === 'custom' ? 'bg-orange-600 text-white' : 'text-gray-500 border border-white/10'}`}
                    >
                      Tự nhập
                    </button>
                  </div>
                  {brandInputMode === 'select' ? (
                    <select 
                      value={formData.brand}
                      className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm cursor-pointer"
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    >
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      value={formData.brand}
                      placeholder="Nhập tên thương hiệu..."
                      className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-white text-sm"
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      required
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 bg-black border border-white/10 rounded-2xl px-6 py-4">
                  <input 
                    type="checkbox" 
                    id="preorder" 
                    checked={formData.isPreOrder}
                    onChange={e => setFormData({...formData, isPreOrder: e.target.checked})} 
                  />
                  <label htmlFor="preorder" className="text-[10px] font-black uppercase text-gray-500 select-none cursor-pointer">Hàng Pre-order</label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Tải ảnh thực tế</label>
                <div className="flex items-center gap-4 bg-black border border-white/10 rounded-2xl p-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-600/10 file:text-orange-500 hover:file:bg-orange-600 hover:file:text-white file:transition-all flex-1"
                  />
                  {formData.imageUrl && (
                    <img src={imageUrl(formData.imageUrl)} className="w-14 h-14 rounded-xl object-cover border border-white/10 bg-black" alt="Preview" />
                  )}
                </div>
              </div>

              {formData.imageUrl && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Ảnh phụ (tải nhiều ảnh)</label>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleExtraImageUpload}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600 hover:file:text-white file:transition-all w-full"
                  />
                  {extraImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extraImages.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img src={imageUrl(url)} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="" />
                          <button
                            type="button"
                            onClick={() => removeExtraImage(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="text-[10px] font-bold uppercase px-8 py-4 hover:text-white text-gray-500">Hủy</button>
                <button type="submit" disabled={uploading} className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50">Xác nhận lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}