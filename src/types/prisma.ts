// Custom types karena Prisma 7 tidak export enum langsung
export type Plan = 'TRIAL' | 'STARTER' | 'PRO' | 'BUSINESS';
export type Role = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'KASIR';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS' | 'PAY_LATER';
