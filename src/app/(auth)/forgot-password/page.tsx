"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Store, CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
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

const forgotSchema = z.object({
  email: z.string().email({ message: "Email tidak valid" }),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(data: ForgotForm) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setServerError("Terjadi kesalahan saat mengirim link reset. Coba lagi.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-[#00A76F] mx-auto" />
          <h2 className="text-xl font-bold text-[#0D1F3D]">Email Terkirim!</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Kami telah mengirimkan instruksi untuk reset password ke email Anda.
            Silakan cek inbox (atau folder spam).
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className={buttonVariants({
                variant: "default",
                className: "bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white w-full",
              })}
            >
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0D1F3D] flex items-center justify-center">
              <Store className="w-5 h-5 text-[#00A76F]" />
            </div>
            <span className="text-2xl font-bold text-[#0D1F3D]">Dicatat</span>
          </div>
        </div>
        <CardTitle className="text-xl text-center text-[#0D1F3D]">
          Lupa Password
        </CardTitle>
        <CardDescription className="text-center">
          Masukkan email Anda dan kami akan mengirimkan link untuk reset
          password
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Server Error */}
          {serverError && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {serverError}
            </div>
          )}

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

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00A76F] hover:bg-[#00A76F]/90 text-white mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengirim Link...
              </>
            ) : (
              "Kirim Link Reset"
            )}
          </Button>
        </CardContent>
      </form>

      <CardFooter className="flex flex-col gap-3 pt-0">
        <p className="text-sm text-center text-muted-foreground">
          Ingat password Anda?{" "}
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
