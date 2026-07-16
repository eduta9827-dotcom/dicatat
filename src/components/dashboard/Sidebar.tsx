"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  Receipt, 
  BarChart3, 
  Truck, 
  UserCog, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const sidebarNavItems = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Kasir (POS)", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Produk", href: "/dashboard/products", icon: Package },
  { label: "Kategori", href: "/dashboard/categories", icon: Tags },
  { label: "Pelanggan", href: "/dashboard/customers", icon: Users },
  { label: "Transaksi", href: "/dashboard/transactions", icon: Receipt },
  { label: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Supplier", href: "/dashboard/suppliers", icon: Truck },
  { label: "Pengguna", href: "/dashboard/users", icon: UserCog },
  { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden md:flex h-full">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0D1F3D] flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">D</span>
        </div>
        <span className="font-bold text-xl text-[#0D1F3D]">Dicatat</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {sidebarNavItems.map((item) => {
          if (item.href === "/dashboard/users" && userRole !== "OWNER") return null;
          if (item.href === "/dashboard/settings" && userRole === "KASIR") return null;

          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#0D1F3D] text-white" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0D1F3D]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userRole}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
