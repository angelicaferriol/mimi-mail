import { cookies as getCookies } from 'next/headers';
import { getRequestContext } from '@cloudflare/next-on-pages';

export interface UserSession {
  userId: number;
  username: string;
  email: string;
}

export interface JwtPayload extends UserSession {
  exp: number;
}

function getJwtSecret(): string {
  let secret = process.env.JWT_SECRET;
  try {
    const context = getRequestContext();
    const env = context?.env as Record<string, unknown> | undefined;
    if (env?.JWT_SECRET) {
      secret = env.JWT_SECRET as string;
    }
  } catch {
    // Not in Cloudflare environment
  }
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

// Simple, Edge-compatible HS256 JWT sign/verify using Web Crypto API
async function base64urlEncode(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...buf))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = await base64urlEncode(JSON.stringify(header));
  const encodedPayload = await base64urlEncode(JSON.stringify(payload));
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  
  const keyBuf = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(tokenInput)
  );
  
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuf)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${tokenInput}.${signature}`;
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  
  const keyBuf = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const sigBytes = Uint8Array.from(
    atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    new TextEncoder().encode(tokenInput)
  );
  
  if (!isValid) return null;
  
  const payloadStr = new TextDecoder().decode(
    Uint8Array.from(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  );
  return JSON.parse(payloadStr) as JwtPayload;
}

export async function createSession(user: UserSession) {
  const secret = getJwtSecret();
  // Set expiration to 7 days from now
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const token = await signJwt(payload, secret);
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
    const decoded = await verifyJwt(sessionCookie.value, secret);
    if (!decoded) return null;
    
    // Check expiration
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return null;
    }
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await getCookies();
  cookieStore.delete('session');
}
