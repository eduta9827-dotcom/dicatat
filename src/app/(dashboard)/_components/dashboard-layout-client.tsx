"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  tenantName: string;
}

export function DashboardLayoutClient({
  children,
  userName,
  userRole,
  tenantName,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();

  // Helper to get a nice title based on route
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Beranda";
    if (pathname.startsWith("/dashboard/pos")) return "Kasir (POS)";
    if (pathname.startsWith("/dashboard/products")) return "Produk";
    if (pathname.startsWith("/dashboard/categories")) return "Kategori";
    if (pathname.startsWith("/dashboard/customers")) return "Pelanggan";
    if (pathname.startsWith("/dashboard/transactions")) return "Transaksi";
    if (pathname.startsWith("/dashboard/reports")) return "Laporan";
    if (pathname.startsWith("/dashboard/suppliers")) return "Supplier";
    if (pathname.startsWith("/dashboard/users")) return "Pengguna";
    if (pathname.startsWith("/dashboard/settings")) return "Pengaturan";
    return "Dashboard";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar userName={userName} userRole={userRole} />

      <div className="flex-1 flex flex-col min-w-0 md:ml-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-200 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800">
                {tenantName}
              </span>
              <span className="text-xs text-slate-500">{userName}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#0D1F3D] flex items-center justify-center shrink-0">
              <span className="text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={`flex-1 pb-20 md:pb-0 ${!pathname.startsWith("/dashboard/pos") ? "overflow-auto p-4 md:p-6" : "overflow-hidden"}`}>
          {children}
        </main>

        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}
