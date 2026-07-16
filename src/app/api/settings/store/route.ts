export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const storeSettingsSchema = z.object({
  name: z.string().min(1, "Nama toko wajib diisi"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  receiptHeader: z.string().optional().nullable(),
  receiptFooter: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
    });

    if (!currentUser || currentUser.role === "KASIR") {
      return NextResponse.json({ success: false, error: "Forbidden. KASIR tidak bisa mengakses pengaturan." }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 5,
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Toko tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tenant, role: currentUser.role });
  } catch (error: any) {
    console.error("GET /api/settings/store error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
    });

    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden. Hanya OWNER yang bisa mengubah pengaturan." }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = storeSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, phone, address, logo, receiptHeader, receiptFooter } = validationResult.data;

    const updatedTenant = await prisma.tenant.update({
      where: { id: currentUser.tenantId },
      data: {
        name,
        phone,
        address,
        logo,
        receiptHeader,
        receiptFooter,
      },
    });

    return NextResponse.json({ success: true, data: updatedTenant });
  } catch (error: any) {
    console.error("PUT /api/settings/store error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
