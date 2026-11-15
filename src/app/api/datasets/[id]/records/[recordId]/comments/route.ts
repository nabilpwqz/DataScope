import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';
import { RecordComment } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: datasetId, recordId } = await params;
    const client = await getRawClient();

    const res = await client.query(
      `
      SELECT id, record_id, user_id, user_name, user_role, content, created_at
      FROM record_comments
      WHERE record_id = $1
      ORDER BY created_at ASC;
      `,
      [recordId]
    );

    const comments: RecordComment[] = res.rows.map((row: any) => ({
      id: row.id,
      recordId: row.record_id,
      userId: row.user_id,
      userName: row.user_name,
      userRole: row.user_role,
      content: row.content,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }));

    return NextResponse.json({ comments });
  } catch (err: any) {
    console.error('Fetch record comments error:', err);
    return NextResponse.json({ error: 'Failed to retrieve comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: datasetId, recordId } = await params;
    const client = await getRawClient();

    let userId = 'usr-admin-01';
    let userName = 'Elena Rostova';
    let userRole = 'admin';

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.userId;
        userName = payload.name;
        userRole = payload.role;
      }
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    const commentId = `cmt-${crypto.randomBytes(4).toString('hex')}`;

    await client.query(
      `
      INSERT INTO record_comments (id, record_id, user_id, user_name, user_role, content)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [commentId, recordId, userId, userName, userRole, content.trim()]
    );

    // Also record in record_history audit trail for this record
    const historyId = `hist-${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `
      INSERT INTO record_history (id, record_id, changed_by_user_id, changed_by_name, change_type, diff_payload)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [
        historyId,
        recordId,
        userId,
        userName,
        'TAG_ADDED',
        JSON.stringify({ note: content.trim().slice(0, 80) }),
      ]
    );

    return NextResponse.json(
      {
        comment: {
          id: commentId,
          recordId,
          userId,
          userName,
          userRole,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Create record comment error:', err);
    return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 });
  }
}
