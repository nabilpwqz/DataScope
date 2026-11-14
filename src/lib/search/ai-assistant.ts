import { FilterCondition, SearchQueryRequest } from '@/types';
import crypto from 'crypto';

export interface AISearchResult {
  confidence: number;
  interpretedIntent: string;
  queryConfig: Partial<SearchQueryRequest>;
  validationErrors: string[];
  suggestedPrompt: string;
}

export class AISearchAssistant {
  public static parsePrompt(prompt: string, datasetId: string): AISearchResult {
    const p = prompt.trim().toLowerCase();
    const filters: FilterCondition[] = [];
    const validationErrors: string[] = [];
    let search = '';
    const explanations: string[] = [];

    // 1. Status detection
    const statusMatches = [
      { regex: /\b(active|live)\b/i, value: 'Active' },
      { regex: /\b(pending|awaiting)\b/i, value: 'Pending' },
      { regex: /\b(archived|inactive)\b/i, value: 'Archived' },
      { regex: /\b(suspended|blocked)\b/i, value: 'Suspended' },
      { regex: /\b(completed|done|finished)\b/i, value: 'Completed' },
      { regex: /\b(flagged|suspicious|alert)\b/i, value: 'Flagged' },
    ];

    for (const sm of statusMatches) {
      if (sm.regex.test(p)) {
        filters.push({
          id: crypto.randomUUID(),
          field: 'status',
          operator: 'equals',
          value: sm.value,
        });
        explanations.push(`Status = '${sm.value}'`);
        break;
      }
    }

    // 2. Country detection
    const countryList = [
      'Germany',
      'United States',
      'United Kingdom',
      'Canada',
      'France',
      'Japan',
      'Australia',
      'Brazil',
      'Singapore',
      'Netherlands',
      'Switzerland',
      'Sweden',
    ];

    for (const c of countryList) {
      if (p.includes(c.toLowerCase())) {
        filters.push({
          id: crypto.randomUUID(),
          field: 'country',
          operator: 'equals',
          value: c,
        });
        explanations.push(`Country = '${c}'`);
        break;
      }
    }

    // 3. Numeric / Revenue comparisons (e.g., "greater than $10,000", "> 50000", "over 10k")
    const numericGtMatch = p.match(/(?:greater than|more than|over|above|>|\>=)\s*\$?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?k?)/i);
    if (numericGtMatch) {
      let rawVal = numericGtMatch[1].replace(/,/g, '');
      let multiplier = 1;
      if (rawVal.endsWith('k') || rawVal.endsWith('K')) {
        multiplier = 1000;
        rawVal = rawVal.slice(0, -1);
      }
      const val = parseFloat(rawVal) * multiplier;
      if (!isNaN(val)) {
        filters.push({
          id: crypto.randomUUID(),
          field: 'numericValue',
          operator: 'greater_than',
          value: val,
        });
        explanations.push(`Revenue / Amount > $${val.toLocaleString()}`);
      }
    }

    const numericLtMatch = p.match(/(?:less than|under|below|<|\<=)\s*\$?([0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?k?)/i);
    if (numericLtMatch) {
      let rawVal = numericLtMatch[1].replace(/,/g, '');
      let multiplier = 1;
      if (rawVal.endsWith('k') || rawVal.endsWith('K')) {
        multiplier = 1000;
        rawVal = rawVal.slice(0, -1);
      }
      const val = parseFloat(rawVal) * multiplier;
      if (!isNaN(val)) {
        filters.push({
          id: crypto.randomUUID(),
          field: 'numericValue',
          operator: 'less_than',
          value: val,
        });
        explanations.push(`Revenue / Amount < $${val.toLocaleString()}`);
      }
    }

    // 4. Date ranges (e.g., "last 30 days", "last 90 days", "this year")
    if (p.includes('last 30 days') || p.includes('past 30 days')) {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      filters.push({
        id: crypto.randomUUID(),
        field: 'recordDate',
        operator: 'greater_than',
        value: d.toISOString(),
      });
      explanations.push(`Date in Last 30 Days (>= ${d.toISOString().split('T')[0]})`);
    } else if (p.includes('last 90 days') || p.includes('past quarter')) {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      filters.push({
        id: crypto.randomUUID(),
        field: 'recordDate',
        operator: 'greater_than',
        value: d.toISOString(),
      });
      explanations.push(`Date in Last 90 Days (>= ${d.toISOString().split('T')[0]})`);
    } else if (p.includes('this year') || p.includes('2024')) {
      filters.push({
        id: crypto.randomUUID(),
        field: 'recordDate',
        operator: 'between',
        value: '2024-01-01T00:00:00.000Z',
        valueTo: '2024-12-31T23:59:59.999Z',
      });
      explanations.push('Date in 2024');
    }

    // 5. Category detection
    const categories = ['Enterprise', 'Mid-Market', 'SMB', 'Tier 1 Partner', 'Wholesale', 'Direct Consumer'];
    for (const cat of categories) {
      if (p.includes(cat.toLowerCase())) {
        filters.push({
          id: crypto.randomUUID(),
          field: 'category',
          operator: 'equals',
          value: cat,
        });
        explanations.push(`Category = '${cat}'`);
        break;
      }
    }

    // 6. Keywords fallback for text search
    // If prompt mentions specific search terms not covered by filters
    const searchExtract = p.match(/(?:named|titled|containing|keyword)\s+["']?([^"']+)["']?/i);
    if (searchExtract && searchExtract[1]) {
      search = searchExtract[1].trim();
      explanations.push(`Text Search = "${search}"`);
    }

    // Guardrail validation
    if (filters.length === 0 && !search) {
      validationErrors.push('No verifiable filter conditions or search keywords could be extracted safely.');
    }

    const interpretedIntent = explanations.length > 0
      ? `Parsed conditions: ${explanations.join(' AND ')}`
      : 'Default global search fallback';

    return {
      confidence: explanations.length > 0 ? Math.min(0.98, 0.5 + explanations.length * 0.15) : 0.3,
      interpretedIntent,
      queryConfig: {
        datasetId,
        search,
        searchType: 'hybrid',
        filters,
        filterLogicalOperator: 'AND',
        sort: [{ field: 'numericValue', direction: 'desc' }],
        page: 1,
        pageSize: 25,
      },
      validationErrors,
      suggestedPrompt: "Find active customers from Germany with revenue greater than $10,000 in the last 30 days",
    };
  }
}
