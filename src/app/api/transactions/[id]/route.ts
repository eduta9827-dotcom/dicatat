import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET Transaction Detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: resolvedParams.id,
        tenantId: dbUser.tenantId, // RBAC Tenant
        ...(dbUser.role === "KASIR" ? { cashierId: dbUser.id } : {}) // RBAC Role
      },
      include: {
        details: true,
        cashier: { select: { name: true } },
        customer: { select: { name: true, phone: true } },
        tenant: { select: { name: true, phone: true, address: true, receiptHeader: true, receiptFooter: true } }
      }
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error("Fetch transaction detail error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH Confirm Payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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

    // Wrap in a transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: {
          id: resolvedParams.id,
          tenantId: dbUser.tenantId,
          ...(dbUser.role === "KASIR" ? { cashierId: dbUser.id } : {})
        },
      });

      if (!transaction) {
        throw new Error("Transaksi tidak ditemukan");
      }

      if (transaction.paymentStatus === "PAID") {
        throw new Error("Transaksi sudah lunas");
      }

      // Update Transaction
      const updatedTx = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          paymentStatus: "PAID",
          paidAmount: transaction.grandTotal, // Fully paid
        }
      });

      // Update Receivable if exists
      if (transaction.paymentMethod === "PAY_LATER" && transaction.customerId) {
        await tx.receivable.update({
          where: { transactionId: transaction.id },
          data: {
            isPaid: true,
            paidAmount: transaction.grandTotal,
          }
        });

        // Update Customer Total Spent
        await tx.customer.update({
          where: { id: transaction.customerId },
          data: { totalSpent: { increment: transaction.grandTotal } }
        });
      }

      return updatedTx;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Patch transaction error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
