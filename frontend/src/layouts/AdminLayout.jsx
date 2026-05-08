import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* Sidebar bên trái cố định */}
      <AdminSidebar />
      
      {/* Nội dung thay đổi bên phải */}
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}