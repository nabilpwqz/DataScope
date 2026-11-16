/**
 * DataScope formatting utilities for enterprise numeric, currency, and date presentation.
 */

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return 'N/A';
  }
}

export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) return formatDate(d);
    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'just now';
  } catch {
    return 'N/A';
  }
}
