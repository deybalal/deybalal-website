import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  try {
    const playlists = await prisma.playlist.findMany({
      include: { songs: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: playlists});
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch playlists' }, { status: 500 });
  }
}
