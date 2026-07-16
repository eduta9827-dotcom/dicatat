export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

    const product = await prisma.product.findFirst({
      where: { id, tenantId: dbUser.tenantId, isActive: true },
      include: { category: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("GET product detail error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail produk" },
      { status: 500 }
    );
  }
}

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
    const { name, categoryId, buyPrice, sellPrice, stock, image, sku, barcode } = body;

    const existing = await prisma.product.findFirst({
      where: { id, tenantId: dbUser.tenantId, isActive: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        buyPrice: buyPrice !== undefined ? buyPrice : existing.buyPrice,
        sellPrice: sellPrice !== undefined ? sellPrice : existing.sellPrice,
        stock: stock !== undefined ? stock : existing.stock,
        image: image !== undefined ? image : existing.image,
        sku: sku !== undefined ? sku.trim() : existing.sku,
        barcode: barcode !== undefined ? barcode : existing.barcode,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui produk" },
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

    const existing = await prisma.product.findFirst({
      where: { id, tenantId: dbUser.tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Soft delete product
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus produk" },
      { status: 500 }
    );
  }
}
