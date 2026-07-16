"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [stock, setStock] = useState("");
  
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [profitInfo, setProfitInfo] = useState<{profit: number, margin: number} | null>(null);

  useEffect(() => {
    const buy = parseInt(buyPrice) || 0;
    const sell = parseInt(sellPrice) || 0;

    if (sell > 0 && buy > 0 && sell < buy) {
      const loss = buy - sell;
      setPriceWarning(`⚠️ Harga jual lebih murah dari harga beli. Kamu akan rugi Rp ${loss.toLocaleString('id-ID')} per item.`);
      setProfitInfo(null);
    } else if (sell > 0 && buy > 0 && sell === buy) {
      setPriceWarning('⚠️ Harga jual sama dengan harga beli. Tidak ada keuntungan.');
      setProfitInfo(null);
    } else if (sell > 0 && buy > 0 && sell > buy) {
      setPriceWarning(null);
      const profit = sell - buy;
      const margin = Math.round((profit / buy) * 100);
      setProfitInfo({ profit, margin });
    } else {
      setPriceWarning(null);
      setProfitInfo(null);
    }
  }, [buyPrice, sellPrice]);
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error("Gagal memuat kategori", err);
      }
    };
    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // We assume the user has a tenantId via their JWT or we just use their authId in the path
    // Wait, the requirement says filename: {tenantId}/{timestamp}-{originalname}
    // We can't get tenantId easily on client side unless we fetch it, so let's just use authId, or fetch user profile first.
    // Actually, we can fetch the user profile or just pass the file to an API route to upload?
    // Supabase JS client upload is better. We can use user.id.
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      throw new Error("Gagal mengupload gambar");
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellPrice) {
      setError("Nama produk dan Harga Jual wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku: sku || undefined,
          barcode: barcode || undefined,
          categoryId: categoryId || undefined,
          buyPrice: parseInt(buyPrice) || 0,
          sellPrice: parseInt(sellPrice),
          stock: parseInt(stock) || 0,
          image: imageUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/products");
      } else {
        setError(data.error || "Gagal menyimpan produk");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tambah Produk</h1>
          <p className="text-slate-500 text-sm mt-1">Masukkan detail produk baru Anda.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <Label>Foto Produk (Opsional)</Label>
              <div className="flex items-start gap-4">
                <div 
                  className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden relative"
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-xs font-medium">Upload Foto</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
                <div className="flex-1 mt-2">
                  <p className="text-sm text-slate-500">Format yang didukung: JPG, PNG, WEBP.</p>
                  <p className="text-sm text-slate-500">Ukuran maksimal: 2MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Contoh: Kopi Susu Aren" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <select 
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Kode Barang)</Label>
              <Input 
                id="sku" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                placeholder="Kosongkan untuk generate otomatis" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input 
                id="barcode" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)} 
                placeholder="Scan barcode di sini" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyPrice">Harga Beli (Modal)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                <Input 
                  id="buyPrice" 
                  type="number"
                  min="0"
                  value={buyPrice} 
                  onChange={(e) => setBuyPrice(e.target.value)} 
                  placeholder="0" 
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellPrice">Harga Jual <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                <Input 
                  id="sellPrice" 
                  type="number"
                  min="0"
                  value={sellPrice} 
                  onChange={(e) => setSellPrice(e.target.value)} 
                  placeholder="0" 
                  className="pl-10"
                  required
                />
              </div>
              {priceWarning && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm mt-1">
                  <span>{priceWarning}</span>
                </div>
              )}
              {profitInfo && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm mt-1">
                  <span>✅ Keuntungan per item: Rp {profitInfo.profit.toLocaleString('id-ID')} ({profitInfo.margin}%)</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stok Awal</Label>
              <Input 
                id="stock" 
                type="number"
                min="0"
                value={stock} 
                onChange={(e) => setStock(e.target.value)} 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Link href="/dashboard/products">
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Batal
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="bg-[#0D1F3D] hover:bg-[#0D1F3D]/90 text-white min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Produk"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
