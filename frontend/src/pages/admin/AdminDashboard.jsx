import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, products: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8080/api/orders").then(res => res.json()),
      fetch("http://localhost:8080/api/products").then(res => res.json())
    ]).then(([orders, products]) => {
      // 1. Tính toán thống kê tổng quát
      const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      setStats({
        totalOrders: orders.length,
        revenue: totalRevenue,
        products: products.length
      });

      // 2. Xử lý dữ liệu cho biểu đồ (Gom nhóm doanh thu theo ngày)
      const last7Days = orders.slice(0, 7).reverse().map(order => ({
        name: `Đơn #${order.id}`,
        doanhThu: order.totalAmount
      }));
      setChartData(last7Days);
    });
  }, []);

  const cards = [
    { label: "Doanh thu", value: `${stats.revenue.toLocaleString()}đ`, icon: "💰", color: "text-green-500" },
    { label: "Đơn hàng", value: stats.totalOrders, icon: "📋", color: "text-blue-500" },
    { label: "Kho hàng", value: stats.products, icon: "📦", color: "text-orange-500" },
  ];

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-black italic uppercase text-white">Tổng quan <span className="text-orange-500">Hệ thống</span></h1>
      
      {/* Thẻ thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#161616] p-8 rounded-[40px] border border-white/5 shadow-xl">
            <div className="text-3xl mb-4">{card.icon}</div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{card.label}</p>
            <p className={`text-3xl font-black italic ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* BIỂU ĐỒ DOANH THU */}
      <div className="bg-[#111] p-10 rounded-[40px] border border-white/5">
        <h2 className="text-xl font-bold mb-8 uppercase italic tracking-tighter">Biểu đồ <span className="text-orange-500">Doanh thu gần đây</span></h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
              />
              <Bar dataKey="doanhThu" fill="#ea580c" radius={[10, 10, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Thông báo hệ thống */}
      <div className="bg-orange-600/5 border border-orange-600/20 p-8 rounded-[32px] flex items-center gap-6">
        <div className="text-4xl">🚀</div>
        <div>
          <p className="text-white font-bold text-sm uppercase mb-1">Trạng thái vận hành</p>
          <p className="text-gray-500 text-xs italic">Chào Nghĩa! Hệ thống FigHub đang ghi nhận lượng truy cập ổn định. Hãy kiểm tra các đơn hàng mới trong mục Đơn hàng nhé.</p>
        </div>
      </div>
    </div>
  );
}