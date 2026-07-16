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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { transactions: true }
          },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    // Format the response to include last visit
    const formattedCustomers = customers.map(c => ({
      ...c,
      totalTransactions: c._count.transactions,
      lastVisit: c.transactions[0]?.createdAt || null,
      _count: undefined,
      transactions: undefined
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedCustomers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat pelanggan" },
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
    const { name, phone, address } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Nama pelanggan tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!phone || phone.trim() === "") {
      return NextResponse.json(
        { success: false, error: "No. Telepon tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Check unique phone within tenant
    const existingPhone = await prisma.customer.findFirst({
      where: {
        tenantId: dbUser.tenantId,
        phone: phone.trim()
      }
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "No. Telepon sudah terdaftar" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
        tenantId: dbUser.tenantId,
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("POST customer error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat pelanggan" },
      { status: 500 }
    );
  }
}
