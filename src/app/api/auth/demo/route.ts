import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/auth/jwt';
import { UserRole } from '@/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const DEMO_PERSONAS: Record<UserRole, { id: string; name: string; email: string; role: UserRole; department: string; avatarUrl: string }> = {
  admin: {
    id: 'usr-admin-01',
    name: 'Elena Rostova',
    email: 'admin@datascope.io',
    role: 'admin',
    department: 'Enterprise Architecture',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  analyst: {
    id: 'usr-analyst-01',
    name: 'Marcus Vance',
    email: 'analyst@datascope.io',
    role: 'analyst',
    department: 'Strategic Intelligence',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  viewer: {
    id: 'usr-viewer-01',
    name: 'Sarah Lin',
    email: 'viewer@datascope.io',
    role: 'viewer',
    department: 'Product Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  },
};

export async function POST(req: NextRequest) {
  try {
    let requestedRole: UserRole = 'admin';
    try {
      const body = await req.json();
      if (body?.role === 'admin' || body?.role === 'analyst' || body?.role === 'viewer') {
        requestedRole = body.role;
      }
    } catch (_) {
      // Empty or invalid body defaults to admin persona
    }

    const persona = DEMO_PERSONAS[requestedRole] || DEMO_PERSONAS.admin;

    const token = await signToken({
      id: persona.id,
      email: persona.email,
      name: persona.name,
      role: persona.role,
      department: persona.department,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: persona.id,
        name: persona.name,
        email: persona.email,
        role: persona.role,
        department: persona.department,
        avatarUrl: persona.avatarUrl,
        createdAt: new Date().toISOString(),
      },
      token,
    });

    response.cookies.set('datascope_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error('Demo auth error:', err);
    // Guaranteed fallback token
    const token = 'datascope-demo-session';
    const response = NextResponse.json({
      success: true,
      user: DEMO_PERSONAS.admin,
      token,
    });
    response.cookies.set('datascope_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
