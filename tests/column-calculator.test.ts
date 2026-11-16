import { describe, it, expect } from 'vitest';
import { getRowHeightForDensity, calculateColumnWidth } from '@/lib/table/column-calculator';

describe('Table Column Calculator', () => {
  it('returns appropriate row heights per density preset', () => {
    expect(getRowHeightForDensity('compact')).toBe(32);
    expect(getRowHeightForDensity('standard')).toBe(40);
    expect(getRowHeightForDensity('spacious')).toBe(52);
  });

  it('computes proportional column widths based on container width', () => {
    const width = calculateColumnWidth('title', 1000);
    expect(width).toBe(280);
    const keyWidth = calculateColumnWidth('recordKey', 1000);
    expect(keyWidth).toBe(120);
  });
});
