import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '@/lib/utils/formatters';

describe('Formatters Utilities', () => {
  it('formats currency correctly with standard and edge numbers', () => {
    expect(formatCurrency(10000)).toBe('$10,000');
    expect(formatCurrency(250000.5)).toBe('$250,000.50');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('formats integers and decimals with comma thousands separators', () => {
    expect(formatNumber(131000)).toBe('131,000');
    expect(formatNumber(1000000)).toBe('1,000,000');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(null)).toBe('0');
  });

  it('formats dates consistently', () => {
    const formatted = formatDate('2026-10-27T14:26:43.690Z');
    expect(formatted).toContain('2026');
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate('invalid-date')).toBe('N/A');
  });

  it('formats relative timestamps cleanly', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });
});
