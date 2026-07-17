"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const res = await fetch(`/api/transactions/${resolvedParams.id}`);
        const data = await res.json();
        
        if (data.success) {
          setTransaction(data.data);
        } else {
          setError(data.error || "Transaksi tidak ditemukan");
        }
      } catch (err) {
        setError("Terjadi kesalahan sistem saat memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [resolvedParams.id]);

  const handleConfirmPayment = async () => {
    if (!confirm("Apakah Anda yakin tagihan ini sudah dilunasi?")) return;

    setIsConfirming(true);
    try {
      const res = await fetch(`/api/transactions/${resolvedParams.id}`, {
        method: "PATCH"
      });
      const data = await res.json();

      if (data.success) {
        setTransaction({
          ...transaction,
          paymentStatus: "PAID",
          paidAmount: transaction.grandTotal
        });
      } else {
        alert(data.error || "Gagal mengkonfirmasi pembayaran");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsConfirming(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A76F]" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl inline-block">
          <p className="font-medium">{error || "Data tidak ditemukan"}</p>
          <Link href="/dashboard/transactions">
            <Button variant="link" className="mt-2 text-red-700">
              Kembali ke daftar transaksi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const date = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(transaction.createdAt));

  return (
    <>
      <ThermalReceipt transaction={transaction} />

      {/* Main dashboard content, hidden during print using a class we add in global or just standard print-none */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="max-w-4xl mx-auto space-y-6 pb-12 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Detail Transaksi</h1>
              <p className="text-slate-500 text-sm mt-1">{transaction.invoice}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {transaction.paymentStatus === "PENDING" && (
              <Button 
                onClick={handleConfirmPayment} 
                disabled={isConfirming}
                className="bg-[#00A76F] hover:bg-[#00A76F]/90 text-white"
              >
                {isConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Konfirmasi Lunas
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Cetak Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Panel */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Info Penjualan</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Tanggal & Waktu</p>
                  <p className="font-medium">{date}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Kasir</p>
                  <p className="font-medium">{transaction.cashier.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Pelanggan</p>
                  <p className="font-medium">{transaction.customer?.name || "-"}</p>
                  {transaction.customer?.phone && <p className="text-slate-400 mt-1">{transaction.customer.phone}</p>}
                </div>
                {transaction.notes && (
                  <div>
                    <p className="text-slate-500 mb-1">Catatan</p>
                    <p className="font-medium bg-slate-50 p-2 rounded">{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b">Status Pembayaran</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Metode</span>
                  <Badge variant="outline">{transaction.paymentMethod}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status</span>
                  {transaction.paymentStatus === "PAID" ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Lunas</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Belum Lunas</Badge>
                  )}
                </div>
                {transaction.paymentStatus === "PENDING" && transaction.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Jatuh Tempo</span>
                    <span className="font-medium text-red-600">
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(transaction.dueDate))}
                    </span>
                  </div>
                )}
                {/* No. Referensi Transfer/QRIS */}
                {transaction.referenceNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">No. Referensi</span>
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                      {transaction.referenceNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Foto Bukti Transfer/QRIS */}
              {transaction.paymentProofUrl && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-2">Bukti Pembayaran</p>
                  <a
                    href={transaction.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={transaction.paymentProofUrl}
                      alt="Bukti pembayaran"
                      className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow">
                        <ExternalLink size={14} className="text-slate-700" />
                      </div>
                    </div>
                  </a>
                  <p className="text-[10px] text-slate-400 mt-1 text-center">Klik untuk perbesar</p>
                </div>
              )}
            </div>
          </div>

          {/* Items & Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.details.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.sellPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="bg-slate-50 p-6 border-t border-slate-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(transaction.subtotal)}</span>
                  </div>
                  {transaction.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Diskon</span>
                      <span>- {formatCurrency(transaction.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 font-bold text-lg">
                    <span className="text-slate-800">Grand Total</span>
                    <span className="text-[#0D1F3D]">{formatCurrency(transaction.grandTotal)}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-6 pt-6 border-t border-slate-200 text-sm">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Nominal Dibayar</span>
                    <span>{formatCurrency(transaction.paidAmount)}</span>
                  </div>
                  {transaction.changeAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Kembalian</span>
                      <span>{formatCurrency(transaction.changeAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
