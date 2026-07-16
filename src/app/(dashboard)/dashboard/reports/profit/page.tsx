"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Loader2, Printer, Download, TrendingUp, DollarSign, Activity, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
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

export default function ProfitReportPage() {
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

        const res = await fetch(`/api/reports/profit?${query}`);
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
    
    // Simple CSV export for Product Profit
    const headers = ["Nama Produk", "Qty Terjual", "Modal", "Pendapatan", "Profit", "Margin"];
    const rows = data.productProfit.map((p: any) => [
      `"${p.name}"`,
      p.qty,
      p.capital,
      p.revenue,
      p.profit,
      `${p.margin.toFixed(2)}%`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_profitabilitas_${new Date().getTime()}.csv`);
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
          <p className="text-slate-500 text-sm mt-1">Analisis profitabilitas dan keuntungan bersih.</p>
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
        <Link href="/dashboard/reports/profit" className={`px-4 py-3 text-sm font-medium border-b-2 ${pathname.includes('profit') ? 'border-[#00A76F] text-[#00A76F]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
                <Wallet className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Modal</CardTitle>
                <DollarSign className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-700">
                  {formatCurrency(data.summary.totalCapital)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#00A76F]/20 bg-[#00A76F]/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#00A76F]">Profit Bersih</CardTitle>
                <TrendingUp className="w-4 h-4 text-[#00A76F]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#00A76F]">
                  {formatCurrency(data.summary.totalProfit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Margin Profit</CardTitle>
                <Activity className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0D1F3D]">
                  {data.summary.marginPercentage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Tren Profitabilitas</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full">
              {data.dailyProfit.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyProfit} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
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
                    <Legend />
                    <Bar dataKey="revenue" name="Pendapatan" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#00A76F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Tidak ada data profit pada periode ini
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Profit per Produk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Modal</TableHead>
                      <TableHead className="text-right">Pendapatan</TableHead>
                      <TableHead className="text-right font-bold">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.productProfit.length > 0 ? (
                      data.productProfit.map((p: any) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-center">{p.qty}</TableCell>
                          <TableCell className="text-right text-slate-500">{formatCurrency(p.capital)}</TableCell>
                          <TableCell className="text-right text-slate-500">{formatCurrency(p.revenue)}</TableCell>
                          <TableCell className="text-right font-bold text-[#00A76F]">{formatCurrency(p.profit)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${p.margin > 30 ? 'bg-green-100 text-green-700' : p.margin > 15 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {p.margin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">Belum ada data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
