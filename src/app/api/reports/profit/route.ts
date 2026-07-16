import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

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

    const where: Prisma.TransactionWhereInput = {
      tenantId: dbUser.tenantId,
      paymentStatus: "PAID",
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
        details: true
      },
      orderBy: { createdAt: "asc" }
    });

    // 1. Calculate Summary
    let totalRevenue = 0;
    let totalCapital = 0; // Modal (buyPrice * qty)
    let totalProfit = 0; // (sellPrice - buyPrice) * qty

    // 2. Calculate Daily Profit
    const dailyProfitMap: Record<string, { revenue: number, profit: number }> = {};

    // 3. Calculate Product Profit
    const productProfitMap: Record<string, { qty: number, capital: number, revenue: number, profit: number }> = {};

    transactions.forEach(tx => {
      // We calculate revenue from details to ensure it matches profit calculations exactly
      // (ignoring order-level discounts for pure item profit margins, or we can distribute the discount)
      // The prompt asks for profit per product, so using detail level is better.
      let txDetailRevenue = 0;
      let txDetailCapital = 0;
      let txDetailProfit = 0;

      tx.details.forEach(detail => {
        const itemCapital = detail.buyPrice * detail.qty;
        const itemRevenue = detail.sellPrice * detail.qty;
        const itemProfit = detail.profit; // Already calculated in DB: (sellPrice - buyPrice) * qty

        txDetailRevenue += itemRevenue;
        txDetailCapital += itemCapital;
        txDetailProfit += itemProfit;
        
        // Product grouping
        if (!productProfitMap[detail.productName]) {
          productProfitMap[detail.productName] = { qty: 0, capital: 0, revenue: 0, profit: 0 };
        }
        productProfitMap[detail.productName].qty += detail.qty;
        productProfitMap[detail.productName].capital += itemCapital;
        productProfitMap[detail.productName].revenue += itemRevenue;
        productProfitMap[detail.productName].profit += itemProfit;
      });

      // We need to account for order-level discount if we want true total profit
      // True Profit = (Detail Revenue - Detail Capital) - Discount
      const finalRevenue = txDetailRevenue - tx.discountAmount;
      const finalProfit = txDetailProfit - tx.discountAmount;
      
      totalRevenue += finalRevenue;
      totalCapital += txDetailCapital;
      totalProfit += finalProfit;

      const dateKey = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(tx.createdAt));
      if (!dailyProfitMap[dateKey]) {
        dailyProfitMap[dateKey] = { revenue: 0, profit: 0 };
      }
      dailyProfitMap[dateKey].revenue += finalRevenue;
      dailyProfitMap[dateKey].profit += finalProfit;
    });

    const marginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Formatting outputs
    const dailyProfit = Object.entries(dailyProfitMap).map(([date, data]) => ({ date, ...data }));
    
    const productProfit = Object.entries(productProfitMap)
      .map(([name, data]) => ({ 
        name, 
        ...data, 
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0 
      }))
      .sort((a, b) => b.profit - a.profit);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCapital,
          totalProfit,
          marginPercentage
        },
        dailyProfit,
        productProfit
      }
    });

  } catch (error: any) {
    console.error("Profit report error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
