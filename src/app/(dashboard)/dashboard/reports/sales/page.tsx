"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Loader2, Printer, Download, TrendingUp, ShoppingCart, Tag, Package } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

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
import { formatCurrency } from "@/lib/utils";
import { DateRangePicker, getTodayWIB } from "@/components/dashboard/DateRangePicker";

export default function SalesReportPage() {
  const pathname = usePathname();
  
  // Default: Today
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: getTodayWIB(),
    to: getTodayWIB(),
  });

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let query = "";
        if (dateRange?.from) {
          query += `startDate=${format(dateRange.from, "yyyy-MM-dd")}`;
        }
        if (dateRange?.to) {
          query += `&endDate=${format(dateRange.to, "yyyy-MM-dd")}`;
        }

        const res = await fetch(`/api/reports/sales?${query}`);
        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Gagal memuat data laporan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    // Simple CSV export for Product Sales
    const headers = ["Nama Produk", "Qty Terjual", "Total Pendapatan", "Persentase"];
    const rows = data.productSales.map((p: any) => [
      `"${p.name}"`,
      p.qty,
      p.total,
      `${p.percentage.toFixed(2)}%`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_penjualan_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-w-full { width: 100% !important; max-width: none !important; }
          body { background: white !important; }
        }
      `}} />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan</h1>
          <p className="text-slate-500 text-sm mt-1">Analisis performa penjualan dan produk Anda.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 sm:flex-none">
              <Printer className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <Link href="/dashboard/reports/sales" className={`px-4 py-3 text-sm font-medium border-b-2 ${pathname.includes('sales') ? 'border-[#0D1F3D] text-[#0D1F3D]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Penjualan
        </Link>
        <Link href="/dashboard/reports/profit" className={`px-4 py-3 text-sm font-medium border-b-2 ${pathname.includes('profit') ? 'border-[#0D1F3D] text-[#0D1F3D]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Profitabilitas
        </Link>
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center">
          {error}
        </div>
      ) : !data ? null : (
        <div className="space-y-6 print-w-full">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Pendapatan</CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Transaksi</CardTitle>
                <ShoppingCart className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {data.summary.totalTransactions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Rata-rata Transaksi</CardTitle>
                <Tag className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {formatCurrency(data.summary.averageTransaction)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Produk Terjual</CardTitle>
                <Package className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {data.summary.totalItems} <span className="text-sm font-normal text-slate-500">item</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Tren Penjualan</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
              {data.dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailySales} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `Rp${(value / 1000)}k`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(Number(value))}
                      labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#0D1F3D" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0D1F3D', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Tidak ada data penjualan pada periode ini
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Penjualan per Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.productSales.length > 0 ? (
                        data.productSales.slice(0, 10).map((p: any) => (
                          <TableRow key={p.name}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className="text-center">{p.qty}</TableCell>
                            <TableCell className="text-right">{formatCurrency(p.total)}</TableCell>
                            <TableCell className="text-right">
                              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                                {p.percentage.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500 py-4">Belum ada data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Penjualan per Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.categorySales.length > 0 ? (
                        data.categorySales.slice(0, 10).map((c: any) => (
                          <TableRow key={c.name}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell className="text-center">{c.qty}</TableCell>
                            <TableCell className="text-right">{formatCurrency(c.total)}</TableCell>
                            <TableCell className="text-right">
                              <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                                {c.percentage.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-slate-500 py-4">Belum ada data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
