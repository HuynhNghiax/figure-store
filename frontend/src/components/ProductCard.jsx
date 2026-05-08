import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ item }) {
  const { addToCart } = useCart();
  const isOutOfStock = item.stock <= 0;

  return (
    <div className={`group bg-[#161616] rounded-[32px] p-4 border border-white/5 transition-all duration-500 flex flex-col h-full ${isOutOfStock ? 'opacity-50 grayscale' : 'hover:border-orange-500/30 hover:-translate-y-2'}`}>
      <Link to={`/product/${item.id}`} className="block relative aspect-[4/5] overflow-hidden rounded-2xl mb-5 bg-[#0a0a0a]">
        <img 
          src={item.imageUrl} 
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          loading="lazy"
        />
        {isOutOfStock ? (
          <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black uppercase text-xs tracking-widest">Hết hàng</span>
        ) : item.isPreOrder && (
          <span className="absolute top-3 left-3 bg-orange-600 text-[9px] font-black uppercase px-3 py-1 rounded-full italic tracking-widest shadow-lg z-10">Pre-Order</span>
        )}
      </Link>

      <div className="px-2 flex flex-col flex-1">
        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-bold mb-1">{item.brand}</p>
        <Link to={`/product/${item.id}`}>
          <h3 className="text-white font-bold text-sm leading-tight mb-4 group-hover:text-orange-500 transition-colors line-clamp-2 h-10">
            {item.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-lg font-black italic text-white">
            {item.price?.toLocaleString()}đ
          </span>
          <button 
            disabled={isOutOfStock}
            onClick={() => addToCart(item)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all active:scale-90 shadow-xl ${isOutOfStock ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-orange-600 hover:text-white'}`}
          >
            {isOutOfStock ? '✕' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}