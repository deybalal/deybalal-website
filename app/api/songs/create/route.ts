import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const songSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
  albumId: z.string().optional(),
  uri: z.string().min(1),
  coverArt: z.string().optional(),
  duration: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = songSchema.parse(body);

    const song = await prisma.song.create({
      data: {
        title: validatedData.title,
        artist: validatedData.artist,
        albumId: validatedData.albumId || undefined,
        uri: validatedData.uri,
        coverArt: validatedData.coverArt,
        duration: validatedData.duration || 0,
      },
    });

    return NextResponse.json({ success: true, data: song});
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json({ success: false, message: 'Failed to create song' }, { status: 500 });
  }
}
