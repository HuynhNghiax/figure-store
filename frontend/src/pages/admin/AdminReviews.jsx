import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authFetch, API_BASE } from '../../utils/api';

const STARS = [null, 1, 2, 3, 4, 5];

function StarDisplay({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-white/10'}>★</span>
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [filterRating, setFilterRating] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 15;

  const fetchReviews = (page = 0, rating = null) => {
    setLoading(true);
    let url = `/api/reviews/admin/all?page=${page}&size=${PAGE_SIZE}`;
    if (rating !== null) url += `&rating=${rating}`;

    authFetch(url)
      .then(res => res.json())
      .then(data => {
        setReviews(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Lỗi tải danh sách đánh giá!');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews(currentPage, filterRating);
  }, [currentPage, filterRating]);

  const handleFilterRating = (r) => {
    setFilterRating(r);
    setCurrentPage(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa đánh giá này?')) return;
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Đã xóa đánh giá!');
        fetchReviews(currentPage, filterRating);
      } else {
        const d = await res.json();
        toast.error(d.message || 'Xóa thất bại!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black italic uppercase text-white">
          Quản lý <span className="text-orange-500">Đánh giá</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? '...' : `${totalElements} đánh giá từ khách hàng`}
        </p>
      </div>

      {/* Filter stars */}
      <div className="flex flex-wrap gap-2">
        {STARS.map(r => (
          <button
            key={r ?? 'all'}
            type="button"
            onClick={() => handleFilterRating(r)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              filterRating === r
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'bg-[#161616] text-gray-400 border border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            {r === null ? '⭐ Tất cả' : `${'★'.repeat(r)} (${r} sao)`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111] rounded-[28px] border border-white/5 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500">
          <span>Người dùng</span>
          <span>Nội dung</span>
          <span className="text-center">Sản phẩm</span>
          <span className="text-center">Sao</span>
          <span className="text-center">Xóa</span>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-gray-500 italic text-sm">
            Không tìm thấy đánh giá nào.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {reviews.map(review => (
              <div
                key={review.id}
                className="grid grid-cols-[1fr_2fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-all group"
              >
                {/* Username */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                    {review.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{review.username}</p>
                    <p className="text-[10px] text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {review.comment || <span className="italic text-gray-600">Không có nội dung</span>}
                </p>

                {/* Product ID */}
                <div className="text-center">
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 text-[10px] font-black text-gray-400 border border-white/5">
                    #{review.productId}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex justify-center">
                  <StarDisplay rating={review.rating} />
                </div>

                {/* Delete */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    disabled={deletingId === review.id}
                    onClick={() => handleDelete(review.id)}
                    className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm disabled:opacity-40 flex items-center justify-center"
                  >
                    {deletingId === review.id ? '...' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-5 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 uppercase font-black tracking-widest transition-all hover:border-white/20"
          >
            ← Trước
          </button>
          <span className="text-xs text-gray-500 font-bold">
            Trang <span className="text-white">{currentPage + 1}</span> / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-5 py-2.5 bg-[#161616] border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 uppercase font-black tracking-widest transition-all hover:border-white/20"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
