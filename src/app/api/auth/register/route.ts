import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authId, email, storeName } = body;

    if (!authId || !email || !storeName) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { authId },
    });

    if (existingUser) {
      return NextResponse.json({ success: true });
    }

    const slug = storeName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: storeName,
        slug,
        email,
        plan: "TRIAL",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.create({
      data: {
        id: authId,
        authId,
        tenantId: tenant.id,
        email,
        name: storeName,
        role: "OWNER",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat data toko" },
      { status: 500 }
    );
  }
}
