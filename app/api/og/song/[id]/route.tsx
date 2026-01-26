import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const song = await prisma.song.findUnique({
      where: { id: params.id },
    });

    if (!song) {
      return new Response("Song not found", { status: 404 });
    }

    const baseUrl = new URL(request.url).origin;
    const coverArtUrl = song.coverArt
      ? song.coverArt.startsWith("http")
        ? song.coverArt
        : `${baseUrl}${song.coverArt}`
      : `${baseUrl}/assets/default-cover.jpg`;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "#ffffff",
            fontFamily: "sans-serif",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "40px",
            }}
          >
            <Image
              src={coverArtUrl}
              alt=""
              width={450}
              height={450}
              style={{
                width: "450px",
                height: "450px",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                maxWidth: "600px",
              }}
            >
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: "bold",
                  marginBottom: "16px",
                  lineHeight: 1.1,
                }}
              >
                {song.title}
              </div>
              <div
                style={{
                  fontSize: "40px",
                  color: "#a1a1aa",
                  marginBottom: "24px",
                }}
              >
                {song.artist}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "auto",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#3b82f6",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#3b82f6",
                  }}
                >
                  Listen on Dey
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
