import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { authFetch } from '../../utils/api';

const STATUS_COLOR = {
  PENDING:   { label: 'Chờ xử lý', color: '#eab308', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  SHIPPED:   { label: 'Đang giao',  color: '#38bdf8', bg: 'bg-sky-500/10 border-sky-500/20' },
  COMPLETED: { label: 'Hoàn thành', color: '#22c55e', bg: 'bg-green-500/10 border-green-500/20' },
  DELIVERED: { label: 'Đã giao',    color: '#a3e635', bg: 'bg-lime-500/10 border-lime-500/20' },
  CANCELLED: { label: 'Đã hủy',     color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20' },
};
const PIE_COLORS = ['#22c55e', '#eab308', '#38bdf8', '#a3e635', '#ef4444'];

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN');
const fmtM = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [monthly, setMonthly]   = useState([]);
  const [yearly, setYearly]     = useState([]);
  const [years, setYears]       = useState([]);
  const [selYear, setSelYear]   = useState(new Date().getFullYear());
  const [chartMode, setChartMode] = useState('monthly'); // 'monthly' | 'yearly' | 'recent'
  const [loading, setLoading]   = useState(true);

  // Load dashboard stats chính
  useEffect(() => {
    authFetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setMonthly(data.monthlyChart || []);
        setYears(data.availableYears || [new Date().getFullYear()]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load yearly khi chọn tab yearly
  useEffect(() => {
    if (chartMode !== 'yearly') return;
    authFetch("/api/admin/stats/yearly")
      .then(r => r.json())
      .then(d => setYearly(d.data || []));
  }, [chartMode]);

  // Load monthly khi đổi năm
  const loadMonthly = useCallback((yr) => {
    authFetch(`/api/admin/stats/monthly?year=${yr}`)
      .then(r => r.json())
      .then(d => setMonthly(d.data || []));
  }, []);

  useEffect(() => {
    if (chartMode === 'monthly') loadMonthly(selYear);
  }, [selYear, chartMode, loadMonthly]);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-56 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-[#161616] rounded-[28px]" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-[#161616] rounded-[20px]" />)}
      </div>
      <div className="h-80 bg-[#161616] rounded-[32px]" />
    </div>
  );

  if (!stats) return (
    <div className="text-center text-gray-500 py-20 italic">Không thể tải dữ liệu thống kê.</div>
  );

  const mainCards = [
    { label: "Doanh thu (đã TT)", value: `${fmt(stats.revenue)}đ`,    icon: "💰", color: "text-green-400",  bg: "bg-green-500/5 border-green-500/15" },
    { label: "Tổng đơn hàng",     value: fmt(stats.totalOrders),      icon: "📋", color: "text-blue-400",   bg: "bg-blue-500/5 border-blue-500/15" },
    { label: "Sản phẩm đang bán", value: fmt(stats.totalProducts),    icon: "📦", color: "text-orange-400", bg: "bg-orange-500/5 border-orange-500/15" },
    { label: "Khách hàng",        value: fmt(stats.totalUsers),       icon: "👤", color: "text-purple-400", bg: "bg-purple-500/5 border-purple-500/15" },
  ];

  // ── Dùng trực tiếp field JPQL (đáng tin cậy, không phụ thuộc PostgreSQL lowercase) ──
  const statusBreakdown = [
    { key: 'PENDING',   label: 'Chờ xử lý',  count: stats.pendingOrders   || 0, color: '#eab308', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { key: 'SHIPPED',   label: 'Đang giao',   count: stats.shippedOrders   || 0, color: '#38bdf8', bg: 'bg-sky-500/10 border-sky-500/20' },
    { key: 'COMPLETED', label: 'Hoàn thành',  count: stats.completedOrders || 0, color: '#22c55e', bg: 'bg-green-500/10 border-green-500/20' },
    { key: 'DELIVERED', label: 'Đã giao',     count: stats.deliveredOrders || 0, color: '#a3e635', bg: 'bg-lime-500/10 border-lime-500/20' },
    { key: 'CANCELLED', label: 'Đã hủy',      count: stats.cancelledOrders || 0, color: '#ef4444', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  // Pie chart data — lọc status nào có đơn
  const pieData = statusBreakdown
    .filter(s => s.count > 0)
    .map(s => ({ name: s.label, value: s.count, color: s.color }));

  // Recent chart: 12 đơn gần nhất
  const recentChart = (stats.recentChart || [])
    .slice().reverse()
    .map(item => ({ name: `#${item.name}`, doanhThu: Number(item.doanhThu) || 0 }));

  const topProducts = stats.topProducts || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black italic uppercase text-white">
        Tổng quan <span className="text-orange-500">Hệ thống</span>
      </h1>

      {/* ── Main stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {mainCards.map((card, i) => (
          <div key={i} className={`p-7 rounded-[28px] border shadow-xl hover:scale-[1.02] transition-all cursor-default ${card.bg}`}>
            <div className="text-3xl mb-4">{card.icon}</div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">{card.label}</p>
            <p className={`text-xl font-black italic ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Order status breakdown ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statusBreakdown.map((s) => (
          <div key={s.key} className={`flex items-center gap-3 p-4 rounded-[20px] border ${s.bg}`}>
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: s.color }} />
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{s.label}</p>
              <p className="text-lg font-black italic" style={{ color: s.color }}>
                {fmt(s.count)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart section ── */}
      <div className="bg-[#111] p-8 rounded-[36px] border border-white/5 space-y-6">
        {/* Tab bar + năm selector */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold italic uppercase tracking-tighter">
            📊 Biểu đồ <span className="text-orange-500">Doanh thu</span>
          </h2>
          <div className="flex items-center gap-3">
            {/* Tab buttons */}
            {[
              { key: 'monthly', label: 'Theo tháng' },
              { key: 'yearly',  label: 'Theo năm' },
              { key: 'recent',  label: 'Đơn gần nhất' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setChartMode(t.key)}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                  chartMode === t.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Year selector (chỉ hiện khi tab monthly) */}
            {chartMode === 'monthly' && (
              <select
                value={selYear}
                onChange={e => setSelYear(Number(e.target.value))}
                className="bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Chart body */}
        <div className="h-[300px] w-full">
          {chartMode === 'monthly' && (
            monthly.length === 0
              ? <EmptyChart />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtM} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161616', border: '1px solid #2a2a2a', borderRadius: '14px', fontSize: 12 }}
                      formatter={(v, n) => n === 'doanhThu'
                        ? [`${fmt(v)}đ`, 'Doanh thu']
                        : [`${v} đơn`, 'Số đơn']}
                    />
                    <Bar dataKey="doanhThu" name="doanhThu" fill="#ea580c" radius={[8,8,0,0]} />
                    <Bar dataKey="sodon"    name="sodon"    fill="#3b82f6" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
          )}

          {chartMode === 'yearly' && (
            yearly.length === 0
              ? <EmptyChart />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="nam" stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtM} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161616', border: '1px solid #2a2a2a', borderRadius: '14px', fontSize: 12 }}
                      formatter={(v, n) => n === 'doanhThu'
                        ? [`${fmt(v)}đ`, 'Doanh thu']
                        : [`${v} đơn`, 'Số đơn']}
                    />
                    <Line type="monotone" dataKey="doanhThu" name="doanhThu" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 5, fill: '#ea580c' }} />
                    <Line type="monotone" dataKey="sodon"    name="sodon"    stroke="#3b82f6" strokeWidth={2}   dot={{ r: 4, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              )
          )}

          {chartMode === 'recent' && (
            recentChart.length === 0
              ? <EmptyChart />
              : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentChart} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtM} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161616', border: '1px solid #2a2a2a', borderRadius: '14px', fontSize: 12 }}
                      formatter={(v) => [`${fmt(v)}đ`, 'Doanh thu']}
                    />
                    <Bar dataKey="doanhThu" fill="#ea580c" radius={[10,10,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
          )}
        </div>

        {/* Chart legend */}
        {(chartMode === 'monthly' || chartMode === 'yearly') && (
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"/>Doanh thu (đ)</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>Số đơn hàng</span>
          </div>
        )}
      </div>

      {/* ── Bottom: Top products + Pie chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Top products */}
        <div className="xl:col-span-3 bg-[#111] rounded-[32px] border border-white/5 overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-base font-bold uppercase italic tracking-tighter">
              🏆 Top <span className="text-orange-500">10 Sản phẩm bán chạy</span>
            </h2>
            <span className="text-[10px] text-gray-600 italic">Dựa trên đơn hoàn thành</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-14 text-center text-gray-600 text-sm italic">
              Chưa có đơn hoàn thành nào.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4 px-7 py-4 hover:bg-white/[0.02] transition-all">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    i === 1 ? 'bg-gray-400/10 text-gray-300 border-gray-400/20' :
                    i === 2 ? 'bg-amber-700/20 text-amber-600 border-amber-700/30' :
                               'bg-white/5 text-gray-500 border-white/5'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {p.productName || p.productname || `Sản phẩm #${p.productId || p.productid}`}
                    </p>
                    <p className="text-[10px] text-gray-600 font-bold mt-0.5">
                      ID #{p.productId || p.productid}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-orange-400 font-black text-base italic">
                      {fmt(p.totalSold || p.totalsold)} sp
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {fmt(p.totalRevenue || p.totalrevenue)}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie chart đơn hàng theo trạng thái */}
        <div className="xl:col-span-2 bg-[#111] rounded-[32px] border border-white/5 p-7 flex flex-col">
          <h2 className="text-base font-bold uppercase italic tracking-tighter mb-6">
            🍩 Phân bổ <span className="text-orange-500">Đơn hàng</span>
          </h2>
          {pieData.length === 0 || pieData.every(d => d.value === 0) ? (
            <div className="flex-1 flex items-center justify-center text-gray-600 text-sm italic">
              Chưa có đơn hàng nào.
            </div>
          ) : (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: 12 }}
                    formatter={(v, n) => [`${fmt(v)} đơn`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom legend */}
              <div className="space-y-2 mt-2">
                {pieData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-gray-400">{d.name}</span>
                    </div>
                    <span className="font-bold text-white">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
      Chưa có dữ liệu để hiển thị.
    </div>
  );
}
