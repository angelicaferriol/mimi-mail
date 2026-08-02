import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ loggedIn: !!session });
}
