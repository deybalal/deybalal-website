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
  const details = [artistName, songTitle].filter(Boolean).join(" - ");

  try {
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    const { createCanvas, loadImage, registerFont } = await import("canvas");

    // Register local Farsi font to ensure beautiful rendering across all OSes
    const fontPath = path.join(
      process.cwd(),
      "public/assets/Vazirmatn-Bold.ttf"
    );
    if (existsSync(fontPath)) {
      try {
        registerFont(fontPath, { family: "Vazirmatn", weight: "bold" });
      } catch (e) {
        console.error("Failed to register font:", e);
      }
    }

    const image = await loadImage(inputSource);

    const width = image.width || 1000;
    const height = image.height || 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Draw the image
    ctx.drawImage(image, 0, 0, width, height);

    // Draw a background gradient (mimics original SVG backdrop)
    const gradientHeight = Math.round(height * 0.25);
    const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
    gradient.addColorStop(0, "rgba(0,0,0,0.6)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, gradientHeight);

    // Calculate font sizes
    const appNameFontSize = Math.round(width * 0.05);
    const detailsFontSize = Math.round(width * 0.035);

    // Set text styles
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    // Add Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = Math.max(2, width / 200);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const strokeWidth = Math.max(1, width / 500);

    // Draw app name
    ctx.font = `bold ${appNameFontSize}px Vazirmatn, Vazir, Tahoma, Arial, sans-serif`;

    // Draw stroke (mimics SVG paint-order: stroke fill)
    ctx.lineWidth = strokeWidth * 2;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.strokeText(appName, width / 2, height * 0.09);

    // Draw fill
    ctx.fillStyle = "white";
    ctx.fillText(appName, width / 2, height * 0.09);

    // Draw details
    ctx.font = `bold ${detailsFontSize}px Vazirmatn, Vazir, Tahoma, Arial, sans-serif`;

    ctx.lineWidth = strokeWidth * 2;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.strokeText(details, width / 2, height * 0.145);

    ctx.fillStyle = "white";
    ctx.fillText(details, width / 2, height * 0.145);

    const fs = await import("fs/promises");
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.94 });
    await fs.writeFile(outputPath, buffer);

    return true;
  } catch (error) {
    console.error("Error applying watermark:", error);
    return false;
  }
}
