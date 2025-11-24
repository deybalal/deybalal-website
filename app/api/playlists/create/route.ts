import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const playlistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverArt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = playlistSchema.parse(body);

    const playlist = await prisma.playlist.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        coverArt: validatedData.coverArt,
      },
    });

    return NextResponse.json({ success: true, data: playlist});
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ success: false, message: 'Failed to create playlist' }, { status: 500 });
  }
}
