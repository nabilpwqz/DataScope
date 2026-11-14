import { SignJWT, jwtVerify } from 'jose';
import { User, UserRole } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'datascope-super-secure-production-ready-jwt-token-key-32-chars-min'
);

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export async function signToken(user: { id: string; email: string; name: string; role: UserRole; department: string }): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}
