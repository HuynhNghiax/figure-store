import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authFetch } from '../../utils/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = () => {
    setLoading(true);
    authFetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi tải danh mục!');
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        toast.success('Đã thêm danh mục!');
        setNewName('');
        fetchCategories();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Thêm thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    setSavingId(id);
    try {
      const res = await authFetch(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        toast.success('Đã cập nhật danh mục!');
        setEditingId(null);
        fetchCategories();
      } else {
        const d = await res.json();
        toast.error(d.message || 'Cập nhật thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này? Có thể ảnh hưởng đến sản phẩm đang dùng.')) return;
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa danh mục!');
        fetchCategories();
      } else {
        toast.error('Xóa thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black italic uppercase text-white">
          Quản lý <span className="text-orange-500">Danh mục</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? '...' : `${categories.length} danh mục sản phẩm`}
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="text"
          placeholder="Tên danh mục mới..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 bg-[#111] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-orange-500 transition-all text-white placeholder:text-gray-600 text-sm"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="px-6 py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all text-white shrink-0"
        >
          {adding ? '...' : '+ Thêm'}
        </button>
      </form>

      {/* Category list */}
      <div className="bg-[#111] rounded-[28px] border border-white/5 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center text-gray-500 italic text-sm">
            Chưa có danh mục nào. Thêm ngay!
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-all group"
              >
                {/* Index */}
                <span className="w-8 h-8 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                  {idx + 1}
                </span>

                {/* Name / Edit input */}
                {editingId === cat.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(cat.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 bg-black border border-orange-500/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-all"
                  />
                ) : (
                  <span className="flex-1 font-bold text-white text-sm">{cat.name}</span>
                )}

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {editingId === cat.id ? (
                    <>
                      <button
                        type="button"
                        disabled={savingId === cat.id}
                        onClick={() => handleSaveEdit(cat.id)}
                        className="px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        {savingId === cat.id ? '...' : '✓ Lưu'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 border border-white/5 hover:text-orange-400 hover:border-orange-500/20 text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        ✎ Sửa
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === cat.id}
                        onClick={() => handleDelete(cat.id)}
                        className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        {deletingId === cat.id ? '...' : '✕ Xóa'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
        ⚠️ Xóa danh mục sẽ không xóa sản phẩm, nhưng sản phẩm thuộc danh mục đó sẽ không còn danh mục.
      </p>
    </div>
  );
}
