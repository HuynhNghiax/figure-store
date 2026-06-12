import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE, getAdminHeaders } from '../../utils/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState(''); 
  const [selectedStatus, setSelectedStatus] = useState('ALL'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 💡 THAY ĐỔI TẠI ĐÂY: Mặc định là null, khi bấm sẽ lưu ID đơn hàng đang update
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Hàm gọi API lấy danh sách đơn hàng
  const fetchOrders = (page, search, status) => {
    let url = `${API_BASE}/api/orders?page=${page - 1}&size=10`;
    
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (status && status !== 'ALL') url += `&status=${status}`;

    fetch(url, { headers: getAdminHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error('Không thể tải đơn hàng');
        return res.json();
      })
      .then(data => {
        if (data && data.content !== undefined) {
          setOrders(Array.isArray(data.content) ? data.content : []);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          setOrders(data);
          setTotalPages(1);
        } else {
          setOrders([]);
          setTotalPages(1);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Lỗi tải danh sách đơn hàng!');
      });
  };

  useEffect(() => {
    fetchOrders(currentPage, activeSearch, selectedStatus);
  }, [currentPage, selectedStatus, activeSearch]);

  // Hàm đổi trạng thái siêu tốc
  const handleUpdateStatus = async (e, orderId, status) => {
    e.stopPropagation();
    if (status === 'COMPLETED' || status === 'CANCELLED') return;

    const nextStatus = status === 'PENDING' ? 'SHIPPED' : 'COMPLETED';

    // Đổi trạng thái trên Giao diện trước (Optimistic Update)
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
    }
    
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: nextStatus } : order
      )
    );

    // 💡 THAY ĐỔI TẠI ĐÂY: Đánh dấu đơn hàng này đang được xử lý loading
    setUpdatingOrderId(orderId);

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });
      
      if (res.ok) {
        toast.success('Đã cập nhật trạng thái!');
        if (selectedStatus !== 'ALL') {
          fetchOrders(currentPage, activeSearch, selectedStatus);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || 'Cập nhật thất bại!');
        fetchOrders(currentPage, activeSearch, selectedStatus);
      }
    } catch {
      toast.error('Lỗi kết nối!');
      fetchOrders(currentPage, activeSearch, selectedStatus);
    } finally {
      // 💡 THAY ĐỔI TẠI ĐÂY: Xóa đánh dấu loading sau khi xong
      setUpdatingOrderId(null);
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    SHIPPED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
    CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  const statusLabels = {
    ALL: '📦 Tất cả',
    PENDING: '⏳ Chờ xử lý',
    SHIPPED: '🚚 Đang giao',
    COMPLETED: '✓ Hoàn thành',
    CANCELLED: '✕ Đã huỷ'
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Tiêu đề trang */}
      <div className="mb-8">
        <h1 className="text-3xl font-black italic uppercase text-white">
          Quản lý <span className="text-orange-500">Đơn hàng</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Danh sách tất cả đơn hàng từ khách hàng</p>
      </div>

      {/* Thanh Tìm Kiếm */}
      <form 
        onSubmit={(e) => { 
          e.preventDefault(); 
          setCurrentPage(1); 
          setActiveSearch(searchTerm); 
        }} 
        className="mb-4 relative"
      >
        <input
          type="text"
          placeholder="Nhập mã đơn hàng hoặc tên khách..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#111] border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-orange-500 transition-all text-white placeholder:text-gray-700"
        />
        <button type="submit" className="absolute right-2 top-2 bottom-2 bg-orange-600 px-6 rounded-xl font-black text-[10px] tracking-widest hover:bg-orange-500 transition-all">
          TÌM KIẾM
        </button>
      </form>

      {/* Thanh Bộ Lọc Trạng Thái (Tabs) */}
      <div className="flex flex-wrap gap-2 mb-8 bg-black/30 p-1.5 rounded-2xl border border-white/5">
        {Object.keys(statusLabels).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              if (selectedStatus !== status) {
                setSelectedStatus(status);
                setCurrentPage(1);
              }
            }}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              selectedStatus === status
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-[#161616] rounded-[24px] border border-white/5 text-gray-500 text-sm font-medium">
            Không tìm thấy đơn hàng nào thuộc trạng thái này.
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-[#161616] p-6 rounded-[24px] border border-white/5 flex items-center justify-between hover:border-orange-500/30 hover:bg-[#1a1a1a] transition-all cursor-pointer group">
              
              <div className="flex gap-6 items-center">
                <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 font-black text-lg border border-orange-500/10">
                  #{order.id}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{order.customerName}</h3>
                  <p className="text-xs text-gray-500 font-medium">{order.phone} • {order.address}</p>
                </div>
              </div>

              <div className="text-right flex items-center gap-8">
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1 italic">Tổng tiền</p>
                  <p className="font-black text-xl text-white">{order.totalAmount?.toLocaleString()}đ</p>
                </div>
                
                {/* 💡 SỬA NÚT BẤM: Chỉ hiển thị loading nếu updatingOrderId trùng với id đơn hàng này */}
                <button
                  disabled={updatingOrderId !== null || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                  onClick={(e) => handleUpdateStatus(e, order.id, order.status)}
                  className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusColors[order.status]}`}
                >
                  {updatingOrderId === order.id ? '...' : (order.status === 'PENDING' ? 'GIAO NGAY' : statusLabels[order.status])}
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Thanh Phân Trang */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-4 py-2 bg-[#161616] border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 uppercase font-black transition-all"
          >
            Trước
          </button>
          <span className="text-xs text-gray-400 font-bold">Trang {currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 bg-[#161616] border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 uppercase font-black transition-all"
          >
            Sau
          </button>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-[#111] w-full max-w-xl p-8 rounded-[32px] border border-white/10 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 text-2xl text-gray-500 hover:text-orange-500 transition-colors"
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black italic text-white">
                Đơn hàng <span className="text-orange-500">#{selectedOrder.id}</span>
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] bg-white/5 text-gray-400 font-bold uppercase tracking-widest border border-white/5">
                  {selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-bold text-white border border-white/10">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">
                        {item.productName || `Sản phẩm ID: ${item.productId}`}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Đơn giá: {item.price?.toLocaleString()}đ</p>
                    </div>
                  </div>
                  <p className="font-black text-orange-500 italic">
                    {(item.price * item.quantity).toLocaleString()}đ
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6 flex justify-between items-end">
              <div className="text-sm text-gray-400 leading-relaxed">
                <p className="font-bold text-white uppercase text-[10px] tracking-widest mb-1">Khách hàng</p>
                <p className="font-bold text-white">{selectedOrder.customerName}</p>
                <p>{selectedOrder.phone}</p>
                <p className="text-xs truncate max-w-[200px]">{selectedOrder.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-gray-500 font-black tracking-widest mb-1 italic">Tổng thanh toán</p>
                <p className="text-3xl font-black italic text-white">{selectedOrder.totalAmount?.toLocaleString()}đ</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}