import { describe, it, expect } from 'vitest';
import { AISearchAssistant } from '@/lib/search/ai-assistant';

describe('AI Search Assistant NLQ Parser & Guardrails', () => {
  it('should parse complex multi-condition prompt from spec correctly', () => {
    const prompt = 'Find active customers from Germany with revenue greater than $10,000';
    const result = AISearchAssistant.parsePrompt(prompt, 'ds-sales-01');

    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.validationErrors.length).toBe(0);

    const filters = result.queryConfig.filters || [];
    expect(filters.length).toBe(3);

    // Status filter
    const statusF = filters.find((f) => f.field === 'status');
    expect(statusF?.value).toBe('Active');

    // Country filter
    const countryF = filters.find((f) => f.field === 'country');
    expect(countryF?.value).toBe('Germany');

    // Revenue filter
    const revF = filters.find((f) => f.field === 'numericValue');
    expect(revF?.operator).toBe('greater_than');
    expect(revF?.value).toBe(10000);
  });

  it('should handle date range expressions like last 30 days', () => {
    const prompt = 'Show enterprise accounts created in the last 30 days';
    const result = AISearchAssistant.parsePrompt(prompt, 'ds-sales-01');

    const dateFilter = result.queryConfig.filters?.find((f) => f.field === 'recordDate');
    expect(dateFilter).toBeDefined();
    expect(dateFilter?.operator).toBe('greater_than');
  });

  it('should enforce guardrails for empty or unparseable input', () => {
    const prompt = 'hello world';
    const result = AISearchAssistant.parsePrompt(prompt, 'ds-sales-01');

    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
