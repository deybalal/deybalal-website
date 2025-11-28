import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Move the schema definition inside the handler or ensure it's not causing
// initialization issues during the build phase if it relies on runtime variables.
// In many cases with Next.js App Router, simple top-level definitions are fine,
// but sometimes complex Zod schemas or specific import orders cause issues.
//
// However, the specific error "Cannot read properties of undefined (reading '__internal')"
// often relates to how `zod` is bundled or imported. Ensure you are using a compatible
// version of zod.
//
// Another common fix for this specific build error in Next.js with Zod is ensuring
// you aren't accidentally exporting the schema if it's not needed elsewhere,
// or simply defining it inside the function scope if it's causing module evaluation side effects.

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Define schema here to avoid potential module evaluation issues during build
    const albumSchema = z.object({
      name: z.string().min(1),
      artistName: z.string().min(1),
      nameEn: z.string().min(1, "Artist Name in English is required"),
      coverArt: z.string().optional(),
      releaseDate: z.string().optional(), // Expecting ISO string
    });

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required!" },
        { status: 400 }
      );
    }

    const validatedData = albumSchema.parse(body);

    if (!validatedData) {
      return NextResponse.json(
        { success: false, message: "Name is required!" },
        { status: 400 }
      );
    }

    const album = await prisma.album.create({
      data: {
        name: validatedData.name,
        artistName: validatedData.artistName,
        artistNameEn: validatedData.nameEn,
        coverArt: validatedData.coverArt,
        releaseDate: validatedData.releaseDate
          ? new Date(validatedData.releaseDate)
          : undefined,
      },
    });

    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    console.log("Error");
    console.error("Error creating album:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create album" },
      { status: 500 }
    );
  }
}
