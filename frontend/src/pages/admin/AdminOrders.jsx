import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE, getAdminHeaders } from '../../utils/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = (page = 1, search = '') => {
    let url = `${API_BASE}/api/orders?page=${page - 1}&size=10`;
    if (search) url += `&search=${search}`;
    fetch(url, { headers: getAdminHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải đơn hàng');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
          setTotalPages(1);
        } else {
          setOrders(data.content || []);
          setTotalPages(data.totalPages || 1);
        }
      })
      .catch(() => toast.error('Lỗi tải danh sách đơn hàng!'));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1, searchTerm);
  };

  const handleUpdateStatus = async (orderId, status) => {
    if (status === 'COMPLETED' || status === 'CANCELLED') return;
    const nextStatus = status === 'PENDING' ? 'SHIPPED' : 'COMPLETED';
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công!');
        fetchOrders(currentPage, searchTerm);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Cập nhật thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối server!');
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    SHIPPED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  const statusLabels = {
    PENDING: '⏳ Chờ xử lý',
    SHIPPED: '🚚 Đang giao',
    COMPLETED: '✓ Hoàn thành',
    CANCELLED: '✕ Đã huỷ'
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-black italic uppercase mb-8 text-white">Quản lý <span className="text-orange-500">Đơn hàng</span></h1>

      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <input
          type="text"
          placeholder="Tìm theo mã đơn (VD: 1, 2, 3...)"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 text-sm text-white"
        />
        <button className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Tìm</button>
      </form>

      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-[#161616] p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-orange-500/30 transition-all cursor-pointer" onClick={() => setSelectedOrder(order)}>
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 font-bold">#{order.id}</div>
              <div>
                <h3 className="font-bold text-lg text-white">{order.customerName}</h3>
                <p className="text-xs text-gray-500">{order.phone} • {order.address}</p>
              </div>
            </div>
            
            <div className="text-right flex items-center gap-8">
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1 italic">Tổng tiền</p>
                <p className="font-black text-xl text-white">{order.totalAmount?.toLocaleString()}đ</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, order.status); }}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusColors[order.status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
              >
                {order.status === 'PENDING' ? 'Giao ngay' : 
                 order.status === 'SHIPPED' ? 'Hoàn tất' : 
                 (statusLabels[order.status] || order.status)}
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-center text-gray-500 italic py-20">Không tìm thấy đơn hàng nào.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => { setCurrentPage(i+1); fetchOrders(i+1, searchTerm); }}
              className={`w-10 h-10 rounded-xl text-sm font-black transition ${currentPage === i+1 ? 'bg-orange-600 text-white' : 'bg-white/5 text-gray-500'}`}
            >{i+1}</button>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-2xl p-10 rounded-[50px] border border-white/10 shadow-2xl relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 text-2xl opacity-50 hover:opacity-100">✕</button>
            
            <h2 className="text-2xl font-black italic uppercase mb-8">Chi tiết <span className="text-orange-500">Đơn #{selectedOrder.id}</span></h2>
            
            <div className="mb-6 flex gap-4 flex-wrap">
              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[selectedOrder.status]}`}>
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase">{selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}</span>
            </div>

            <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center font-bold">{item.quantity}x</div>
                    <p className="font-bold text-sm">Sản phẩm ID: {item.productId}</p>
                  </div>
                  <p className="font-black text-orange-500 italic">{item.price?.toLocaleString()}đ</p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-8 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Khách hàng</p>
                <p className="text-lg font-bold">{selectedOrder.customerName}</p>
                <p className="text-xs text-gray-500">{selectedOrder.phone}</p>
                <p className="text-xs text-gray-500">{selectedOrder.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tổng hóa đơn</p>
                <p className="text-3xl font-black text-orange-500 italic">{selectedOrder.totalAmount?.toLocaleString()}đ</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}