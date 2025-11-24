import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  try {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: songs});
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch songs' }, { status: 500 });
  }
}
