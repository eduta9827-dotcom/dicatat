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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const filter = searchParams.get("filter") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: dbUser.tenantId,
      isActive: true,
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (filter === "out_of_stock") {
      where.stock = 0;
    } else if (filter === "low_stock") {
      const lowStockProducts: any[] = await prisma.$queryRaw`
        SELECT id FROM "Product" 
        WHERE "tenantId" = ${dbUser.tenantId} 
        AND "isActive" = true 
        AND stock <= "lowStockThreshold" 
        AND stock > 0
      `;
      where.id = { in: lowStockProducts.map(p => p.id) };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: products, 
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat produk" },
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
    const { name, categoryId, buyPrice, sellPrice, stock, image, sku, barcode } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama produk tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (sellPrice === undefined || sellPrice === null) {
      return NextResponse.json(
        { success: false, error: "Harga jual tidak boleh kosong" },
        { status: 400 }
      );
    }

    const generatedSku = sku?.trim() ? sku.trim() : `PRD-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        tenantId: dbUser.tenantId,
        categoryId: categoryId || null,
        buyPrice: buyPrice || 0,
        sellPrice: sellPrice,
        stock: stock || 0,
        image: image || null,
        sku: generatedSku,
        barcode: barcode || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("POST product error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat produk" },
      { status: 500 }
    );
  }
}
