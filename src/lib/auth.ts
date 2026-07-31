import jwt from 'jsonwebtoken';
import { cookies as getCookies } from 'next/headers';

export interface UserSession {
  userId: number;
  username: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production!');
    }
    return 'super-secret-mimi-key-123';
  }
  return secret;
}

export async function createSession(user: UserSession) {
  const secret = getJwtSecret();
  const token = jwt.sign(user, secret, { expiresIn: '7d' });
  const cookieStore = await getCookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await getCookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(sessionCookie.value, secret) as UserSession;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await getCookies();
  cookieStore.delete('session');
}
