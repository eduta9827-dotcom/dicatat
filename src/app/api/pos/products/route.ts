import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/pos/products - Re-fetch all active products for POS (used for stock refresh)
export async function GET() {
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

    const products = await prisma.product.findMany({
      where: { tenantId: dbUser.tenantId, isActive: true },
      include: { category: true },
      orderBy: { name: "asc" }
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      sellPrice: p.sellPrice,
      stock: p.stock,
      image: p.image,
      barcode: p.barcode
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET POS products error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat produk" }, { status: 500 });
  }
}
