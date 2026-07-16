import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.TransactionWhereInput = {
      tenantId: dbUser.tenantId,
    };

    if (dbUser.role === "KASIR") {
      where.cashierId = dbUser.id;
    }

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

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build CSV
    const headers = ["No Invoice", "Tanggal", "Kasir", "Pelanggan", "Metode Pembayaran", "Status", "Subtotal", "Diskon", "Total Bayar"];
    
    const rows = transactions.map(tx => {
      // Escape fields if they contain commas
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
      
      const date = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
      }).format(new Date(tx.createdAt));

      return [
        tx.invoice,
        escapeCsv(date),
        escapeCsv(tx.cashier.name),
        escapeCsv(tx.customer?.name || "-"),
        tx.paymentMethod,
        tx.paymentStatus,
        tx.subtotal,
        tx.discountAmount,
        tx.grandTotal
      ].join(",");
    });

    const csvData = [headers.join(","), ...rows].join("\n");

    const response = new NextResponse(csvData);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", `attachment; filename=transactions-${new Date().toISOString().split("T")[0]}.csv`);

    return response;

  } catch (error: any) {
    console.error("Export transactions error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
