/**
 * RFC 4180 compliant CSV serializer with automatic escaping for commas, quotes, and newlines.
 */

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsvString(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}
