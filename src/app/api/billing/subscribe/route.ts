import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { z } from "zod";

const subscribeSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"]),
});

const PLAN_PRICES: Record<string, number> = {
  STARTER: 99000,
  PRO: 199000,
  BUSINESS: 399000,
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
      include: { tenant: true },
    });

    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden. Hanya OWNER yang bisa mengubah paket." }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = subscribeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { plan } = validationResult.data;
    const price = PLAN_PRICES[plan];
    
    // Format order_id: SUB-{tenantId}-{timestamp}
    // Karena length maksimal order_id Midtrans adalah 50 karakter, kita persingkat tenantId bila perlu, 
    // atau pakai timestamp saja setelah SUB-
    const timestamp = Date.now();
    const shortTenantId = currentUser.tenantId.substring(0, 8);
    const orderId = `SUB-${shortTenantId}-${timestamp}`;

    // 1. Buat record di DB (Status PENDING)
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: currentUser.tenantId,
        plan: plan as any,
        amount: price,
        orderId,
        status: "pending",
      },
    });

    // 2. Buat Midtrans Transaction
    const transactionParams = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      customer_details: {
        first_name: currentUser.tenant?.name || "Pelanggan",
        email: currentUser.tenant?.email || currentUser.email,
        phone: currentUser.tenant?.phone || undefined,
      },
      item_details: [
        {
          id: `DICATAT-${plan}`,
          price: price,
          quantity: 1,
          name: `Dicatat ${plan} - 1 Bulan`,
        }
      ],
    };

    const midtransTx = await snap.createTransaction(transactionParams);

    return NextResponse.json({ 
      success: true, 
      token: midtransTx.token,
      redirect_url: midtransTx.redirect_url 
    });
  } catch (error: any) {
    console.error("POST /api/billing/subscribe error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
