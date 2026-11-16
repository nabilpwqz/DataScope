import { NextRequest, NextResponse } from 'next/server';
import { AISearchAssistant } from '@/lib/search/ai-assistant';
import { authorize } from '@/lib/auth/authorize';
import { SearchQuerySchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const AISearchPromptSchema = z
  .object({
    prompt: z.string().min(1, 'Prompt is required').max(300, 'Prompt cannot exceed 300 characters'),
    datasetId: z.string().max(64).optional().default('ds-sales-01'),
  })
  .strict();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = AISearchPromptSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid prompt payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { prompt, datasetId } = parsed.data;

    // Verify dataset access
    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const result = AISearchAssistant.parsePrompt(prompt, datasetId);
    const validatedConfig = SearchQuerySchema.safeParse(result.queryConfig);
    if (!validatedConfig.success) {
      result.validationErrors.push('AI generated query configuration failed schema constraints.');
    } else {
      result.queryConfig = validatedConfig.data as any;
    }
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI Search Assistant error:', err);
    return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 });
  }
}
