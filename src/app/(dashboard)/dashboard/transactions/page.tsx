"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Search, Filter, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { PaymentMethod, PaymentStatus } from "@/types/prisma";

interface Transaction {
  id: string;
  invoice: string;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  cashier: { name: string };
  customer: { name: string } | null;
  details: { qty: number }[];
}

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const search = searchParams.get("search") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const method = searchParams.get("method") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const page = parseInt(searchParams.get("page") || "1");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchInput, setSearchInput] = useState(search);
  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);
  const [methodInput, setMethodInput] = useState(method);
  const [statusInput, setStatusInput] = useState(status);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        startDate,
        endDate,
        method,
        status,
        page: page.toString()
      }).toString();

      const res = await fetch(`/api/transactions?${query}`);
      const data = await res.json();
      
      if (data.success) {
        setTransactions(data.data);
        setMeta(data.meta);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat memuat transaksi");
    } finally {
      setIsLoading(false);
    }
  }, [search, startDate, endDate, method, status, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setSearchInput(search);
    setStartInput(startDate);
    setEndInput(endDate);
    setMethodInput(method);
    setStatusInput(status);
  }, [search, startDate, endDate, method, status]);

  const updateFilters = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ 
      search: searchInput, 
      startDate: startInput, 
      endDate: endInput,
      method: methodInput,
      status: statusInput,
      page: 1 
    });
  };

  const handleExportCSV = () => {
    const query = new URLSearchParams({
      startDate,
      endDate
    }).toString();
    window.open(`/api/transactions/export?${query}`, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(dateString));
  };

  const renderStatus = (s: PaymentStatus) => {
    if (s === "PAID") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Lunas</Badge>;
    if (s === "PENDING") return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Belum Lunas</Badge>;
    return <Badge>{s}</Badge>;
  };

  const renderMethod = (m: PaymentMethod) => {
    switch (m) {
      case "CASH": return <Badge variant="outline">Tunai</Badge>;
      case "TRANSFER": return <Badge variant="outline">Transfer</Badge>;
      case "QRIS": return <Badge variant="outline">QRIS</Badge>;
      case "PAY_LATER": return <Badge variant="outline">Kasbon</Badge>;
      default: return <Badge variant="outline">{m}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau seluruh riwayat penjualan kasir.</p>
        </div>

        <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari No Invoice..." 
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Input 
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-auto"
              title="Dari Tanggal"
            />
            <span className="text-slate-400">-</span>
            <Input 
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-auto"
              title="Sampai Tanggal"
            />
          </div>

          <select 
            value={methodInput}
            onChange={(e) => setMethodInput(e.target.value)}
            className="flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 w-full md:w-[150px]"
          >
            <option value="ALL">Semua Metode</option>
            <option value="CASH">Tunai</option>
            <option value="TRANSFER">Transfer</option>
            <option value="QRIS">QRIS</option>
            <option value="PAY_LATER">Kasbon (Pay Later)</option>
          </select>

          <select 
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            className="flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 w-full md:w-[150px]"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">Lunas</option>
            <option value="PENDING">Belum Lunas</option>
          </select>

          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Waktu (WIB)</TableHead>
                <TableHead>Kasir</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-center">Metode</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500 mt-2">Memuat data transaksi...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-red-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    {error}
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                    <p>Tidak ada transaksi yang ditemukan.</p>
                    {(search || startDate || endDate || method !== "ALL" || status !== "ALL") && (
                      <Button 
                        variant="link" 
                        onClick={() => updateFilters({ search: "", startDate: "", endDate: "", method: "ALL", status: "ALL", page: 1 })}
                        className="mt-2 text-[#00A76F]"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-slate-900">{t.invoice}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(t.createdAt)}</TableCell>
                    <TableCell className="text-slate-600">{t.cashier.name}</TableCell>
                    <TableCell className="text-slate-600">{t.customer?.name || "-"}</TableCell>
                    <TableCell className="text-center">{t.details.reduce((acc, curr) => acc + curr.qty, 0)}</TableCell>
                    <TableCell className="text-right font-bold text-[#0D1F3D]">{formatCurrency(t.grandTotal)}</TableCell>
                    <TableCell className="text-center">{renderMethod(t.paymentMethod)}</TableCell>
                    <TableCell className="text-center">{renderStatus(t.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/transactions/${t.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {!isLoading && transactions.length > 0 && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-slate-500">
            Menampilkan halaman {page} dari {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
            >
              Sebelumnya
            </Button>
            <Button 
              variant="outline" 
              disabled={page >= meta.totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <TransactionsContent />
    </Suspense>
  );
}
