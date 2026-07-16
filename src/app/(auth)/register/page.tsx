"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, Store, User, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    storeName: z
      .string()
      .min(3, { message: "Nama toko minimal 3 karakter" })
      .max(50, { message: "Nama toko maksimal 50 karakter" }),
    email: z.string().email({ message: "Email tidak valid" }),
    password: z
      .string()
      .min(8, { message: "Password minimal 8 karakter" })
      .regex(/[A-Za-z]/, { message: "Harus mengandung huruf" })
      .regex(/[0-9]/, { message: "Harus mengandung angka" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setServerError(null);
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          store_name: data.storeName,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("Email ini sudah terdaftar. Silakan masuk.");
      } else {
        setServerError("Terjadi kesalahan. Coba lagi.");
      }
      return;
    }

    if (authData.user) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authId: authData.user.id,
          email: data.email,
          storeName: data.storeName,
        }),
      }).then(r => r.json());
      
      if (!res.success) {
        setServerError(res.error || "Gagal membuat data toko.");
        return;
      }
    }

    // Redirect to dashboard (if auto-confirm is on, this will succeed. If off, proxy will catch and redirect to login)
    router.push("/dashboard");
    router.refresh();
  }

  if (success) {
    return (
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#00A76F] mx-auto" />
          <h2 className="text-xl font-bold text-[#0D1F3D]">
            Pendaftaran Berhasil!
          </h2>
          <p className="text-sm text-muted-foreground">
            Kami telah mengirimkan link verifikasi ke email Anda. Silakan cek
            inbox (dan folder spam) untuk mengaktifkan akun.
          </p>
          <Button
            className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white"
            onClick={() => router.push("/login")}
          >
            Kembali ke Halaman Masuk
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0D1F3D] flex items-center justify-center">
              <Store className="w-5 h-5 text-[#00A76F]" />
            </div>
            <span className="text-2xl font-bold text-[#0D1F3D]">Dicatat</span>
          </div>
        </div>
        <CardTitle className="text-xl text-center text-[#0D1F3D]">
          Daftarkan Toko Anda
        </CardTitle>
        <CardDescription className="text-center">
          Mulai coba gratis 14 hari, tanpa kartu kredit
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {serverError}
            </div>
          )}

          {/* Nama Toko */}
          <div className="space-y-1.5">
            <Label htmlFor="storeName">Nama Toko</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="storeName"
                type="text"
                placeholder="Toko Maju Jaya"
                className="pl-9"
                {...register("storeName")}
              />
            </div>
            {errors.storeName && (
              <p className="text-xs text-red-500">{errors.storeName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="nama@tokoku.com"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 karakter + angka"
                className="pl-9"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                className="pl-9"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00A76F] hover:bg-[#00A76F]/90 text-white mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mendaftar...
              </>
            ) : (
              "Daftar Sekarang — Gratis!"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Dengan mendaftar, Anda menyetujui{" "}
            <Link href="/syarat" className="text-[#00A76F] hover:underline">
              Syarat & Ketentuan
            </Link>{" "}
            kami.
          </p>
        </CardContent>
      </form>

      <CardFooter className="flex flex-col gap-3 pt-0">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">atau</span>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#0D1F3D] hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
