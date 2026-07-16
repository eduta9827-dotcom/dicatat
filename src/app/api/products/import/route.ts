export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Data produk kosong atau tidak valid" }, { status: 400 });
    }

    let successCount = 0;
    let failedCount = 0;

    // Fetch existing categories to avoid duplicates
    const existingCategories = await prisma.category.findMany({
      where: { tenantId: dbUser.tenantId }
    });

    const categoryMap = new Map<string, string>();
    existingCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

    // Process each product sequentially to handle category creation properly
    for (const p of products) {
      try {
        if (!p.name || p.sellPrice === undefined) {
          failedCount++;
          continue;
        }

        let categoryId = null;
        if (p.categoryName) {
          const catNameLower = String(p.categoryName).trim().toLowerCase();
          if (categoryMap.has(catNameLower)) {
            categoryId = categoryMap.get(catNameLower);
          } else {
            // Create new category
            const newCat = await prisma.category.create({
              data: {
                name: String(p.categoryName).trim(),
                tenantId: dbUser.tenantId
              }
            });
            categoryMap.set(catNameLower, newCat.id);
            categoryId = newCat.id;
          }
        }

        const generatedSku = p.sku?.trim() ? p.sku.trim() : `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await prisma.product.create({
          data: {
            name: String(p.name).trim(),
            tenantId: dbUser.tenantId,
            categoryId: categoryId,
            buyPrice: Number(p.buyPrice) || 0,
            sellPrice: Number(p.sellPrice) || 0,
            stock: Number(p.stock) || 0,
            sku: generatedSku,
            barcode: p.barcode ? String(p.barcode).trim() : null,
            isActive: true,
          }
        });

        successCount++;
      } catch (err) {
        console.error("Error importing row:", err);
        failedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      successCount,
      failedCount 
    });
  } catch (error) {
    console.error("POST import products error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengimpor produk" },
      { status: 500 }
    );
  }
}
