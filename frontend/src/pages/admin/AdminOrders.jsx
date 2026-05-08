import { useState, useEffect } from 'react';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // Lưu đơn hàng đang được xem chi tiết

  const fetchOrders = () => {
    fetch("http://localhost:8080/api/orders")
      .then(res => res.json())
      .then(data => setOrders(data));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateStatus = async (orderId, status) => {
    const nextStatus = status === 'PENDING' ? 'SHIPPED' : 'COMPLETED';
    await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: nextStatus
    });
    fetchOrders();
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-black italic uppercase mb-10 text-white">Quản lý <span className="text-orange-500">Đơn hàng</span></h1>

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
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  order.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-black' : 
                  order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white' : 
                  'bg-green-500/10 text-green-500 border-green-500/20 cursor-default'
                }`}
              >
                {order.status === 'PENDING' ? 'Giao ngay' : order.status}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-2xl p-10 rounded-[50px] border border-white/10 shadow-2xl relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 text-2xl opacity-50 hover:opacity-100">✕</button>
            
            <h2 className="text-2xl font-black italic uppercase mb-8">Chi tiết <span className="text-orange-500">Đơn #{selectedOrder.id}</span></h2>
            
            <div className="space-y-4 mb-10 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {selectedOrder.items.map((item, index) => (
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