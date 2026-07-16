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

    const customer = await prisma.customer.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      },
      include: {
        _count: {
          select: { transactions: true }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Get last 5 transactions
          include: {
            details: true,
            cashier: { select: { name: true } }
          }
        },
        receivables: {
          where: { isPaid: false },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Get favorite products
    const favoriteProducts = await prisma.transactionDetail.groupBy({
      by: ['productId', 'productName'],
      where: {
        transaction: {
          customerId: id,
          tenantId: dbUser.tenantId
        }
      },
      _sum: {
        qty: true
      },
      orderBy: {
        _sum: {
          qty: 'desc'
        }
      },
      take: 5
    });

    // Format response
    const formattedCustomer = {
      ...customer,
      totalTransactions: customer._count.transactions,
      lastVisit: customer.transactions[0]?.createdAt || null,
      favoriteProducts: favoriteProducts.map(p => ({
        id: p.productId,
        name: p.productName,
        qty: p._sum.qty
      })),
      _count: undefined
    };

    return NextResponse.json({ success: true, data: formattedCustomer });
  } catch (error) {
    console.error("GET customer detail error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat detail pelanggan" },
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

    // Check existing customer
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      }
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Check unique phone within tenant (excluding this customer)
    const existingPhone = await prisma.customer.findFirst({
      where: {
        tenantId: dbUser.tenantId,
        phone: phone.trim(),
        id: { not: id }
      }
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "No. Telepon sudah terdaftar pada pelanggan lain" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("PUT customer error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pelanggan" },
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

    // Check existing customer
    const existingCustomer = await prisma.customer.findFirst({
      where: { 
        id,
        tenantId: dbUser.tenantId 
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    if (!existingCustomer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    if (existingCustomer._count.transactions > 0) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat menghapus pelanggan yang memiliki riwayat transaksi" },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE customer error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus pelanggan" },
      { status: 500 }
    );
  }
}
