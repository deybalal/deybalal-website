import sharp from "sharp";
import path from "path";
import { existsSync, mkdirSync } from "fs";

/**
 * Applies a watermark at the TOP Center of an image.
 *
 * @param inputSource - Path to the input image or a Buffer.
 * @param outputPath - Path where the watermarked image will be saved.
 * @param artistName - Name of the singer.
 * @param songTitle - Title of the song.
 */
export async function applyWatermark(
  inputSource: string | Buffer,
  outputPath: string,
  artistName: string,
  songTitle: string
) {
  const appName = "دی بلال";

  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const image = sharp(inputSource);
    const metadata = await image.metadata();

    // Scale font sizes based on image dimensions
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    const appNameFontSize = Math.round(width * 0.05);
    const detailsFontSize = Math.round(width * 0.035);

    // Create SVG watermark overlay
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="topGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="black" stop-opacity="0.6" />
            <stop offset="100%" stop-color="black" stop-opacity="0" />
           </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="${Math.max(
              2,
              width / 200
            )}" />
            <feOffset dx="0" dy="0" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.8" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <!-- Backdrop gradient for better readability on bright backgrounds -->
        <rect width="${width}" height="${Math.round(
      height * 0.25
    )}" fill="url(#topGradient)" />
        <style>
          .text { 
            fill: white; 
            font-family: "Vazir", "Tahoma", "Arial", sans-serif; 
            font-weight: bold;
            filter: url(#shadow);
            paint-order: stroke fill;
            stroke: rgba(0,0,0,0.5);
            stroke-width: ${Math.max(1, width / 500)}px;
          }
          .app-name { font-size: ${appNameFontSize}px; }
          .details { font-size: ${detailsFontSize}px; }
        </style>
        <text x="50%" y="${Math.round(
          height * 0.07
        )}" text-anchor="middle" class="text app-name">${appName}</text>
        <text x="50%" y="${Math.round(
          height * 0.125
        )}" text-anchor="middle" class="text details">${artistName} - ${songTitle}</text>
      </svg>
    `;

    await image
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .jpeg({ quality: 94 })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error("Error applying watermark:", error);
    return false;
  }
}
