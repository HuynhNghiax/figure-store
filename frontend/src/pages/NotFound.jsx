import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-orange-600 mb-4 italic">404</div>
        <h1 className="text-2xl font-black italic uppercase text-white mb-4">
          Trang không tồn tại
        </h1>
        <p className="text-gray-500 text-xs mb-10 uppercase tracking-widest font-bold">
          Có vẻ như bạn đã lạc vào vùng đất không có mô hình nào ở đây cả!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
          >
            Về trang chủ
          </Link>
          <Link
            to="/cart"
            className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
          >
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
}