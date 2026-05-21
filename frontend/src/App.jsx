import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile'; // Đã import chính xác
import OrderSuccess from './pages/OrderSuccess';
import PaymentResult from './pages/PaymentResult';
import { getStoredUser, getToken } from './utils/api';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLayout from './layouts/AdminLayout';
// Thành phần bảo vệ Route cho Admin
const ProtectedRoute = ({ children }) => {
  const user = getStoredUser();
  const token = getToken();
  if (!token || !user || user.role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <Router>
        <div className="bg-[#0a0a0a] min-h-screen text-white font-sans flex flex-col">
          <Toaster position="top-right" />

          {/* Ẩn Navbar khi vào trang quản trị Admin */}
          <Routes>
            <Route path="/admin/*" element={null} />
            <Route path="*" element={<Navbar />} />
          </Routes>

          {/* Khu vực nội dung chính của website */}
          <div className="flex-1"> 
            <Routes>
              {/* Luồng Client công cộng */}
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile" element={<Profile />} /> {/* Kích hoạt trang lịch sử đơn hàng */}
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/payment/result" element={<PaymentResult />} />
              
              {/* Luồng quản trị nội bộ Admin */}
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            </Routes>
          </div>

          {/* Ẩn Footer khi vào trang quản trị Admin */}
          <Routes>
            <Route path="/admin/*" element={null} />
            <Route path="*" element={<Footer />} />
          </Routes>
        </div>
    </Router>
  );
}

export default App;