import Link from "next/link";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  UserCircle,
  FileText,
  CheckCircle2,
  Star,
  ArrowRight,
  Store,
  Zap,
  Shield,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { cn } from "@/lib/utils";

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: ShoppingCart,
    title: "Kasir Digital",
    desc: "Proses transaksi cepat dengan barcode scanner, multiple payment method (Cash, QRIS, Transfer), dan cetak struk otomatis.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: Package,
    title: "Manajemen Produk",
    desc: "Kelola ribuan produk, kategori, stok, dan harga beli-jual. Alert stok menipis agar tidak pernah kehabisan.",
    color: "bg-violet-500/10 text-violet-500",
  },
  {
    icon: BarChart3,
    title: "Laporan Penjualan",
    desc: "Laporan harian, mingguan, dan bulanan. Analitik laba-rugi, produk terlaris, dan grafik pertumbuhan penjualan.",
    color: "bg-[#00A76F]/10 text-[#00A76F]",
  },
  {
    icon: Users,
    title: "Multi Kasir",
    desc: "Tambahkan kasir dan admin dengan level akses berbeda. Pantau aktivitas setiap kasir secara real-time.",
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    icon: UserCircle,
    title: "Kelola Pelanggan",
    desc: "Database pelanggan lengkap, riwayat transaksi, dan fitur piutang untuk pelanggan yang belum bayar lunas.",
    color: "bg-pink-500/10 text-pink-500",
  },
  {
    icon: FileText,
    title: "Invoice Otomatis",
    desc: "Generate invoice dan nota penjualan secara otomatis. Kirim ke pelanggan via WhatsApp atau cetak langsung.",
    color: "bg-cyan-500/10 text-cyan-500",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "99.000",
    period: "bulan",
    badge: null,
    desc: "Cocok untuk toko kecil yang baru mulai digital",
    features: [
      "1 Kasir",
      "Hingga 500 produk",
      "Laporan harian & mingguan",
      "Cetak struk thermal",
      "Manajemen pelanggan",
      "Support via chat",
    ],
    cta: "Mulai Starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "199.000",
    period: "bulan",
    badge: "Paling Populer",
    desc: "Untuk bisnis berkembang yang butuh fitur lengkap",
    features: [
      "5 Kasir",
      "Produk tidak terbatas",
      "Laporan lengkap + ekspor Excel",
      "Manajemen supplier & hutang",
      "Piutang pelanggan",
      "Invoice PDF otomatis",
      "Support prioritas",
    ],
    cta: "Mulai Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "399.000",
    period: "bulan",
    badge: null,
    desc: "Untuk bisnis besar dengan kebutuhan enterprise",
    features: [
      "Kasir tidak terbatas",
      "Multi-outlet (cabang)",
      "Produk tidak terbatas",
      "Laporan konsolidasi lintas outlet",
      "Manajemen stok antar cabang",
      "API access",
      "Dedicated support & onboarding",
    ],
    cta: "Mulai Business",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Budi Santoso",
    role: "Pemilik Warung Sembako",
    city: "Surabaya",
    quote:
      "Sebelumnya saya pakai nota manual, sering salah hitung. Sekarang pakai Dicatat, transaksi lebih cepat dan laporan langsung ada. Recommended banget!",
    rating: 5,
    initial: "BS",
  },
  {
    name: "Siti Rahayu",
    role: "Pemilik Toko Baju Batik",
    city: "Solo",
    quote:
      "Fitur multi kasirnya sangat membantu pas lagi ramai. Saya bisa pantau omset tiap kasir dari HP sendiri. Sangat mudah dipakai karyawan.",
    rating: 5,
    initial: "SR",
  },
  {
    name: "Ahmad Fauzi",
    role: "Pemilik Apotek Mandiri",
    city: "Bandung",
    quote:
      "Manajemen stok obatnya sangat detail. Alert stok menipis bikin saya nggak pernah kehabisan barang lagi. Laporan bulanannya juga akurat.",
    rating: 5,
    initial: "AF",
  },
];

