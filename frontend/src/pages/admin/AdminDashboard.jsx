import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authFetch } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, revenue: 0, totalProducts: 0, totalUsers: 0,
    pendingOrders: 0, shippedOrders: 0, totalReviews: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats({
          revenue:        data.revenue        ?? 0,
          totalOrders:    data.totalOrders    ?? 0,
          totalProducts:  data.totalProducts  ?? 0,
          totalUsers:     data.totalUsers     ?? 0,
          pendingOrders:  data.pendingOrders  ?? 0,
          shippedOrders:  data.shippedOrders  ?? 0,
          totalReviews:   data.totalReviews   ?? 0,
        });

        const chart = (data.recentChart || [])
          .slice()
          .reverse()
          .map(item => ({
            name: `#${item.name}`,
            doanhThu: Number(item.doanhThu) || 0,
          }));
        setChartData(chart);
        setTopProducts(data.topProducts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mainCards = [
    { label: "Doanh thu (đã TT)", value: `${Number(stats.revenue).toLocaleString()}đ`, icon: "💰", color: "text-green-400",  bg: "bg-green-500/5 border-green-500/10" },
    { label: "Tổng đơn hàng",     value: stats.totalOrders,                             icon: "📋", color: "text-blue-400",   bg: "bg-blue-500/5 border-blue-500/10" },
    { label: "Sản phẩm kho",      value: stats.totalProducts,                           icon: "📦", color: "text-orange-400", bg: "bg-orange-500/5 border-orange-500/10" },
    { label: "Khách hàng",        value: stats.totalUsers,                              icon: "👤", color: "text-purple-400", bg: "bg-purple-500/5 border-purple-500/10" },
  ];

  const miniCards = [
    { label: "Chờ xử lý", value: stats.pendingOrders, icon: "⏳", color: "text-yellow-400", bg: "bg-yellow-500/5 border-yellow-500/10" },
    { label: "Đang giao",  value: stats.shippedOrders, icon: "🚚", color: "text-sky-400",    bg: "bg-sky-500/5 border-sky-500/10" },
    { label: "Đánh giá",   value: stats.totalReviews,  icon: "⭐", color: "text-amber-400",  bg: "bg-amber-500/5 border-amber-500/10" },
  ];

  if (loading) {
    return (
      <div className="space-y-10">
        <h1 className="text-3xl font-black italic uppercase text-white">Tổng quan <span className="text-orange-500">Hệ thống</span></h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#161616] p-8 rounded-[32px] border border-white/5 shadow-xl animate-pulse h-36" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#161616] p-6 rounded-[24px] border border-white/5 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black italic uppercase text-white">
        Tổng quan <span className="text-orange-500">Hệ thống</span>
      </h1>

      {/* Main stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {mainCards.map((card, i) => (
          <div key={i} className={`p-7 rounded-[32px] border shadow-xl hover:scale-[1.02] transition-all cursor-default ${card.bg}`}>
            <div className="text-3xl mb-4">{card.icon}</div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">{card.label}</p>
            <p className={`text-2xl font-black italic ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {miniCards.map((card, i) => (
          <div key={i} className={`flex items-center gap-4 p-5 rounded-[24px] border transition-all ${card.bg}`}>
            <span className="text-2xl">{card.icon}</span>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{card.label}</p>
              <p className={`text-xl font-black italic ${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#111] p-10 rounded-[40px] border border-white/5">
        <h2 className="text-xl font-bold mb-8 uppercase italic tracking-tighter">
          Biểu đồ <span className="text-orange-500">Doanh thu 10 đơn gần nhất</span>
        </h2>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm italic">
            Chưa có dữ liệu đơn hàng
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                  formatter={(v) => [`${v.toLocaleString()}đ`, 'Doanh thu']}
                />
                <Bar dataKey="doanhThu" fill="#ea580c" radius={[10, 10, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top products table */}
      <div className="bg-[#111] rounded-[32px] border border-white/5 overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5">
          <h2 className="text-lg font-bold uppercase italic tracking-tighter">
            🏆 Top <span className="text-orange-500">Sản phẩm bán chạy</span>
          </h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm italic">
            Chưa có đơn hoàn thành nào.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-5 px-8 py-5 hover:bg-white/[0.02] transition-all">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  i === 1 ? 'bg-gray-400/10 text-gray-300 border border-gray-400/20' :
                  i === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                           'bg-white/5 text-gray-500 border border-white/5'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">
                    {p.productName || `Sản phẩm #${p.productId}`}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">
                    ID: #{p.productId}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-orange-400 font-black text-lg italic">{Number(p.totalSold).toLocaleString()} sp</p>
                  <p className="text-[10px] text-gray-500 font-bold">{Number(p.totalRevenue).toLocaleString()}đ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
