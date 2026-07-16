export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {
      tenantId: dbUser.tenantId,
      paymentStatus: "PAID", // Only count PAID transactions for revenue
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(`${startDate}T00:00:00+07:00`),
        lte: new Date(`${endDate}T23:59:59.999+07:00`),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        details: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    // 1. Calculate Summary
    let totalRevenue = 0;
    let totalItems = 0;

    // 2. Calculate Daily Sales
    const dailySalesMap: Record<string, number> = {};

    // 3. Calculate Product Sales
    const productSalesMap: Record<string, { qty: number, total: number }> = {};

    // 4. Calculate Category Sales
    const categorySalesMap: Record<string, { qty: number, total: number }> = {};

    transactions.forEach(tx => {
      totalRevenue += tx.grandTotal;
      
      const dateKey = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(tx.createdAt));
      dailySalesMap[dateKey] = (dailySalesMap[dateKey] || 0) + tx.grandTotal;

      tx.details.forEach(detail => {
        totalItems += detail.qty;
        
        // Product grouping
        if (!productSalesMap[detail.productName]) {
          productSalesMap[detail.productName] = { qty: 0, total: 0 };
        }
        productSalesMap[detail.productName].qty += detail.qty;
        productSalesMap[detail.productName].total += detail.subtotal;

        // Category grouping
        const catName = detail.product?.category?.name || "Tanpa Kategori";
        if (!categorySalesMap[catName]) {
          categorySalesMap[catName] = { qty: 0, total: 0 };
        }
        categorySalesMap[catName].qty += detail.qty;
        categorySalesMap[catName].total += detail.subtotal;
      });
    });

    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Formatting outputs for Recharts & Tables
    const dailySales = Object.entries(dailySalesMap).map(([date, total]) => ({ date, total }));
    
    const productSales = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, ...data, percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    const categorySales = Object.entries(categorySalesMap)
      .map(([name, data]) => ({ name, ...data, percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions,
          averageTransaction,
          totalItems
        },
        dailySales,
        productSales,
        categorySales
      }
    });

  } catch (error: any) {
    console.error("Sales report error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
