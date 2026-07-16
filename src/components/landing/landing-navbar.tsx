"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Harga", href: "#harga" },
  { label: "Tentang", href: "#tentang" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0D1F3D]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#00A76F] flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight font-heading">
              Dicatat
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm bg-[#00A76F] hover:bg-[#00A76F]/90 text-white rounded-lg font-medium transition-colors shadow-md shadow-[#00A76F]/30"
            >
              Coba Gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 bg-[#0D1F3D]/98 backdrop-blur-md",
          mobileOpen ? "max-h-72 border-t border-white/10" : "max-h-0"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-3 text-sm text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors min-h-[44px] flex items-center"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <Link
              href="/login"
              className="w-full text-center px-4 py-3 text-sm text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="w-full text-center px-4 py-3 text-sm bg-[#00A76F] hover:bg-[#00A76F]/90 text-white rounded-lg font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
