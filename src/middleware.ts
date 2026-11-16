import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'datascope-enterprise-nextauth-secret-key-32-chars-min';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Unprotected public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/demo-login') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // 2. Extract token from NextAuth session or fallback cookie
  const token = await getToken({
    req,
    secret: JWT_SECRET,
    cookieName: req.cookies.get('__Secure-next-auth.session-token')
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  });

  const customToken = req.cookies.get('datascope_token')?.value;
  const authHeader = req.headers.get('authorization');
  const hasAuth = !!token || !!customToken || (!!authHeader && authHeader.startsWith('Bearer '));

  // 3. Protect API routes (except /api/auth and /api/health)
  if (pathname.startsWith('/api/')) {
    if (!hasAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: valid authentication session or token is required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Protect Dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasAuth) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

