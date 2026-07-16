import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "./_components/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { tenant: true },
  });

  if (!dbUser || !dbUser.tenant) {
    // Handling case where user authenticated but DB record is missing
    redirect("/login");
  }

  const tenant = dbUser.tenant;
  const now = new Date();
  
  // Pengecekan masa kedaluwarsa langganan/trial
  // Hanya block jika: 
  // 1. Plan adalah TRIAL dan sudah lewat trialEndsAt
  // ATAU 2. Plan bukan TRIAL dan sudah lewat subscriptionEndsAt
  const isTrialExpired = tenant.plan === "TRIAL" && tenant.trialEndsAt && tenant.trialEndsAt < now;
  const isSubExpired = tenant.plan !== "TRIAL" && tenant.subscriptionEndsAt && tenant.subscriptionEndsAt < now;

  // Dapatkan pathname saat ini (dengan Next.js 14/15 headers workaround)
  const headersList = await headers();
  // Catatan: Tidak ada cara sempurna untuk mendapat URL dari Server Component RSC murni selain headers, 
  // x-invoke-path bisa digunakan atau sekadar client side check.
  // Karena kita di layout, kita bisa mem-pass flag `isExpired` ke client layout agar di-handle di sana, 
  // tapi lebih aman mem-pass children atau membungkus layout jika expiry terjadi.
  
  // Jika expired, kita biarkan user mengakses /dashboard/settings/billing saja.
  // Untuk route lain, RSC tidak tau URL dengan pasti (x-invoke-path sering dipakai tapi tidak official).
  // Cara paling bersih: kita check jika x-invoke-path BUKAN /dashboard/settings/billing
  const currentPath = headersList.get("x-invoke-path") || "";
  if ((isTrialExpired || isSubExpired) && !currentPath.includes("/settings/billing") && !currentPath.includes("/api")) {
    redirect("/dashboard/settings/billing");
  }

  return (
    <DashboardLayoutClient 
      userName={dbUser.name} 
      userRole={dbUser.role} 
      tenantName={dbUser.tenant.name}
    >
      {children}
    </DashboardLayoutClient>
  );
}
