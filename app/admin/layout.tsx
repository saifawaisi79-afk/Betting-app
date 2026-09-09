import { AdminSidebar } from '../components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <div className="flex-1 bg-[#080c14] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
