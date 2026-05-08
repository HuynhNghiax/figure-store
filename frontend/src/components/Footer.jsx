import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Cột 1: Thương hiệu */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black rotate-3">
                <span className="text-white text-xl">F</span>
              </div>
              <span className="text-2xl font-black italic text-white uppercase tracking-tighter">
                FIG<span className="text-orange-500">HUB</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed italic">
              Nơi hội tụ những siêu phẩm mô hình giới hạn dành cho các nhà sưu tầm thực thụ. Đam mê không giới hạn.
            </p>
            <div className="flex space-x-4">
              {['FB', 'IG', 'YT', 'TT'].map(social => (
                <span key={social} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold hover:bg-orange-600 transition-colors cursor-pointer">
                  {social}
                </span>
              ))}
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div>
            <h3 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8">Khám phá</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><Link to="/" className="hover:text-orange-500 transition">Trang chủ</Link></li>
              <li><Link to="/products" className="hover:text-orange-500 transition">Tất cả sản phẩm</Link></li>
              <li><Link to="/cart" className="hover:text-orange-500 transition">Giỏ hàng</Link></li>
              <li><Link to="/profile" className="hover:text-orange-500 transition">Đơn hàng của tôi</Link></li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ */}
          <div>
            <h3 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8">Hỗ trợ</h3>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li className="hover:text-orange-500 cursor-pointer">Chính sách bảo hành</li>
              <li className="hover:text-orange-500 cursor-pointer">Vận chuyển 24/7</li>
              <li className="hover:text-orange-500 cursor-pointer">Câu hỏi thường gặp</li>
              <li className="hover:text-orange-500 cursor-pointer">Liên hệ hợp tác</li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8">Địa chỉ</h3>
            <div className="space-y-4 text-sm text-gray-500 italic">
              <p>📍 Khu phố 6, P. Linh Trung, Thủ Đức, TP. HCM</p>
              <p>📞 +84 123 456 789</p>
              <p>✉️ support@fighub.com</p>
              <div className="pt-4">
                <span className="inline-block px-4 py-2 border border-orange-600/30 rounded-full text-orange-500 text-[10px] font-black uppercase">
                  Mở cửa: 08:00 - 22:00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh bản quyền & Credit */}
        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            © {currentYear} FIG HUB - All Rights Reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 font-bold uppercase">Phát triển bởi:</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg text-white text-[10px] font-black italic uppercase tracking-widest border border-white/10">
              Nghĩa & NHân <span className="text-orange-500 ml-1">NLU</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}