import crypto from 'crypto';
import { NextRequest } from 'next/server';

const AUTH_SECRET = process.env.AUTH_SECRET || 'mrfocus_secret_key_nordic_2026_secure';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: 'superadmin' | 'user' | string;
}

export function hashPassword(password: string): string {
  const salt = 'mrfocus_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(data)
    .digest('base64url');
  return data + '.' + signature;
}

export function verifyToken(token: string): AuthUser | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [data, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(data)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'user',
    };
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  // 1. Try Authorization header (Bearer <token>)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) return user;
  }

  // 2. Try x-user-id header (for fast dev/direct access)
  const userIdHeader = req.headers.get('x-user-id');
  const userNameHeader = req.headers.get('x-user-name') || 'Usuario';
  const userEmailHeader = req.headers.get('x-user-email') || 'usuario@mrfocus.app';
  const userRoleHeader = req.headers.get('x-user-role') || 'user';
  if (userIdHeader && userIdHeader.trim()) {
    return {
      id: userIdHeader.trim(),
      email: userEmailHeader,
      name: userNameHeader,
      role: userRoleHeader,
    };
  }

  // 3. Try cookies
  const cookieToken = req.cookies.get('mrfocus_token')?.value;
  if (cookieToken) {
    const user = verifyToken(cookieToken);
    if (user) return user;
  }

  return null;
}
