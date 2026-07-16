import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ── Tailwind class merger ─────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Format Rupiah (IDR) ───────────────────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Format angka tanpa simbol mata uang ──────────────────────────────────────
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

// ── Format tanggal WIB ───────────────────────────────────────────────────────
export function formatDate(
  date: Date | string,
  fmt = "dd MMMM yyyy"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt, { locale: localeId });
}

// ── Format tanggal + jam WIB ─────────────────────────────────────────────────
export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

// ── Generate nomor invoice ────────────────────────────────────────────────────
export function generateInvoice(prefix = "INV"): string {
  const now = new Date();
  const ymd = format(now, "yyyyMMdd");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ymd}-${rand}`;
}

// ── Truncate string ───────────────────────────────────────────────────────────
export function truncate(str: string, length = 30): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}
