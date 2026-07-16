"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Kasir", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Produk", href: "/dashboard/products", icon: Package },
  { label: "Laporan", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

export function BottomNav({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden flex justify-around items-center h-16 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {bottomNavItems.map((item) => {
        if (item.href === "/dashboard/settings" && userRole === "KASIR") return null;

        const isActive = item.href === "/dashboard" 
          ? pathname === "/dashboard" 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] font-medium transition-colors",
              isActive ? "text-[#0D1F3D]" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <item.icon 
              className={cn(
                "w-5 h-5", 
                isActive ? "fill-[#0D1F3D]/20 stroke-[#0D1F3D]" : "stroke-slate-500"
              )} 
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
