import { useState, useEffect } from "react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    brand: 'Bandai', // Mặc định
    imageUrl: '', 
    stock: 10, 
    isPreOrder: false 
  });

  const fetchProducts = () => {
    fetch("http://localhost:8080/api/products")
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:8080/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      alert("Đã thêm mô hình vào kho!");
      setShowModal(false);
      fetchProducts();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa mô hình này?")) {
      await fetch(`http://localhost:8080/api/products/${id}`, { method: "DELETE" });
      fetchProducts();
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
          Kho <span className="text-orange-500">Sản phẩm</span>
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 hover:-translate-y-1 transition-all"
        >
          + Thêm mô hình mới
        </button>
      </div>

      <div className="bg-[#111] rounded-[40px] border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-white/5 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
            <tr>
              <th className="p-6">Sản phẩm</th>
              <th className="p-6">Hãng</th>
              <th className="p-6 text-right">Giá</th>
              <th className="p-6 text-right">Kho</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-all">
                <td className="p-6 flex items-center gap-4">
                  <img src={item.imageUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                  <span className="font-bold text-sm text-white">{item.name}</span>
                </td>
                <td className="p-6 text-xs text-gray-400 font-bold uppercase">{item.brand}</td>
                <td className="p-6 text-right text-sm font-black italic text-orange-500">{item.price?.toLocaleString()}đ</td>
                <td className="p-6 text-right text-xs font-bold">{item.stock} cái</td>
                <td className="p-6 text-right space-x-4">
                  <button onClick={() => handleDelete(item.id)} className="text-lg hover:text-red-500 transition">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-[#161616] w-full max-w-xl p-10 rounded-[50px] border border-white/10">
            <h2 className="text-2xl font-black italic uppercase mb-8">Nhập <span className="text-orange-500">Hàng mới</span></h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="text" placeholder="Tên mô hình" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500" onChange={e => setFormData({...formData, name: e.target.value})} required />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Giá bán" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500" onChange={e => setFormData({...formData, price: e.target.value})} required />
                
                {/* Dropdown chọn hãng */}
                <select 
                  className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm"
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                >
                  <option value="Bandai">Bandai</option>
                  <option value="Good Smile">Good Smile</option>
                  <option value="Hot Toys">Hot Toys</option>
                  <option value="MegaHouse">MegaHouse</option>
                  <option value="Banpresto">Banpresto</option>
                </select>
              </div>

              <input type="text" placeholder="Link ảnh trực tiếp (URL)" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500" onChange={e => setFormData({...formData, imageUrl: e.target.value})} required />
              
              <div className="flex items-center gap-2 px-2">
                <input type="checkbox" id="preorder" onChange={e => setFormData({...formData, isPreOrder: e.target.checked})} />
                <label htmlFor="preorder" className="text-xs font-bold uppercase text-gray-500">Hàng đặt trước (Pre-order)</label>
              </div>

              <div className="flex justify-end gap-4 mt-10">
                <button type="button" onClick={() => setShowModal(false)} className="text-[10px] font-bold uppercase px-8 py-4">Hủy bỏ</button>
                <button type="submit" className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-600/20">Xác nhận lưu kho</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}