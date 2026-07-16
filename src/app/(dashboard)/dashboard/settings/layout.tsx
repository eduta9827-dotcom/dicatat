"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: "Profil Toko", href: "/dashboard/settings/store" },
    { label: "Langganan & Tagihan", href: "/dashboard/settings/billing" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-[#0D1F3D] text-[#0D1F3D]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}
