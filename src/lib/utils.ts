import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const currencyFmt = new Intl.NumberFormat('es-AR', {
  style:                 'currency',
  currency:              'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFmt.format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  // Parse as local date to avoid UTC offset shifting the day
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR');
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/** Today's date as YYYY-MM-DD — safe for <input type="date"> defaultValue */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
