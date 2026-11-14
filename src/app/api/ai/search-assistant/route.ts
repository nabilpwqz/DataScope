import { NextRequest, NextResponse } from 'next/server';
import { AISearchAssistant } from '@/lib/search/ai-assistant';

export async function POST(req: NextRequest) {
  try {
    const { prompt, datasetId } = await req.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Search prompt is required' }, { status: 400 });
    }

    const result = AISearchAssistant.parsePrompt(prompt, datasetId || 'ds-sales-01');
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI Search Assistant error:', err);
    return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 });
  }
}

