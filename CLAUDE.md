@AGENTS.md

# Dicatat POS - Project Context

## Stack

- Framework: Next.js 15 App Router
- UI: Tailwind CSS + shadcn/ui (Nova preset - Lucide/Geist)
- Database: Supabase (PostgreSQL) via Prisma 7
- Auth: Supabase Auth
- Deploy: Vercel
- Package Manager: npm

## Brand

- Nama: Dicatat
- Tagline: Sahabat UMKM Pengganti Nota
- Primary: #0D1F3D (Navy)
- Accent: #00A76F (Hijau)
- Font: Nunito Sans (heading), Inter (body)

## Responsive Design (WAJIB)

- Mobile-first untuk halaman POS/kasir
- Desktop-first untuk dashboard & laporan
- Sidebar: drawer/sheet di mobile, fixed di desktop
- Bottom navigation di mobile untuk POS
- Grid produk POS: 2 kolom mobile, 3-4 tablet, 5-6 desktop
- Cart POS: slide-up sheet di mobile
- Touch target minimum 44px
- Breakpoints: sm(640) md(768) lg(1024) xl(1280)

## Konvensi Kode

- Semua teks UI dalam Bahasa Indonesia
- Timezone: Asia/Jakarta (WIB)
- Currency: IDR (Rupiah) format: Rp 10.000
- Gunakan Server Components by default, Client Components hanya jika perlu interaktivitas
- Error handling selalu dalam Bahasa Indonesia
- Loading states wajib di setiap fetch data

## Struktur Folder

- src/app/(auth)/ - halaman login, register
- src/app/(dashboard)/ - semua halaman dashboard
- src/components/ui/ - shadcn components
- src/components/pos/ - komponen kasir
- src/components/dashboard/ - komponen dashboard
- src/lib/ - utilities, prisma client, supabase client

## Multi-tenant

- Setiap query WAJIB filter by tenantId
- tenantId diambil dari session user
- Jangan pernah query tanpa tenantId kecuali super admin

## Prisma Models

Tenant, User, Product, Category, Customer, Supplier,
Transaction, TransactionDetail, Receivable, Payable, Subscription

## Enum

- Plan: TRIAL, STARTER, PRO, BUSINESS
- Role: OWNER, ADMIN, KASIR
- PaymentStatus: PAID, UNPAID
