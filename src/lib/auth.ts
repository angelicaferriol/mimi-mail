import jwt from 'jsonwebtoken';
import { cookies as getCookies } from 'next/headers';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production!');
}
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-mimi-key-123';

export interface UserSession {
  userId: number;
  username: string;
  email: string;
}

export async function createSession(user: UserSession) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
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
    const decoded = jwt.verify(sessionCookie.value, JWT_SECRET) as UserSession;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await getCookies();
  cookieStore.delete('session');
}
