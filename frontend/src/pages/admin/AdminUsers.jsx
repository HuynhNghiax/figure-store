import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE, getAdminHeaders } from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', email: '' });

  const fetchUsers = (page = 1, search = '') => {
    let url = `${API_BASE}/api/users?page=${page - 1}&size=15`;
    if (search) url += `&search=${search}`;
    fetch(url, { headers: getAdminHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải users');
        return res.json();
      })
      .then(data => {
        setUsers(data.content || data);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi tải danh sách khách hàng!');
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchTerm);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa khách hàng này không?")) {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        toast.success("Đã xóa khách hàng!");
        fetchUsers(currentPage, searchTerm);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Không thể xóa khách hàng!');
      }
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/users/${editUser.id}`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("Cập nhật thành công!");
        setEditUser(null);
        fetchUsers(currentPage, searchTerm);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Cập nhật thất bại!');
      }
    } catch {
      toast.error("Lỗi kết nối!");
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 uppercase tracking-widest animate-pulse">Đang tải danh sách khách hàng...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black italic uppercase text-white">Quản lý <span className="text-orange-500">Khách hàng</span></h1>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Tìm theo tên tài khoản..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
        />
        <button className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Tìm</button>
      </form>

      <div className="bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="border-b border-white/5 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
            <tr>
              <th className="p-6">Thành viên</th>
              <th className="p-6">Email</th>
              <th className="p-6">Quyền hạn</th>
              <th className="p-6">Mã định danh</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-500 font-bold uppercase">
                      {user.username?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{user.username}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter italic">Thành viên chính thức</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-xs text-gray-400">{user.email || '—'}</td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-6 font-mono text-xs text-gray-500">USER_ID_{user.id}</td>
                <td className="p-6 text-right space-x-3">
                  <button onClick={() => { setEditUser(user); setEditForm({ role: user.role, email: user.email || '' }); }} className="text-gray-600 hover:text-blue-500 transition-all text-lg" title="Sửa">📝</button>
                  {user.role !== 'ADMIN' && (
                    <button onClick={() => handleDeleteUser(user.id)} className="text-gray-600 hover:text-red-500 transition-all text-lg" title="Xóa">🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="p-6 border-t border-white/5 flex justify-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => { setCurrentPage(i+1); fetchUsers(i+1, searchTerm); }}
                className={`w-10 h-10 rounded-xl text-sm font-black transition ${currentPage === i+1 ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
              >{i+1}</button>
            ))}
          </div>
        )}
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#161616] w-full max-w-md p-10 rounded-[50px] border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black italic uppercase mb-8">Sửa <span className="text-orange-500">User</span></h2>
            <form onSubmit={handleEdit} className="space-y-5">
              <input
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={e => setEditForm({...editForm, email: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
              />
              <select
                value={editForm.role}
                onChange={e => setEditForm({...editForm, role: e.target.value})}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white cursor-pointer"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditUser(null)} className="text-[10px] font-bold uppercase px-8 py-4 hover:text-white text-gray-500">Hủy</button>
                <button type="submit" className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}