import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE, getAdminHeaders } from '../../utils/api';

const emptyForm = {
  code: '',
  discountPercent: '',
  expiryDate: '',
  maxUses: '',
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = () => {
    fetch(`${API_BASE}/api/coupons`, { headers: getAdminHeaders() })
      .then(res => res.json())
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Lỗi tải danh sách coupon!'));
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountPercent || !form.expiryDate || !form.maxUses) {
      return toast.error('Vui lòng nhập đầy đủ thông tin!');
    }
    if (Number(form.discountPercent) < 1 || Number(form.discountPercent) > 100) {
      return toast.error('Phần trăm giảm phải từ 1 đến 100!');
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/coupons`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          code: form.code.toUpperCase().trim(),
          discountPercent: Number(form.discountPercent),
          expiryDate: new Date(form.expiryDate).toISOString().replace('Z', ''),
          maxUses: Number(form.maxUses),
          usedCount: 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã tạo mã giảm giá!');
        setShowModal(false);
        setForm(emptyForm);
        fetchCoupons();
      } else {
        toast.error(data.message || 'Lỗi tạo coupon!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/coupons/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        toast.success('Đã xóa mã giảm giá!');
        fetchCoupons();
      } else {
        toast.error('Xóa thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    }
  };

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();
  const isExhausted = (coupon) => coupon.usedCount >= coupon.maxUses;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black italic uppercase text-white">
            Mã <span className="text-orange-500">Giảm giá</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý tất cả coupon của cửa hàng</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowModal(true); }}
          className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 shrink-0 hover:bg-orange-500 transition-all"
        >
          + Tạo mã mới
        </button>
      </div>

      {/* Bảng danh sách coupon */}
      <div className="bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="border-b border-white/5 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
            <tr>
              <th className="p-6">Mã coupon</th>
              <th className="p-6 text-center">Giảm</th>
              <th className="p-6 text-center">Đã dùng</th>
              <th className="p-6">Hết hạn</th>
              <th className="p-6 text-center">Trạng thái</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-gray-500 italic text-xs uppercase tracking-widest">
                  Chưa có mã giảm giá nào...
                </td>
              </tr>
            ) : (
              coupons.map(coupon => {
                const expired = isExpired(coupon.expiryDate);
                const exhausted = isExhausted(coupon);
                const isActive = !expired && !exhausted;
                return (
                  <tr key={coupon.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="p-6">
                      <span className="font-black text-orange-400 text-sm tracking-widest font-mono">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-green-400 font-black text-lg">{coupon.discountPercent}%</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-gray-300 text-sm font-bold">
                        {coupon.usedCount} / {coupon.maxUses}
                      </span>
                      <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`text-xs font-bold ${expired ? 'text-red-400' : 'text-gray-300'}`}>
                        {new Date(coupon.expiryDate).toLocaleDateString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      {isActive ? (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                          ✓ Hoạt động
                        </span>
                      ) : expired ? (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                          Hết hạn
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Đã dùng hết
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="text-lg hover:text-red-500 transition"
                        title="Xóa coupon"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal tạo coupon */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-md p-8 rounded-[40px] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mb-6 flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-2xl font-black italic uppercase text-white">
                Tạo <span className="text-orange-500">Coupon</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition text-sm uppercase font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">Mã coupon</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER20"
                  className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white font-mono uppercase tracking-widest text-sm transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">Giảm (%)</label>
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                    placeholder="1 - 100"
                    min="1" max="100"
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">Tối đa (lượt)</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="VD: 100"
                    min="1"
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-1.5">Ngày hết hạn</label>
                <input
                  type="datetime-local"
                  value={form.expiryDate}
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full bg-black border border-white/10 rounded-2xl px-5 py-3.5 outline-none focus:border-orange-500 text-white text-sm transition-all [color-scheme:dark]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="text-[10px] font-black uppercase px-6 py-3 hover:text-white text-gray-500 transition-all">Hủy</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-orange-600/20"
                >
                  {loading ? 'Đang tạo...' : 'Tạo coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
