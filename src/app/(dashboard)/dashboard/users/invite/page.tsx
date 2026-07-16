"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inviteSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "KASIR"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function InviteUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "KASIR"
    }
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/dashboard/users");
      } else {
        setError(data.error || "Gagal mengundang pengguna");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Undang Pengguna</h2>
          <p className="text-sm text-slate-500">Berikan akses toko ke tim atau karyawan Anda.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <Input 
                  {...register("email")} 
                  className="pl-10"
                  placeholder="email@contoh.com" 
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Nama Lengkap (Opsional)</Label>
              <Input {...register("name")} placeholder="Nama Karyawan" />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Pilih Peran (Role) <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div 
                  onClick={() => setValue("role", "ADMIN")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "ADMIN" ? "border-[#00A76F] bg-[#00A76F]/5" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Admin</span>
                    {selectedRole === "ADMIN" && <span className="w-4 h-4 rounded-full bg-[#00A76F] border-4 border-white shadow-[0_0_0_1px_#00A76F]" />}
                  </div>
                  <p className="text-xs text-slate-500">Dapat mengelola produk, laporan, kasir, dan pengaturan toko.</p>
                </div>
                
                <div 
                  onClick={() => setValue("role", "KASIR")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRole === "KASIR" ? "border-[#00A76F] bg-[#00A76F]/5" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">Kasir</span>
                    {selectedRole === "KASIR" && <span className="w-4 h-4 rounded-full bg-[#00A76F] border-4 border-white shadow-[0_0_0_1px_#00A76F]" />}
                  </div>
                  <p className="text-xs text-slate-500">Hanya dapat mengakses transaksi POS dan daftar produk.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link href="/dashboard/users">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
            <Button 
              type="submit" 
              className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white px-8"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Kirim Undangan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
