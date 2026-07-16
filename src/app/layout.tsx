import type { Metadata } from "next";
import { Nunito_Sans, Inter } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Dicatat — Aplikasi Kasir Modern untuk UMKM Indonesia",
    template: "%s | Dicatat",
  },
  description:
    "Sahabat UMKM Pengganti Nota. Kelola toko, catat transaksi, dan pantau bisnis dari mana saja. Coba gratis 14 hari.",
  keywords: ["POS", "kasir", "aplikasi toko", "UMKM", "manajemen stok", "Indonesia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${nunitoSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
