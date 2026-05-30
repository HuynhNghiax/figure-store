/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { getStoredUser } from '../utils/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('fighub_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('fighub_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const isExisting = prevItems.find((item) => item.id === product.id);
      const currentQty = isExisting ? isExisting.quantity : 0;
      if (currentQty + 1 > product.stock) {
        return prevItems;
      }
      if (isExisting) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const addToCartWithCheck = (product, onReject) => {
    // Kiểm tra đăng nhập
    const user = getStoredUser();
    if (!user) {
      onReject?.('Vui lòng đăng nhập để mua hàng!');
      return false;
    }
    const existing = cartItems.find((i) => i.id === product.id);
    const nextQty = (existing?.quantity || 0) + 1;
    if (nextQty > product.stock) {
      onReject?.(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
      return false;
    }
    addToCart(product);
    return true;
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return false;
    const item = cartItems.find((i) => i.id === id);
    if (item && newQuantity > item.stock) {
      return false;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    return true;
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        addToCartWithCheck,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng trong CartProvider');
  }
  return context;
};
