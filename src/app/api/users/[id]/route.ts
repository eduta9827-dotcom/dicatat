export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "KASIR"]),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
    });

    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      return NextResponse.json({ success: false, error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.role === "OWNER" || targetUser.id === currentUser.id) {
      return NextResponse.json({ success: false, error: "Tidak dapat mengubah role OWNER atau diri sendiri" }, { status: 400 });
    }

    const body = await req.json();
    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: validationResult.data.role },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { authId: authUser.id },
    });

    if (!currentUser || currentUser.role !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      return NextResponse.json({ success: false, error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    if (targetUser.role === "OWNER" || targetUser.id === currentUser.id) {
      return NextResponse.json({ success: false, error: "Tidak dapat menghapus OWNER atau diri sendiri" }, { status: 400 });
    }

    // Untuk menghapus user sepenuhnya dari Supabase Auth, dibutuhkan adminAuthClient
    // Namun untuk sementara kita hapus record dari database saja atau tandai isActive = false
    // Prompt meminta: Hapus. Jadi kita delete data user.
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
