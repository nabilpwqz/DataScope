import { describe, it, expect } from 'vitest';

interface ExportRecord {
  recordKey: string;
  title: string;
  category: string;
  status: string;
  numericValue: number;
  country: string;
  region: string;
  recordDate: string;
}

function generateCsv(records: ExportRecord[], maskPii: boolean = false): string {
  const header = 'Record Key,Title,Category,Status,Revenue/Amount,Country,Region,Date\n';
  const lines = records.map((r) => {
    const rawTitle = maskPii ? r.title.replace(/^([A-Za-z]{2}).+/, '$1**** Enterprise') : r.title;
    const escapedTitle = `"${rawTitle.replace(/"/g, '""')}"`;
    return `${r.recordKey},${escapedTitle},${r.category},${r.status},${r.numericValue},${r.country},${r.region},${r.recordDate}`;
  });
  return header + lines.join('\n');
}

describe('CSV Export Engine & DLP Sanitization', () => {
  const sampleRecords: ExportRecord[] = [
    {
      recordKey: 'REC-001',
      title: 'Acme Corporation "Global"',
      category: 'Enterprise Sales',
      status: 'Active',
      numericValue: 125000,
      country: 'Germany',
      region: 'EMEA',
      recordDate: '2026-03-15',
    },
    {
      recordKey: 'REC-002',
      title: 'Nexus Data Technologies',
      category: 'Cloud Services',
      status: 'Pending',
      numericValue: 48000,
      country: 'United States',
      region: 'AMER',
      recordDate: '2026-04-10',
    },
  ];

  it('should format CSV with correct headers and line breaks', () => {
    const csv = generateCsv(sampleRecords, false);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Record Key,Title,Category,Status,Revenue/Amount,Country,Region,Date');
    expect(lines.length).toBe(3);
  });

  it('should properly escape double quotes in company titles', () => {
    const csv = generateCsv(sampleRecords, false);
    expect(csv).toContain('"Acme Corporation ""Global"""');
  });

  it('should apply Data Loss Prevention (DLP) masking when requested', () => {
    const csv = generateCsv(sampleRecords, true);
    expect(csv).toContain('Ac**** Enterprise');
    expect(csv).not.toContain('Acme Corporation');
  });
});
