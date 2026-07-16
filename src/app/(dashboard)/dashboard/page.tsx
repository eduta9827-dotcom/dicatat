import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SalesChart } from "./_components/SalesChart";
import { RecentTransactions } from "./_components/RecentTransactions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { tenant: true },
  });

  if (!user) {
    redirect("/login");
  }

  const tenantId = user.tenantId;

  // Date boundaries for today
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Queries
  const [
    salesTodayRaw,
    totalTransactions,
    totalProducts,
    totalCustomers,
    recentTransactions
  ] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { grandTotal: true },
      where: {
        tenantId,
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.transaction.count({ where: { tenantId } }),
    prisma.product.count({ where: { tenantId, isActive: true } }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    })
  ]);

  const salesToday = salesTodayRaw._sum.grandTotal || 0;

  // 7 Days Chart Data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const transactions7Days = await prisma.transaction.findMany({
    where: {
      tenantId,
      createdAt: { gte: sevenDaysAgo },
    },
    select: { grandTotal: true, createdAt: true },
  });

  // Group by date for the chart
  const salesByDate: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("id-ID", { day: '2-digit', month: 'short' });
    salesByDate[dateStr] = 0;
  }

  transactions7Days.forEach((t: { createdAt: Date; grandTotal: number }) => {
    const dateStr = new Date(t.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' });
    if (salesByDate[dateStr] !== undefined) {
      salesByDate[dateStr] += t.grandTotal;
    }
  });

  const chartData = Object.entries(salesByDate).map(([date, total]) => ({
    date,
    total,
  }));

  const storeName = user.tenant.name;
  const firstName = storeName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0D1F3D] to-[#0D1F3D]/80 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-[#00A76F]" />
          <div className="absolute -bottom-12 -left-4 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <Badge className="bg-[#00A76F]/20 text-[#00A76F] border-[#00A76F]/30 mb-3 hover:bg-[#00A76F]/30 transition-colors cursor-default">
            Paket Trial
          </Badge>
          <h1 className="text-2xl font-bold">
            Selamat datang, {firstName}! 👋
          </h1>
          <p className="text-slate-300 mt-1 text-sm max-w-md">
            Ini adalah ringkasan aktivitas toko Anda hari ini. Kelola produk, transaksi, dan laporan dari satu dashboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Penjualan Hari Ini"
          value={formatCurrency(salesToday)}
          icon={TrendingUp}
          iconClassName="text-[#00A76F]"
          iconWrapperClassName="bg-[#00A76F]/10"
        />
        <StatCard 
          title="Total Transaksi"
          value={totalTransactions.toString()}
          icon={ShoppingCart}
          iconClassName="text-blue-500"
          iconWrapperClassName="bg-blue-50"
        />
        <StatCard 
          title="Produk Aktif"
          value={totalProducts.toString()}
          icon={Package}
          iconClassName="text-violet-500"
          iconWrapperClassName="bg-violet-50"
        />
        <StatCard 
          title="Pelanggan"
          value={totalCustomers.toString()}
          icon={Users}
          iconClassName="text-orange-500"
          iconWrapperClassName="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <SalesChart data={chartData} />
        </div>

        {/* Recent Transactions Section */}
        <div>
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}
