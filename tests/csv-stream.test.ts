import { describe, it, expect } from 'vitest';
import { escapeCsvCell, generateCsvString } from '@/lib/utils/csv-stream';

describe('CSV Stream Serializer', () => {
  it('escapes cells containing quotes, commas, and newlines', () => {
    expect(escapeCsvCell('Hello, World')).toBe('"Hello, World"');
    expect(escapeCsvCell('He said "Go"')).toBe('"He said ""Go"""');
    expect(escapeCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    expect(escapeCsvCell(12345)).toBe('12345');
    expect(escapeCsvCell(null)).toBe('');
  });

  it('generates compliant multi-row CSV strings', () => {
    const headers = ['Key', 'Name', 'Amount'];
    const rows = [
      ['ACC-001', 'Acme Corp', 50000],
      ['ACC-002', 'Bayer, AG', 125000],
    ];
    const csv = generateCsvString(headers, rows);
    expect(csv).toContain('Key,Name,Amount');
    expect(csv).toContain('ACC-001,Acme Corp,50000');
    expect(csv).toContain('ACC-002,"Bayer, AG",125000');
  });
});
