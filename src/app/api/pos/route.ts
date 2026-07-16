export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

function generateInvoice() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `INV-${yyyy}${mm}${dd}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User tidak valid" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      items, // array of { productId, qty }
      paymentMethod, // CASH, TRANSFER, QRIS, PAY_LATER
      discountAmount = 0,
      paidAmount = 0,
      customerId = null,
      dueDate = null,
      notes = null
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Keranjang kosong" }, { status: 400 });
    }

    // Process transaction securely within a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const detailsToCreate = [];

      // 1. Validasi produk & stok, kalkulasi total
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product || product.tenantId !== dbUser.tenantId) {
          throw new Error(`Produk tidak valid: ${item.productId}`);
        }

        if (product.stock < item.qty) {
          throw new Error(`Stok tidak cukup untuk: ${product.name}`);
        }

        const itemSubtotal = product.sellPrice * item.qty;
        const profit = (product.sellPrice - product.buyPrice) * item.qty;
        subtotal += itemSubtotal;

        detailsToCreate.push({
          productId: product.id,
          productName: product.name,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          qty: item.qty,
          subtotal: itemSubtotal,
          profit: profit
        });

        // Kurangi stok
        await tx.product.update({
          where: { id: product.id },
          data: { stock: product.stock - item.qty }
        });
      }

      const grandTotal = subtotal - discountAmount;
      
      let changeAmount = 0;
      let paymentStatus = "PAID";
      
      if (paymentMethod === "PAY_LATER") {
        paymentStatus = "PENDING";
        changeAmount = 0;
      } else {
        if (paidAmount < grandTotal) {
          throw new Error("Uang pembayaran kurang dari total tagihan");
        }
        changeAmount = paidAmount - grandTotal;
      }

      // Generate Invoice
      let invoice = generateInvoice();
      let isUnique = false;
      while (!isUnique) {
        const existing = await tx.transaction.findUnique({ where: { invoice } });
        if (!existing) {
          isUnique = true;
        } else {
          invoice = generateInvoice();
        }
      }

      // 2. Buat Transaksi
      const transaction = await tx.transaction.create({
        data: {
          tenantId: dbUser.tenantId,
          invoice,
          cashierId: dbUser.id,
          customerId,
          subtotal,
          discountAmount,
          grandTotal,
          paidAmount: paymentMethod === "PAY_LATER" ? 0 : paidAmount,
          changeAmount,
          paymentMethod,
          // @ts-ignore - enums matching
          paymentStatus,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes,
          details: {
            create: detailsToCreate
          }
        },
        include: {
          details: true,
          cashier: { select: { name: true } },
          customer: { select: { name: true } }
        }
      });

      // 3. Buat Receivable jika PAY_LATER
      if (paymentMethod === "PAY_LATER" && customerId) {
        await tx.receivable.create({
          data: {
            tenantId: dbUser.tenantId,
            transactionId: transaction.id,
            customerId: customerId,
            amount: grandTotal,
            paidAmount: 0,
            dueDate: dueDate ? new Date(dueDate) : null,
          }
        });
      }

      // 4. Update Customer total spent
      if (customerId && paymentMethod !== "PAY_LATER") {
        await tx.customer.update({
          where: { id: customerId },
          data: { totalSpent: { increment: grandTotal } }
        });
      }

      return transaction;
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("POST POS transaction error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses transaksi" },
      { status: 400 }
    );
  }
}
