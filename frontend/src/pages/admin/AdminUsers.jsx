import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    fetch("http://localhost:8080/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa khách hàng này không?")) {
      await fetch(`http://localhost:8080/api/users/${id}`, { method: "DELETE" });
      toast.success("Đã xóa khách hàng!");
      fetchUsers();
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 uppercase tracking-widest animate-pulse">Đang tải danh sách khách hàng...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black italic uppercase text-white">Quản lý <span className="text-orange-500">Khách hàng</span></h1>
        <div className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-gray-400">
          Tổng cộng: {users.length} thành viên
        </div>
      </div>

      <div className="bg-[#111] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="border-b border-white/5 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
            <tr>
              <th className="p-6">Thành viên</th>
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
                      {user.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{user.username}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-tighter italic">Thành viên chính thức</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    user.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-6 font-mono text-xs text-gray-500">USER_ID_{user.id}</td>
                <td className="p-6 text-right">
                  {user.role !== 'ADMIN' && (
                    <button onClick={() => handleDeleteUser(user.id)} className="text-gray-600 hover:text-red-500 transition-all text-lg">
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}