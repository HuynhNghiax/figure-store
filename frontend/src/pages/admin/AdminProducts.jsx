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

  // Form chính gửi lên API (Giữ đúng cấu trúc DB chỉ có description)
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

  // State phụ tách nhỏ ô nhập liệu thông minh
  const [tempFields, setTempFields] = useState({
    heightNum: '',         // Chỉ chứa số (Ví dụ: 17)
    heightType: '~ {num} cm', // Định dạng hiển thị chọn nhanh
    heightCustom: '',      // Chuỗi tự gõ nếu bật chế độ tự điền
    material: 'PVC & ABS cao cấp',
    status: 'New Full Box chính hãng',
    detail: ''
  });

  const [brandInputMode, setBrandInputMode] = useState('select');
  const [materialInputMode, setMaterialInputMode] = useState('select');
  const [heightInputMode, setHeightInputMode] = useState('select'); // Chế độ nhập chiều cao ('select' hoặc 'custom')
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

  // KHI BẤM NÚT SỬA (📝): Bóc tách dữ liệu chuỗi phức tạp từ DB ra form nhập một cách thông minh
  const handleOpenEdit = (product) => {
    setFormData({ ...product, images: product.images || '' });

    const desc = product.description || '';
    let rawHeight = '';
    let material = 'PVC & ABS cao cấp';
    let status = 'New Full Box chính hãng';
    let detail = '';

    const lines = desc.split('\n');
    lines.forEach(line => {
      if (line.startsWith('• Chiều cao:')) {
        rawHeight = line.replace('• Chiều cao:', '').trim();
      } else if (line.startsWith('• Chất liệu:')) {
        material = line.replace('• Chất liệu:', '').trim();
      } else if (line.startsWith('• Mô tả:')) {
        detail = line.replace('• Mô tả:', '').trim();
      } else if (line.trim() !== '') {
        if (!status && !line.startsWith('•')) {
          status = line.trim();
        } else {
          detail += (detail ? '\n' : '') + line.replace('• ', '');
        }
      }
    });

    // XỬ LÝ BÓC TÁCH CHIỀU CAO THÔNG MINH BẰNG REGEX
    let heightNum = '';
    let heightType = '~ {num} cm';
    let heightCustom = '';

    if (rawHeight) {
      const matchNumber = rawHeight.match(/\d+/);
      if (matchNumber) {
        heightNum = matchNumber[0];
        const template = rawHeight.replace(heightNum, '{num}');

        const exists = heightTemplates.some(t => t.value === template);
        if (exists) {
          setHeightInputMode('select');
          heightType = template;
        } else {
          setHeightInputMode('custom');
          heightCustom = rawHeight;
        }
      } else {
        setHeightInputMode('custom');
        heightCustom = rawHeight;
      }
    }

    if (materials.includes(material)) {
      setMaterialInputMode('select');
    } else {
      setMaterialInputMode('custom');
    }

    setTempFields({ heightNum, heightType, heightCustom, material, status, detail });

    try {
      setExtraImages(product.images ? JSON.parse(product.images) : []);
    } catch {
      setExtraImages([]);
    }
    setIsEdit(true);
    setShowModal(true);
  };

  // CHUẨN HÓA LẠI HÀM UPLOAD ẢNH PHỤ (Hết lỗi 400)
  const handleExtraImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const loadingToast = toast.loading(`Đang tải ${files.length} ảnh phụ...`);
    const uploadedUrls = [];
    const token = getToken();

    for (const file of files) {
      const data = new FormData();
      data.append("file", file); // Khớp chuẩn với @RequestParam("file") của Spring Boot
      try {
        const response = await fetch(`${API_BASE}/api/products/upload`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}, // Bọc ngoặc kép tường minh cho Key Header
          body: data,
        });
        const result = await response.json();
        if (response.ok) {
          uploadedUrls.push(result.imageUrl);
        } else {
          console.error("Server reject file:", result);
        }
      } catch (error) {
        console.error("Lỗi kết nối upload file phụ:", error);
      }
    }

    toast.dismiss(loadingToast);
    if (uploadedUrls.length > 0) {
      const newExtras = [...extraImages, ...uploadedUrls];
      setExtraImages(newExtras);
      setFormData(prev => ({ ...prev, images: JSON.stringify(newExtras) }));
      toast.success(`Đã thêm ${uploadedUrls.length} ảnh phụ!`);
    } else {
      toast.error("Không thể upload được ảnh phụ nào, vui lòng kiểm tra lại file!");
    }
  };

  const removeExtraImage = (index) => {
    const newExtras = extraImages.filter((_, i) => i !== index);
    setExtraImages(newExtras);
    setFormData(prev => ({ ...prev, images: JSON.stringify(newExtras) }));
  };

  // CHUẨN HÓA LẠI HÀM UPLOAD ẢNH CHÍNH (Hết lỗi 400)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file); // Khớp với @RequestParam("file") ở Backend

    setUploading(true);
    const loadingToast = toast.loading("Đang đẩy file ảnh lên hệ thống...");

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/products/upload`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}, // Sửa định dạng Header gửi token
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
    } catch{
      toast.dismiss(loadingToast);
      toast.error("Lỗi kết nối Server API!");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.imageUrl) {
      return toast.error("Vui lòng tải ảnh lên trước khi lưu mô hình!");
    }

    let finalHeightString = '';
    if (heightInputMode === 'select') {
      if (tempFields.heightNum) {
        finalHeightString = tempFields.heightType.replace('{num}', tempFields.heightNum);
      }
    } else {
      finalHeightString = tempFields.heightCustom;
    }

    const compiledDescription = [
      `• Thương hiệu: ${formData.brand}`,
      finalHeightString ? `• Chiều cao: ${finalHeightString}` : '',
      tempFields.material ? `• Chất liệu: ${tempFields.material}` : '',
      tempFields.status ? `${tempFields.status}` : '',
      tempFields.detail ? `• Mô tả: ${tempFields.detail}` : ''
    ].filter(Boolean).join('\n');

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
          description: compiledDescription,
          price: Number(formData.price) || 0,
          stock: Number(formData.stock) || 0,
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(isEdit ? "Cập nhật thành công!" : "Đã thêm hàng mới!");
        setShowModal(false);
        setIsEdit(false);
        setBrandInputMode('select');
        setMaterialInputMode('select');
        setHeightInputMode('select');
        setFormData({ id: null, name: '', price: '', brand: 'Bandai', imageUrl: '', images: '', stock: 10, isPreOrder: false, description: '' });
        setTempFields({ heightNum: '', heightType: '~ {num} cm', heightCustom: '', material: 'PVC & ABS cao cấp', status: 'New Full Box chính hãng', detail: '' });
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

  const brands = ['Sega', 'Furyu', 'Taito', 'MegaHouse', 'Banpresto'];
  const filterBrands = ['All', ...brands];

  const materials = [
    'PVC & ABS cao cấp',
    'Chất liệu PVC nguyên khối',
    'Nhựa Resin đúc đặc',
    'Diecast (Hợp kim kim loại)',
    'Nhựa Polystone siêu bền',
    'Chất liệu vải kết hợp nhựa (Hot Toys)',
    'Nhựa dẻo Soft Vinyl'
  ];

  const heightTemplates = [
    { label: "cm (Xấp xỉ ~)", value: "~ {num} cm" },
    { label: "cm (Chuẩn)", value: "{num} cm" },
    { label: "cm (Tỉ lệ 1/7)", value: "{num} cm (Tỉ lệ 1/7)" },
    { label: "cm (Tỉ lệ 1/6)", value: "{num} cm (Tỉ lệ 1/6)" },
    { label: "cm (Tỉ lệ 1/4)", value: "{num} cm (Tỉ lệ 1/4)" },
    { label: "mm (Mô hình nhỏ/Gunpla)", value: "{num} mm" }
  ];

  return (
    <div className="animate-in fade-in duration-500 p-6 text-white bg-black min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <h1 className="text-3xl font-black italic uppercase text-white">Kho <span className="text-orange-500">Sản phẩm</span></h1>
        <button
          onClick={() => {
            setIsEdit(false);
            setBrandInputMode('select');
            setMaterialInputMode('select');
            setHeightInputMode('select');
            setFormData({ id: null, name: '', price: '', brand: 'Bandai', imageUrl: '', images: '', stock: 10, isPreOrder: false, description: '' });
            setTempFields({ heightNum: '', heightType: '~ {num} cm', heightCustom: '', material: 'PVC & ABS cao cấp', status: 'New Full Box chính hãng', detail: '' });
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
  <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
    {/* Tăng max-w thành 4xl để form mở rộng sang 2 bên */}
    <div className="bg-[#111] w-full max-w-4xl p-8 rounded-[40px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 my-8">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-center border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white">
            {isEdit ? 'Cập nhật' : 'Nhập'} <span className="text-orange-500">Mô hình</span>
          </h2>
        </div>
        <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition text-sm uppercase font-bold">✕ Đóng</button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* CỘT TRÁI: CÁC THÔNG TIN NHẬP LIỆU */}
        <div className="space-y-5">
          {/* Nhóm thông tin cơ bản */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block ml-1">Thông tin cơ bản</label>
            <input 
              type="text" 
              value={formData.name} 
              placeholder="Tên mô hình sản phẩm" 
              className="w-full bg-[#161616] border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all" 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" 
                value={formData.price} 
                placeholder="Giá bán (VND)" 
                className="w-full bg-[#161616] border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all" 
                onChange={e => setFormData({...formData, price: e.target.value})} 
                required 
              />
              <input 
                type="number" 
                value={formData.stock} 
                placeholder="Số lượng tồn kho" 
                className="w-full bg-[#161616] border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all" 
                onChange={e => setFormData({...formData, stock: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Nhóm Thương hiệu & Chế độ đặt hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => { setBrandInputMode('select'); setFormData({...formData, brand: brands[0]}); }}
                  className={`text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase border transition-all ${brandInputMode === 'select' ? 'bg-orange-600 text-white border-transparent' : 'text-gray-500 border-white/10 bg-transparent'}`}
                >
                  Chọn hiệu
                </button>
                <button
                  type="button"
                  onClick={() => { setBrandInputMode('custom'); setFormData({...formData, brand: ''}); }}
                  className={`text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase border transition-all ${brandInputMode === 'custom' ? 'bg-orange-600 text-white border-transparent' : 'text-gray-500 border-white/10 bg-transparent'}`}
                >
                  Tự nhập
                </button>
              </div>
              {brandInputMode === 'select' ? (
                <select 
                  value={formData.brand}
                  className="w-full bg-[#161616] border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm cursor-pointer transition-all"
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                >
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input 
                  type="text"
                  value={formData.brand}
                  placeholder="Nhập thương hiệu..."
                  className="w-full bg-[#161616] border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all"
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  required
                />
              )}
            </div>

            <div className="flex items-center gap-3 bg-[#161616] border border-white/10 rounded-2xl px-5 h-[50px] self-end transition-all">
              <input 
                type="checkbox" 
                id="preorder" 
                checked={formData.isPreOrder}
                onChange={e => setFormData({...formData, isPreOrder: e.target.checked})} 
                className="accent-orange-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="preorder" className="text-[10px] font-black uppercase text-gray-400 select-none cursor-pointer tracking-wider">Hàng Pre-order</label>
            </div>
          </div>

          {/* Khối hình ảnh chuyển sang cột trái này luôn cho cân bằng */}
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Tải ảnh thực tế</label>
              <div className="flex items-center gap-4 bg-black border border-white/10 rounded-2xl p-3">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-orange-600/10 file:text-orange-500 hover:file:bg-orange-600 hover:file:text-white flex-1 cursor-pointer"
                />
                {formData.imageUrl && (
                  <img src={imageUrl(formData.imageUrl)} className="w-14 h-14 rounded-xl object-cover border border-white/10 bg-black" alt="Preview" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG SỐ CHI TIẾT & ẢNH PHỤ */}
        <div className="space-y-5 flex flex-col justify-between">
          <div className="p-5 bg-[#161616] border border-white/5 rounded-3xl space-y-4">
            <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Thông số mô tả chi tiết</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chiều cao */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-gray-400 uppercase font-bold ml-1">Chiều cao</label>
                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                    <button type="button" onClick={() => setHeightInputMode('select')} className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${heightInputMode === 'select' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>Chọn</button>
                    <button type="button" onClick={() => setHeightInputMode('custom')} className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${heightInputMode === 'custom' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>Điền</button>
                  </div>
                </div>
                {heightInputMode === 'select' ? (
                  <div className="flex gap-2">
                    <input type="number" value={tempFields.heightNum} placeholder="Số" className="w-14 bg-black border border-white/10 rounded-xl px-2 py-2 text-white text-xs text-center" onChange={e => setTempFields({...tempFields, heightNum: e.target.value})} required={heightInputMode === 'select'}/>
                    <select value={tempFields.heightType} className="flex-1 bg-black border border-white/10 rounded-xl px-2 py-2 text-white text-xs cursor-pointer" onChange={e => setTempFields({...tempFields, heightType: e.target.value})}>
                      {heightTemplates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                ) : (
                  <input type="text" value={tempFields.heightCustom} placeholder="VD: Cao 18cm" className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-xs" onChange={e => setTempFields({...tempFields, heightCustom: e.target.value})} required={heightInputMode === 'custom'}/>
                )}
              </div>

              {/* Chất liệu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] text-gray-400 uppercase font-bold ml-1">Chất liệu</label>
                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                    <button type="button" onClick={() => { setMaterialInputMode('select'); setTempFields({...tempFields, material: materials[0]}); }} className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${materialInputMode === 'select' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>Chọn</button>
                    <button type="button" onClick={() => { setMaterialInputMode('custom'); setTempFields({...tempFields, material: ''}); }} className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${materialInputMode === 'custom' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>Điền</button>
                  </div>
                </div>
                {materialInputMode === 'select' ? (
                  <select value={tempFields.material} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-xs cursor-pointer" onChange={e => setTempFields({...tempFields, material: e.target.value})}>
                    {materials.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <input type="text" value={tempFields.material} placeholder="Chất liệu..." className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-xs" onChange={e => setTempFields({...tempFields, material: e.target.value})} required/>
                )}
              </div>
            </div>

            {/* Tình trạng */}
            <input type="text" value={tempFields.status} placeholder="Tình trạng (VD: New Full Box chính hãng)" className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-xs" onChange={e => setTempFields({...tempFields, status: e.target.value})} />
            
            {/* Chi tiết */}
            <textarea value={tempFields.detail} placeholder="Mô tả thêm..." rows={2} className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-xs resize-none" onChange={e => setTempFields({...tempFields, detail: e.target.value})} />
          </div>

          {/* Ảnh phụ + Footer Button gom xuống góc phải */}
          <div className="space-y-4">
            {formData.imageUrl && (
              <div className="space-y-2 bg-black/30 p-3 rounded-2xl border border-white/5">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Ảnh phụ</label>
                <input type="file" multiple accept="image/*" onChange={handleExtraImageUpload} className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600/10 file:text-blue-500 hover:file:bg-blue-600 w-full cursor-pointer" />
                {extraImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-16 overflow-y-auto">
                    {extraImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={imageUrl(url)} className="w-10 h-10 rounded-lg object-cover border border-white/10" alt="" />
                        <button type="button" onClick={() => removeExtraImage(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Nút hành động */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase px-6 py-3 hover:text-white text-gray-500">Hủy</button>
              <button type="submit" disabled={uploading} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-orange-600/20">
                {uploading ? 'Đang lưu...' : 'Xác nhận lưu'}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}