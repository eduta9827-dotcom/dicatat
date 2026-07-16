export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User tidak valid" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { tenantId: dbUser.tenantId },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET categories error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat kategori" },
      { status: 500 }
    );
  }
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
      select: { tenantId: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User tidak valid" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama kategori tidak boleh kosong" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        tenantId: dbUser.tenantId,
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("POST category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat kategori" },
      { status: 500 }
    );
  }
}
