import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Forbidden: client-side role switching has been permanently disabled per Phase 1 security specifications. Authenticate with real credentials.',
    },
    { status: 403 }
  );
}
