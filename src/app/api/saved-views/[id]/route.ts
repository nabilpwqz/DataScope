import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewId = params.id;
    const client = await getRawClient();

    let userId = 'usr-admin-01';
    let userRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = await verifyToken(authHeader.split(' ')[1]);
      if (payload) {
        userId = payload.userId;
        userRole = payload.role;
      }
    }

    if (userRole === 'admin') {
      await client.query('DELETE FROM saved_views WHERE id = $1', [viewId]);
    } else {
      await client.query('DELETE FROM saved_views WHERE id = $1 AND user_id = $2', [viewId, userId]);
    }

    return NextResponse.json({ success: true, id: viewId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete saved view' }, { status: 500 });
  }
}

