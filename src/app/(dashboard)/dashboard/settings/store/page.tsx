"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const storeSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  receiptHeader: z.string().optional().nullable(),
  receiptFooter: z.string().optional().nullable(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function StoreSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string>("KASIR");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
  });

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const res = await fetch("/api/settings/store");
      const data = await res.json();
      if (data.success) {
        setRole(data.role);
        setLogoUrl(data.data.logo);
        reset({
          name: data.data.name,
          phone: data.data.phone || "",
          address: data.data.address || "",
          receiptHeader: data.data.receiptHeader || "",
          receiptFooter: data.data.receiptFooter || "",
        });
      } else {
        setError(data.error || "Gagal mengambil data toko");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG/JPG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("logos")
        .getPublicUrl(fileName);

      setLogoUrl(publicUrlData.publicUrl);
      setSuccessMsg("Logo berhasil diunggah. Jangan lupa klik Simpan.");
    } catch (err: any) {
      console.error(err);
      setError("Gagal mengunggah logo: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: StoreFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const payload = { ...values, logo: logoUrl };
      const res = await fetch("/api/settings/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Pengaturan toko berhasil disimpan");
      } else {
        setError(data.error || "Gagal menyimpan pengaturan");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D1F3D]" />
      </div>
    );
  }

  const isReadOnly = role !== "OWNER";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-6">Profil Toko</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-6">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
            <div className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden relative group">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo Toko" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center text-slate-400">
                  <Store className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <span className="text-xs">Belum ada logo</span>
                </div>
              )}
              
              {!isReadOnly && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer bg-white text-slate-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-slate-100">
                    <Upload className="w-3 h-3" />
                    {isUploading ? "Mengunggah..." : "Ubah Logo"}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleUploadLogo}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center">Format PNG/JPG maksimal 2MB. Resolusi disarankan 512x512px.</p>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <div className="space-y-2">
              <Label>Nama Toko <span className="text-red-500">*</span></Label>
              <Input {...register("name")} disabled={isReadOnly} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input {...register("phone")} disabled={isReadOnly} />
            </div>

            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea {...register("address")} className="resize-none h-24" disabled={isReadOnly} />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Header Struk (Atas)</Label>
            <Textarea 
              {...register("receiptHeader")} 
              className="resize-none h-24"
              placeholder="Contoh: Dicatat Store&#10;Jl. Sudirman No. 123&#10;Telp: 08123456789"
              disabled={isReadOnly}
            />
            <p className="text-xs text-slate-500">Teks ini akan muncul di bagian paling atas struk belanja pelanggan.</p>
          </div>
          
          <div className="space-y-2">
            <Label>Footer Struk (Bawah)</Label>
            <Textarea 
              {...register("receiptFooter")} 
              className="resize-none h-24"
              placeholder="Contoh: Terima kasih telah berbelanja!&#10;Barang yang sudah dibeli tidak dapat ditukar."
              disabled={isReadOnly}
            />
            <p className="text-xs text-slate-500">Teks ini akan muncul di bagian bawah struk belanja pelanggan.</p>
          </div>
        </div>

        {!isReadOnly && (
          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white px-8"
              disabled={isSaving || isUploading}
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan Pengaturan
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
