"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    snap: any;
  }
}

export default function BillingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [role, setRole] = useState<string>("KASIR");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStoreData();
    
    // Load Midtrans Snap script
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "");
    document.head.appendChild(script);
    
    return () => {
      // Cleanup if needed
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const fetchStoreData = async () => {
    try {
      const res = await fetch("/api/settings/store");
      const data = await res.json();
      if (data.success) {
        setTenant(data.data);
        setRole(data.role);
      } else {
        setError(data.error || "Gagal mengambil data tagihan");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D1F3D]" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        {error || "Gagal memuat data"}
      </div>
    );
  }

  const isReadOnly = role !== "OWNER";
  
  // Hitung sisa hari trial jika masih dalam masa trial
  let trialDaysLeft = 0;
  let trialProgress = 100;
  if (tenant.plan === "TRIAL" && tenant.trialEndsAt) {
    const end = new Date(tenant.trialEndsAt).getTime();
    const now = new Date().getTime();
    const created = new Date(tenant.createdAt).getTime();
    
    if (end > now) {
      trialDaysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      const totalTrialDays = Math.ceil((end - created) / (1000 * 60 * 60 * 24)) || 14;
      trialProgress = Math.max(0, Math.min(100, 100 - (trialDaysLeft / totalTrialDays) * 100));
    } else {
      trialDaysLeft = 0;
      trialProgress = 100;
    }
  }

  const plans = [
    {
      id: "TRIAL",
      name: "Trial",
      price: 0,
      period: "14 Hari",
      features: ["Full akses fitur", "Maksimal 2 kasir", "Uji coba gratis"],
    },
    {
      id: "STARTER",
      name: "Starter",
      price: 99000,
      period: "Per bulan",
      features: ["2 Akun Kasir", "Maksimal 200 Produk", "Laporan Penjualan Dasar"],
    },
    {
      id: "PRO",
      name: "Pro",
      price: 199000,
      period: "Per bulan",
      features: ["5 Akun Kasir", "Produk Tanpa Batas", "Laporan Lengkap & Profit"],
    },
    {
      id: "BUSINESS",
      name: "Business",
      price: 399000,
      period: "Per bulan",
      features: ["Kasir Tanpa Batas", "Produk Tanpa Batas", "Multi-Cabang & API (Segera)"],
    }
  ];

  const handleUpgrade = async (plan: string) => {
    if (plan === "TRIAL") return;
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      
      if (data.success && data.token) {
        window.snap.pay(data.token, {
          onSuccess: function(result: any) {
            alert("Pembayaran berhasil! Plan diupgrade.");
            fetchStoreData();
            router.refresh();
          },
          onPending: function(result: any) {
            alert("Pembayaran pending. Selesaikan pembayaran.");
            fetchStoreData();
          },
          onError: function(result: any) {
            alert("Pembayaran gagal. Coba lagi.");
          },
          onClose: function() {
            alert("Pembayaran dibatalkan.");
          }
        });
      } else {
        alert(data.error || "Gagal membuat transaksi");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Plan Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-1">Paket Aktif Saat Ini</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#0D1F3D]">
                {tenant.plan === "TRIAL" ? "Trial 14 Hari" : tenant.plan}
              </span>
              {tenant.plan === "TRIAL" && trialDaysLeft > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sisa {trialDaysLeft} Hari
                </span>
              )}
            </div>
            {tenant.subscriptionEndsAt && tenant.plan !== "TRIAL" && (
              <p className="text-sm text-slate-600 mt-2">
                Berlaku hingga: {new Date(tenant.subscriptionEndsAt).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
          </div>
          
          {!isReadOnly && (tenant.plan === "TRIAL" || tenant.plan === "STARTER") && (
            <Button onClick={() => handleUpgrade("PRO")} className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </div>

        {tenant.plan === "TRIAL" && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
              <span>Masa Trial</span>
              <span>{trialDaysLeft} hari tersisa</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full ${trialDaysLeft === 0 ? 'bg-red-500' : 'bg-amber-500'}`} 
                style={{ width: `${trialProgress}%` }}
              ></div>
            </div>
            {trialDaysLeft === 0 && (
              <p className="text-sm text-red-600 mt-2 font-medium">Masa trial Anda telah habis. Silakan upgrade plan untuk lanjut menggunakan Dicatat.</p>
            )}
          </div>
        )}
      </div>

      {/* Available Plans */}
      <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Pilih Paket Langganan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = tenant.plan === p.id;
          return (
            <div 
              key={p.id} 
              className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col ${
                isCurrent ? "border-[#0D1F3D] ring-1 ring-[#0D1F3D]" : "border-slate-200"
              }`}
            >
              {isCurrent && (
                <span className="bg-[#0D1F3D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-max mb-3 uppercase tracking-wider">
                  Paket Saat Ini
                </span>
              )}
              <h4 className="text-lg font-bold text-slate-800 mb-1">{p.name}</h4>
              <div className="mb-4">
                <span className="text-2xl font-black text-[#0D1F3D]">
                  {p.price === 0 ? "Gratis" : formatCurrency(p.price)}
                </span>
                {p.price > 0 && <span className="text-xs text-slate-500 ml-1">/{p.period}</span>}
              </div>
              
              <ul className="space-y-3 mb-6 flex-1">
                {p.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-[#00A76F] mr-2 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              
              {!isReadOnly && !isCurrent && p.id !== "TRIAL" && (
                <Button 
                  onClick={() => handleUpgrade(p.id)} 
                  variant="outline" 
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Pilih {p.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Billing History */}
      <h3 className="text-lg font-bold text-slate-800 mt-8 mb-4">Riwayat Tagihan</h3>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {tenant.subscriptions && tenant.subscriptions.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Tagihan</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Total Tagihan</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.subscriptions.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    {new Date(sub.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{sub.orderId}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell>{formatCurrency(sub.amount)}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      sub.status === 'success' || sub.status === 'paid' ? 'bg-green-100 text-green-700' :
                      sub.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sub.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-slate-500 text-sm">
            Belum ada riwayat tagihan.
          </div>
        )}
      </div>
    </div>
  );
}
