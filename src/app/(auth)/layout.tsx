import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dicatat — Masuk",
  description: "Masuk ke akun Dicatat Anda",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1F3D] via-[#0D1F3D]/90 to-[#00A76F]/20 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
