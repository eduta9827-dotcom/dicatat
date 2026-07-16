import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { POSClient } from "@/components/pos/POSClient";
import type { Product, Category } from "@prisma/client";

type ProductWithCategory = Product & {
  category: Category | null;
};

export const metadata = {
  title: "Kasir (POS) - Dicatat",
};

export default async function POSPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Get user & tenant info
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { tenant: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const tenantId = dbUser.tenantId;

  // Fetch products & categories for this tenant
  const [productsData, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  ]);

  // Format products for POSClient
  const initialProducts = productsData.map((p: ProductWithCategory) => ({
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: p.category?.name || null,
    sellPrice: p.sellPrice,
    stock: p.stock,
    image: p.image,
    barcode: p.barcode
  }));

  return (
    <POSClient 
      initialProducts={initialProducts}
      categories={categories}
      tenantId={tenantId}
      storeName={dbUser.tenant.name}
    />
  );
}
