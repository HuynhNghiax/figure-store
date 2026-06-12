import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authFetch } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, products: 0, users: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch("/api/orders?page=0&size=1000").then(res => res.json()),
      authFetch("/api/products/admin?page=0&size=1000").then(res => res.json()),
      authFetch("/api/users?page=0&size=1").then(res => res.json()),
    ]).then(([ordersPage, productsPage, usersPage]) => {
      // Fix: ordersPage là Page object, phải dùng .content
      const orders = Array.isArray(ordersPage) ? ordersPage : (ordersPage.content || []);
      const products = Array.isArray(productsPage) ? productsPage : (productsPage.content || []);
      const totalUsers = usersPage.totalElements || 0;

      // Chỉ tính doanh thu từ đơn đã thanh toán
      const totalRevenue = orders
        .filter(o => o.paymentStatus === 'PAID')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalOrders: ordersPage.totalElements || orders.length,
        revenue: totalRevenue,
        products: productsPage.totalElements || products.length,
        users: totalUsers,
      });

      // Biểu đồ: 10 đơn hàng gần nhất, sắp xếp theo ID tăng dần
      const recent = [...orders].slice(0, 10).reverse().map(order => ({
        name: `#${order.id}`,
        doanhThu: order.paymentStatus === 'PAID' ? (order.totalAmount || 0) : 0,
      }));
      setChartData(recent);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Doanh thu (đã TT)", value: `${stats.revenue.toLocaleString()}đ`, icon: "💰", color: "text-green-500" },
    { label: "Tổng đơn hàng", value: stats.totalOrders, icon: "📋", color: "text-blue-500" },
    { label: "Sản phẩm trong kho", value: stats.products, icon: "📦", color: "text-orange-500" },
    { label: "Khách hàng", value: stats.users, icon: "👤", color: "text-purple-400" },
  ];

  if (loading) {
    return (
      <div className="space-y-10">
        <h1 className="text-3xl font-black italic uppercase text-white">Tổng quan <span className="text-orange-500">Hệ thống</span></h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#161616] p-8 rounded-[40px] border border-white/5 shadow-xl animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-black italic uppercase text-white">Tổng quan <span className="text-orange-500">Hệ thống</span></h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#161616] p-8 rounded-[40px] border border-white/5 shadow-xl hover:border-white/10 transition-all">
            <div className="text-3xl mb-4">{card.icon}</div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{card.label}</p>
            <p className={`text-2xl font-black italic ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] p-10 rounded-[40px] border border-white/5">
        <h2 className="text-xl font-bold mb-8 uppercase italic tracking-tighter">Biểu đồ <span className="text-orange-500">Doanh thu 10 đơn gần nhất</span></h2>
        {chartData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-gray-500 text-sm italic">Chưa có dữ liệu đơn hàng</div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  formatter={(value) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                />
                <Bar dataKey="doanhThu" fill="#ea580c" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
