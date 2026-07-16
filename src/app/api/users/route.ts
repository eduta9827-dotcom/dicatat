export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "KASIR"]),
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

    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden. Hanya OWNER yang bisa melihat pengguna." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { tenantId: currentUser.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ 
      success: true, 
      data: users,
      currentUserAuthId: currentUser.authId,
      currentUserRole: currentUser.role
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
      return NextResponse.json({ success: false, error: "Forbidden. Hanya OWNER yang bisa mengundang pengguna." }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = inviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, name, role } = validationResult.data;

    // Cek apakah email sudah terdaftar di tenant ini (bisa saja dari user lama)
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId: currentUser.tenantId },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email sudah terdaftar di toko ini" }, { status: 400 });
    }

    const adminAuthClient = createAdminClient();
    const { data, error } = await adminAuthClient.auth.admin.inviteUserByEmail(email, {
      data: {
        role,
        tenantId: currentUser.tenantId,
        name: name || email.split("@")[0],
      },
    });

    if (error) {
      console.error("Supabase invite error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Buat data pengguna di tabel User
    const newUser = await prisma.user.create({
      data: {
        tenantId: currentUser.tenantId,
        authId: data.user.id,
        email: data.user.email || email,
        name: name || email.split("@")[0],
        role: role,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (error: any) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
