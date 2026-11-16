import { NextRequest, NextResponse } from 'next/server';
import { getRawClient } from '@/lib/db';
import { authorize } from '@/lib/auth/authorize';
import { CommentCreateSchema } from '@/lib/validation/schemas';
import { RecordComment } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const { id: datasetId, recordId } = params;

    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

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
  { params }: { params: { id: string; recordId: string } }
) {
  try {
    const { id: datasetId, recordId } = params;

    const auth = await authorize(req, { datasetId, action: 'read' });
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const rawBody = await req.json();
    const parsed = CommentCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty (maximum 2000 characters)' },
        { status: 400 }
      );
    }

    const { content } = parsed.data;
    const client = await getRawClient();
    const commentId = `cmt-${crypto.randomBytes(4).toString('hex')}`;

    await client.query(
      `
      INSERT INTO record_comments (id, record_id, user_id, user_name, user_role, content)
      VALUES ($1, $2, $3, $4, $5, $6);
      `,
      [commentId, recordId, auth.user.id, auth.user.name, auth.user.role, content.trim()]
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
        auth.user.id,
        auth.user.name,
        'COMMENT_ADDED',
        JSON.stringify({ note: content.trim().slice(0, 80) }),
      ]
    );

    return NextResponse.json(
      {
        comment: {
          id: commentId,
          recordId,
          userId: auth.user.id,
          userName: auth.user.name,
          userRole: auth.user.role,
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
