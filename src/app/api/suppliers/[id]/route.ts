export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Next.js 15 requires params to be awaited
type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: Context
) {
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

    const { id } = await context.params;

    const supplier = await prisma.supplier.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      },
      include: {
        payables: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    const totalHutang = supplier.payables.reduce((acc, p) => acc + (p.amount - p.paidAmount), 0);

    const formattedSupplier = {
      ...supplier,
      totalHutang
    };

    return NextResponse.json({ success: true, data: formattedSupplier });
  } catch (error) {
    console.error("GET supplier detail error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
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

    const { id } = await context.params;
    const body = await request.json();
    const { name, phone, address, email } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama supplier tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Check existing supplier
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        email: email?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("PUT supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
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

    const { id } = await context.params;

    // Check existing supplier
    const existingSupplier = await prisma.supplier.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      },
      include: {
        _count: {
          select: { payables: true }
        }
      }
    });

    if (!existingSupplier) {
      return NextResponse.json({ error: "Supplier tidak ditemukan" }, { status: 404 });
    }

    if (existingSupplier._count.payables > 0) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat menghapus supplier yang memiliki data hutang/payable" },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus supplier" },
      { status: 500 }
    );
  }
}
