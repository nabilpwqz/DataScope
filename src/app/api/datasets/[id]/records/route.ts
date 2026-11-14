import { NextRequest, NextResponse } from 'next/server';
import { SearchEngine } from '@/lib/search/search-engine';
import { verifyToken } from '@/lib/auth/jwt';
import { canAccessDataset } from '@/lib/auth/rbac';
import { getRawClient } from '@/lib/db';
import { SearchQueryRequest, UserRole } from '@/types';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const datasetId = params.id;
    const body: SearchQueryRequest = await req.json();
    body.datasetId = datasetId;

    // Check permissions
    const client = await getRawClient();
    const dsRes = await client.query('SELECT access_level FROM datasets WHERE id = $1', [datasetId]);
    if (!dsRes.rows[0]) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    let userRole: UserRole = 'admin';
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) userRole = payload.role;
    }

    if (!canAccessDataset(userRole, dsRes.rows[0].access_level)) {
      return NextResponse.json(
        { error: 'Unauthorized: insufficient permissions for this dataset' },
        { status: 403 }
      );
    }

    const response = await SearchEngine.executeQuery(body);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Record search error:', err);
    return NextResponse.json(
      { error: 'Search query execution failed', details: err.message },
      { status: 500 }
    );
  }
}

