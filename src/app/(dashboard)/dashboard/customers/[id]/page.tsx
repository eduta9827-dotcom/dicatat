"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  ShoppingCart, 
  Wallet, 
  Calendar,
  Package,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setCustomer(data.data);
        } else {
          setError(data.error || "Gagal memuat detail pelanggan");
        }
      } catch (err) {
        console.error("Fetch customer error:", err);
        setError("Terjadi kesalahan sistem saat memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
        <p className="text-slate-500">Memuat detail pelanggan...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center">
        <p>{error || "Pelanggan tidak ditemukan"}</p>
        <Link href="/dashboard/customers">
          <Button variant="outline" className="mt-4">Kembali ke Daftar</Button>
        </Link>
      </div>
    );
  }

  const activeReceivables = customer.receivables || [];
  const totalReceivables = activeReceivables.reduce((acc: number, curr: any) => acc + (curr.amount - curr.paidAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Detail Pelanggan</h1>
          </div>
        </div>
        <Link href={`/dashboard/customers/${id}/edit`}>
          <Button variant="outline">Edit Pelanggan</Button>
        </Link>
      </div>

      {totalReceivables > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-orange-800">Terdapat Piutang Aktif</h3>
            <p className="text-sm text-orange-700 mt-1">
              Pelanggan ini memiliki total tagihan belum lunas sebesar <span className="font-bold">{formatCurrency(totalReceivables)}</span> dari {activeReceivables.length} transaksi.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Profil */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Nama</p>
              <p className="font-medium text-lg text-slate-900">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> No. Telepon
              </p>
              <p className="font-medium text-slate-900">{customer.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Alamat
              </p>
              <p className="font-medium text-slate-900">{customer.address || "-"}</p>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Terdaftar sejak {format(new Date(customer.createdAt), "dd MMM yyyy", { locale: localeId })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Statistik */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between items-center">
                Total Transaksi
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0D1F3D]">{customer.totalTransactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between items-center">
                Total Belanja
                <Wallet className="w-4 h-4 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0D1F3D]">
                {formatCurrency(customer.totalSpent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between items-center">
                Kunjungan Terakhir
                <Calendar className="w-4 h-4 text-purple-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-[#0D1F3D]">
                {customer.lastVisit 
                  ? format(new Date(customer.lastVisit), "dd MMM yyyy", { locale: localeId })
                  : "-"
                }
              </div>
            </CardContent>
          </Card>

          {/* Produk Favorit */}
          <Card className="sm:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                Produk Sering Dibeli
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.favoriteProducts && customer.favoriteProducts.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customer.favoriteProducts.map((p: any) => (
                    <div key={p.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-xs">
                        {p.qty}x
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Belum ada riwayat pembelian produk.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.transactions && customer.transactions.length > 0 ? (
                  customer.transactions.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/transactions/${trx.id}`} className="text-blue-600 hover:underline">
                          {trx.invoice}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {format(new Date(trx.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {trx.paymentMethod === 'CASH' ? 'Tunai' : 
                           trx.paymentMethod === 'TRANSFER' ? 'Transfer' : 
                           trx.paymentMethod === 'QRIS' ? 'QRIS' : 'Bayar Nanti'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            trx.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none' : 
                            trx.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none' : 
                            'bg-orange-100 text-orange-700 hover:bg-orange-200 border-none'
                          }
                        >
                          {trx.paymentStatus === 'PAID' ? 'Lunas' : 
                           trx.paymentStatus === 'PARTIAL' ? 'Sebagian' : 'Belum Lunas'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(trx.grandTotal)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                      Belum ada riwayat transaksi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
