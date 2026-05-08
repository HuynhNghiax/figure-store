import { createContext, useState, useContext, useEffect } from 'react';

// 1. Khởi tạo Context
const CartContext = createContext();

// 2. Tạo Provider để bọc toàn bộ ứng dụng
export const CartProvider = ({ children }) => {
  // Khởi tạo state từ LocalStorage nếu có, nếu không thì để mảng rỗng
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('fighub_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Tự động lưu vào LocalStorage mỗi khi danh sách sản phẩm thay đổi
  useEffect(() => {
    localStorage.setItem('fighub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Hàm thêm sản phẩm vào giỏ
  const addToCart = (product) => {
    setCartItems((prevItems) => {
      // Kiểm tra xem sản phẩm đã có trong giỏ chưa (dựa vào id)
      const isExisting = prevItems.find((item) => item.id === product.id);

      if (isExisting) {
        // Nếu có rồi, chỉ tăng số lượng lên 1
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Nếu chưa có, thêm mới vào mảng và đặt số lượng mặc định là 1
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  // Hàm xóa sản phẩm khỏi giỏ
  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Hàm cập nhật số lượng (tăng/giảm)
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return; // Không cho phép số lượng nhỏ hơn 1
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Hàm xóa sạch giỏ hàng (dùng sau khi thanh toán thành công)
  const clearCart = () => {
    setCartItems([]);
  };

  // Tính tổng số lượng món trong giỏ để hiện lên Navbar
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart,
        totalItems,
        totalPrice 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// 3. Custom Hook để các Component khác gọi dữ liệu cho gọn
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng trong CartProvider');
  }
  return context;
};