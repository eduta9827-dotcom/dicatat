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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: dbUser.tenantId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          payables: {
            where: { isPaid: false }
          }
        }
      }),
      prisma.supplier.count({ where })
    ]);

    // Format response to include total debt
    const formattedSuppliers = suppliers.map(s => {
      const totalHutang = s.payables.reduce((acc, p) => acc + (p.amount - p.paidAmount), 0);
      return {
        ...s,
        totalHutang,
        payables: undefined
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: formattedSuppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET suppliers error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat supplier" },
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
    const { name, phone, address, email } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama supplier tidak boleh kosong" },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        email: email?.trim() || null,
        tenantId: dbUser.tenantId,
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("POST supplier error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat supplier" },
      { status: 500 }
    );
  }
}
