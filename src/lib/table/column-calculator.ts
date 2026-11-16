/**
 * Column width calculator based on density mode and display requirements.
 */

export type TableDensity = 'compact' | 'standard' | 'spacious';

export function getRowHeightForDensity(density: TableDensity): number {
  switch (density) {
    case 'compact':
      return 32;
    case 'spacious':
      return 52;
    case 'standard':
    default:
      return 40;
  }
}

export function calculateColumnWidth(fieldName: string, totalWidth: number): number {
  if (fieldName === 'id' || fieldName === 'recordKey') return Math.max(120, totalWidth * 0.12);
  if (fieldName === 'title') return Math.max(200, totalWidth * 0.28);
  if (fieldName === 'status') return Math.max(100, totalWidth * 0.10);
  if (fieldName === 'numericValue') return Math.max(130, totalWidth * 0.14);
  return Math.max(120, totalWidth * 0.12);
}
