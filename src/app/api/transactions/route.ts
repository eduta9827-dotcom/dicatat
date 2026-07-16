import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";
import type { PaymentMethod, PaymentStatus } from "@/types/prisma";

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
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const method = searchParams.get("method") as PaymentMethod | "ALL" | null;
    const status = searchParams.get("status") as PaymentStatus | "ALL" | null;
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    // Base where clause
    const where: Prisma.TransactionWhereInput = {
      tenantId: dbUser.tenantId,
    };

    // RBAC logic
    if (dbUser.role === "KASIR") {
      where.cashierId = dbUser.id;
    }

    // Search filter (Invoice)
    if (search) {
      where.invoice = { contains: search, mode: "insensitive" };
    }

    // Date filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      where.createdAt = {
        gte: start,
        lte: end,
      };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { lte: end };
    }

    // Method filter
    if (method && method !== "ALL") {
      where.paymentMethod = method;
    }

    // Status filter
    if (status && status !== "ALL") {
      where.paymentStatus = status;
    }

    // Get total count for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
        details: { select: { qty: true } }, // Included to calculate total items
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: transactions,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
      }
    });
  } catch (error: any) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
