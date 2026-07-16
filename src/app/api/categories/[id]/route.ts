import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
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

    // Ensure category belongs to the tenant
    const existing = await prisma.category.findFirst({
      where: { id, tenantId: dbUser.tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: name.trim() }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
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

    // Ensure category belongs to the tenant
    const existing = await prisma.category.findFirst({
      where: { id, tenantId: dbUser.tenantId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    if (existing._count.products > 0) {
      return NextResponse.json(
        { success: false, error: "Kategori masih memiliki produk, tidak dapat dihapus" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE category error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
