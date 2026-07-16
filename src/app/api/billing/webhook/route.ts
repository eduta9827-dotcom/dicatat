export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verifikasi Signature
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status,
      fraud_status 
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    
    // Validasi signature: SHA512(order_id + status_code + gross_amount + serverKey)
    const payload = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const hash = crypto.createHash("sha512").update(payload).digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 401 });
    }

    // Cari subscription di database
    const subscription = await prisma.subscription.findUnique({
      where: { orderId: order_id }
    });

    if (!subscription) {
      return NextResponse.json({ success: false, message: "Subscription not found" }, { status: 404 });
    }

    let paymentStatus = subscription.status;

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'challenge';
      } else if (fraud_status === 'accept') {
        paymentStatus = 'success';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success';
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      paymentStatus = 'failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    }

    // Update tabel Subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: paymentStatus }
    });

    // Jika sukses, update Tenant plan & endsAt
    if (paymentStatus === 'success') {
      const now = new Date();
      // Tambah 30 hari
      const subscriptionEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: {
          plan: subscription.plan,
          subscriptionEndsAt,
        }
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("POST /api/billing/webhook error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