const trustBadges = [
  { icon: Shield, label: "Data Aman & Terenkripsi" },
  { icon: Zap, label: "Respon Cepat < 1 Detik" },
  { icon: Smartphone, label: "Mobile Friendly" },
  { icon: Store, label: "10.000+ Toko Aktif" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A76F]/10 text-[#00A76F] text-xs font-semibold uppercase tracking-widest mb-3">
      {children}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* NAVBAR */}
      <LandingNavbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-[#0D1F3D] overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#00A76F]/10 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-[#00A76F]/5 blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-3xl">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00A76F]/15 border border-[#00A76F]/25 text-[#00A76F] text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A76F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A76F]" />
              </span>
              Coba Gratis 14 Hari — Tanpa Kartu Kredit
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Aplikasi Kasir Modern{" "}
              <span className="text-[#00A76F]">untuk UMKM</span>{" "}
              Indonesia
            </h1>

            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              Sahabat UMKM Pengganti Nota — Kelola toko, catat transaksi, dan
              pantau bisnis dari mana saja. Mudah dipakai, harga terjangkau.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#00A76F] hover:bg-[#00A76F]/90 text-white text-base font-semibold transition-all shadow-lg shadow-[#00A76F]/30 group min-h-[48px]"
              >
                Coba Gratis 14 Hari
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#fitur"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-base font-semibold transition-all min-h-[48px]"
              >
                Lihat Demo
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-12 pt-8 border-t border-white/10">
              {trustBadges.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-2 text-slate-400 text-sm"
                >
                  <b.icon className="w-4 h-4 text-[#00A76F]" />
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 inset-x-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80L60 69.3C120 59 240 37 360 32C480 27 600 40 720 46.7C840 53 960 53 1080 48C1200 43 1320 32 1380 26.7L1440 21V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="fitur" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Fitur Unggulan</SectionLabel>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0D1F3D] mb-4">
              Semua yang Dibutuhkan Toko Anda
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Dari kasir harian hingga laporan bisnis — semua tersedia dalam
              satu platform yang mudah digunakan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-6 rounded-2xl border border-slate-100 bg-white hover:border-[#00A76F]/30 hover:shadow-lg hover:shadow-[#00A76F]/5 transition-all duration-300"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    f.color
                  )}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-[#0D1F3D] text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-[#00A76F]/10 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-[#00A76F]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="harga" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Harga</SectionLabel>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0D1F3D] mb-4">
              Harga Transparan, Tanpa Biaya Tersembunyi
            </h2>
            <p className="text-slate-500 text-lg">
              Mulai gratis 14 hari, batalkan kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border transition-shadow duration-300",
                  plan.highlight
                    ? "bg-[#0D1F3D] border-[#0D1F3D] shadow-2xl shadow-[#0D1F3D]/25 md:scale-[1.03]"
                    : "bg-white border-slate-200 hover:shadow-lg"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                    <Badge className="bg-[#00A76F] text-white border-0 px-4 py-1 text-xs font-semibold shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <p
                    className={cn(
                      "font-heading font-bold text-lg mb-1",
                      plan.highlight ? "text-white" : "text-[#0D1F3D]"
                    )}
                  >
                    {plan.name}
                  </p>
                  <p
                    className={cn(
                      "text-sm mb-5",
                      plan.highlight ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    {plan.desc}
                  </p>

                  <div className="flex items-end gap-1 mb-6">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        plan.highlight ? "text-slate-300" : "text-slate-500"
                      )}
                    >
                      Rp
                    </span>
                    <span
                      className={cn(
                        "font-heading text-4xl font-extrabold leading-none",
                        plan.highlight ? "text-white" : "text-[#0D1F3D]"
                      )}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={cn(
                        "text-sm mb-1",
                        plan.highlight ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      /{plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00A76F]" />
                        <span
                          className={cn(
                            "text-sm",
                            plan.highlight ? "text-slate-300" : "text-slate-600"
                          )}
                        >
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href="/register"
                    className={cn(
                      "flex items-center justify-center w-full h-11 rounded-lg font-semibold text-sm transition-all",
                      plan.highlight
                        ? "bg-[#00A76F] hover:bg-[#00A76F]/90 text-white shadow-lg shadow-[#00A76F]/30"
                        : "bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-400 text-sm mt-8">
            Semua paket termasuk 14 hari free trial. Tidak perlu kartu kredit.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="tentang" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <SectionLabel>Testimoni</SectionLabel>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0D1F3D] mb-4">
              Dipercaya Ribuan Pemilik Toko
            </h2>
            <p className="text-slate-500 text-lg">
              Bergabung bersama 10.000+ toko yang sudah bertransformasi digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card
                key={t.name}
                className="border-slate-100 hover:shadow-lg hover:shadow-slate-100 transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  {/* Quote */}
                  <blockquote className="text-slate-600 text-sm leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <Separator className="mb-4" />
                  {/* Person */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0D1F3D] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {t.initial}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1F3D] text-sm">
                        {t.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {t.role} · {t.city}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#00A76F] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
            Mulai Gratis Hari Ini
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Bergabunglah dengan ribuan pemilik UMKM yang sudah merasakan
            kemudahan mengelola toko dengan Dicatat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-lg bg-white text-[#00A76F] hover:bg-white/90 text-base font-bold transition-all shadow-lg shadow-black/10 group min-h-[48px]"
            >
              Daftar Sekarang — Gratis!
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-lg border border-white/40 text-white hover:bg-white/10 hover:border-white/60 text-base font-semibold transition-all min-h-[48px]"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-6">
            14 hari gratis · Tidak perlu kartu kredit · Batalkan kapan saja
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#0D1F3D] text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#00A76F] flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading font-bold text-white text-xl">
                  Dicatat
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Sahabat UMKM Pengganti Nota. Solusi kasir digital untuk toko
                Indonesia.
              </p>
            </div>

            {/* Produk */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">Produk</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Fitur", href: "#fitur" },
                  { label: "Harga", href: "#harga" },
                  { label: "Demo", href: "#fitur" },
                  { label: "Update Terbaru", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Perusahaan */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">
                Perusahaan
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Tentang Kami", href: "#tentang" },
                  { label: "Blog", href: "#" },
                  { label: "Karir", href: "#" },
                  { label: "Kontak", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">Legal</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Syarat & Ketentuan", href: "#" },
                  { label: "Kebijakan Privasi", href: "#" },
                  { label: "Keamanan", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © 2026 PT. Bin Aris Corp. Semua hak dilindungi.
            </p>
            <p className="text-xs text-slate-600">
              Dibuat dengan ❤️ untuk UMKM Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
