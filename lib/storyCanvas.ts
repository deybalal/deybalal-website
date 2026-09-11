import { generateQRCode } from "./qrGenerator";

export type StoryTheme = "ambient" | "dark" | "vibrant" | "lyrics";

export interface StoryCardOptions {
  theme: StoryTheme;
  showQr: boolean;
  showProgress: boolean;
  currentProgress?: number;
  lyricsSnippet?: string | null;
  lyricsFontSize?: number;
  song: {
    id: string;
    title: string;
    artist: string;
    coverArt?: string | null;
    album?: string | null;
    duration?: number;
    url: string;
    shortUrl?: string;
  };
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

// Resolve actual font family string (Canvas 2D cannot parse CSS var() expressions)
export function resolveFontFamily(): string {
  if (typeof window !== "undefined") {
    try {
      const computedVar =
        getComputedStyle(document.body).getPropertyValue("--font-iranyekan").trim() ||
        getComputedStyle(document.documentElement).getPropertyValue("--font-iranyekan").trim();
      if (computedVar) {
        return `${computedVar}, Vazirmatn, Tahoma, sans-serif`;
      }
      const bodyFont = getComputedStyle(document.body).fontFamily;
      if (bodyFont) {
        return `${bodyFont}, Vazirmatn, Tahoma, sans-serif`;
      }
    } catch {
      // ignore
    }
  }
  return "Vazirmatn, Tahoma, sans-serif";
}

// Safely apply font to canvas context with fallback
function applyFont(
  ctx: CanvasRenderingContext2D,
  weight: string,
  size: number,
  customFamily?: string
) {
  const family = customFamily || resolveFontFamily();
  ctx.font = `${weight} ${size}px ${family}`;
  // If font assignment was rejected by browser parser, fallback safely
  if (!ctx.font.includes(`${size}px`)) {
    ctx.font = `${weight} ${size}px Vazirmatn, Tahoma, sans-serif`;
  }
}

// Helper: load image safely with CORS handling
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If anonymous failed (e.g. strict CORS), try without crossOrigin as fallback
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => resolve(null);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

function formatDuration(seconds: number = 0): string {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Helper: draw rounded rect path
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

// Helper to wrap text into multiple lines
function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function renderStoryCard(
  canvas: HTMLCanvasElement,
  options: StoryCardOptions
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const { theme, showQr, showProgress, song } = options;
  const coverImg = song.coverArt ? await loadImage(song.coverArt) : null;

  // 1. Draw Background based on Theme
  ctx.save();
  if (theme === "ambient") {
    if (coverImg) {
      // Draw zoomed blurred cover image
      ctx.save();
      ctx.filter = "blur(75px) brightness(0.65) saturate(1.4)";
      ctx.drawImage(
        coverImg,
        -150,
        -150,
        CANVAS_WIDTH + 300,
        CANVAS_HEIGHT + 300
      );
      ctx.restore();
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, "#1e1b4b");
      bgGrad.addColorStop(0.5, "#0f172a");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Gradient scrim overlay
    const overlayGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    overlayGrad.addColorStop(0, "rgba(8, 10, 15, 0.7)");
    overlayGrad.addColorStop(0.4, "rgba(8, 10, 15, 0.45)");
    overlayGrad.addColorStop(0.7, "rgba(8, 10, 15, 0.75)");
    overlayGrad.addColorStop(1, "rgba(5, 6, 10, 0.95)");
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (theme === "dark") {
    // Dark Obsidian Theme
    const darkGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      700,
      100,
      CANVAS_WIDTH / 2,
      700,
      1000
    );
    darkGrad.addColorStop(0, "#1a1b26");
    darkGrad.addColorStop(0.6, "#0e1017");
    darkGrad.addColorStop(1, "#050608");
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle atmospheric glow behind artwork
    const glowGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      700,
      150,
      CANVAS_WIDTH / 2,
      700,
      500
    );
    glowGrad.addColorStop(0, "rgba(147, 51, 234, 0.2)");
    glowGrad.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (theme === "vibrant") {
    // Vibrant Sunset / Neon Mesh Gradient
    const vibGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    vibGrad.addColorStop(0, "#3b0764");
    vibGrad.addColorStop(0.35, "#701a75");
    vibGrad.addColorStop(0.7, "#1e1b4b");
    vibGrad.addColorStop(1, "#09090b");
    ctx.fillStyle = vibGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Diagonal accents
    const accentGrad = ctx.createRadialGradient(800, 400, 50, 800, 400, 600);
    accentGrad.addColorStop(0, "rgba(236, 72, 153, 0.3)");
    accentGrad.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else if (theme === "lyrics") {
    // Atmospheric dark with blur
    if (coverImg) {
      ctx.save();
      ctx.filter = "blur(90px) brightness(0.4)";
      ctx.drawImage(
        coverImg,
        -100,
        -100,
        CANVAS_WIDTH + 200,
        CANVAS_HEIGHT + 200
      );
      ctx.restore();
    }
    const lyrOverlay = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    lyrOverlay.addColorStop(0, "rgba(10, 12, 18, 0.85)");
    lyrOverlay.addColorStop(0.5, "rgba(10, 12, 18, 0.75)");
    lyrOverlay.addColorStop(1, "rgba(5, 6, 10, 0.95)");
    ctx.fillStyle = lyrOverlay;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.restore();

  // 2. Header Branding: Deybalal Top Badge
  ctx.save();
  const headerY = 120;
  const badgeWidth = 440;
  const badgeHeight = 72;
  const badgeX = (CANVAS_WIDTH - badgeWidth) / 2;

  // Frosted pill container
  drawRoundedRect(ctx, badgeX, headerY, badgeWidth, badgeHeight, 36);
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Logo soundwaves icon
  const waveStartX = badgeX + 36;
  const waveCenterY = headerY + 36;
  ctx.fillStyle = "#ec4899";
  const waveHeights = [16, 28, 38, 22, 32, 18];
  waveHeights.forEach((h, i) => {
    drawRoundedRect(ctx, waveStartX + i * 9, waveCenterY - h / 2, 5, h, 2.5);
    ctx.fill();
  });

  // Badge Text
  applyFont(ctx, "bold", 30);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("دی بلال", badgeX + badgeWidth - 36, headerY + 36);

  applyFont(ctx, "normal", 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.textAlign = "left";
  ctx.fillText(
    (process.env.NEXT_PUBLIC_DEPLOYED_URL || "deybalal.com")
      .replace("https://", "")
      .replace("http://", ""),
    waveStartX + 66,
    headerY + 37
  );
  ctx.restore();

  // 3. Main Center Content: Depends on whether theme is 'lyrics' or artwork-centric
  if (theme === "lyrics") {
    // Mini Album & Song Pill at top
    ctx.save();
    const miniY = 240;
    const miniW = 740;
    const miniH = 110;
    const miniX = (CANVAS_WIDTH - miniW) / 2;

    drawRoundedRect(ctx, miniX, miniY, miniW, miniH, 28);
    ctx.fillStyle = "rgba(255, 255, 255, 0.09)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mini cover thumbnail
    const thumbSize = 86;
    const thumbX = miniX + miniW - thumbSize - 12;
    const thumbY = miniY + 12;
    if (coverImg) {
      ctx.save();
      drawRoundedRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 18);
      ctx.clip();
      ctx.drawImage(coverImg, thumbX, thumbY, thumbSize, thumbSize);
      ctx.restore();
    } else {
      drawRoundedRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 18);
      ctx.fillStyle = "#6366f1";
      ctx.fill();
    }

    // Mini title & artist
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    applyFont(ctx, "bold", 34);
    ctx.fillText(song.title, thumbX - 20, miniY + 44);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    applyFont(ctx, "normal", 26);
    ctx.fillText(song.artist, thumbX - 20, miniY + 82);
    ctx.restore();

    // Prominent Lyrics Box
    ctx.save();
    const lyricsBoxY = 400;
    const lyricsBoxW = 920;
    const lyricsBoxH = showProgress || showQr ? 900 : 1150;
    const lyricsBoxX = (CANVAS_WIDTH - lyricsBoxW) / 2;

    drawRoundedRect(ctx, lyricsBoxX, lyricsBoxY, lyricsBoxW, lyricsBoxH, 36);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Quote icon
    ctx.font = "italic 85px Georgia, serif";
    ctx.fillStyle = "rgba(236, 72, 153, 0.35)";
    ctx.textAlign = "right";
    ctx.fillText("“", lyricsBoxX + lyricsBoxW - 40, lyricsBoxY + 90);

    // Lyrics lines with user-controlled font size and line wrapping
    const lyricsText = options.lyricsSnippet || "";
    const rawLines = lyricsText.split("\n").filter((l) => l.trim().length > 0);

    const fontSize = options.lyricsFontSize || 34;
    const lineHeight = Math.round(fontSize * 1.7);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    applyFont(ctx, "bold", fontSize);

    const maxLyricsWidth = lyricsBoxW - 100;
    const formattedLines: string[] = [];
    for (const rawLine of rawLines) {
      const wrapped = getWrappedLines(ctx, rawLine.trim(), maxLyricsWidth);
      formattedLines.push(...wrapped);
    }

    const totalHeight = formattedLines.length * lineHeight;
    let currentY = lyricsBoxY + (lyricsBoxH - totalHeight) / 2 + fontSize / 2;
    if (currentY < lyricsBoxY + 90) {
      currentY = lyricsBoxY + 90;
    }

    for (const line of formattedLines) {
      if (currentY > lyricsBoxY + lyricsBoxH - 45) break;
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 14;
      ctx.fillText(line.trim(), CANVAS_WIDTH / 2, currentY);
      currentY += lineHeight;
    }
    ctx.restore();
  } else {
    // Standard Card Layout: Cover Art in Center
    ctx.save();
    const artSize = 670;
    const artX = (CANVAS_WIDTH - artSize) / 2;
    const artY = 320;

    // Shadow for cover art
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 24;

    // Draw artwork
    if (coverImg) {
      ctx.save();
      drawRoundedRect(ctx, artX, artY, artSize, artSize, 36);
      ctx.clip();
      ctx.drawImage(coverImg, artX, artY, artSize, artSize);
      ctx.restore();
    } else {
      // Artistic Gradient Placeholder
      const placeholderGrad = ctx.createLinearGradient(
        artX,
        artY,
        artX + artSize,
        artY + artSize
      );
      placeholderGrad.addColorStop(0, "#6366f1");
      placeholderGrad.addColorStop(0.5, "#a855f7");
      placeholderGrad.addColorStop(1, "#ec4899");
      ctx.fillStyle = placeholderGrad;
      drawRoundedRect(ctx, artX, artY, artSize, artSize, 36);
      ctx.fill();

      // Musical note in center
      ctx.font = "140px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🎵", artX + artSize / 2, artY + artSize / 2);
    }

    // Subtle crisp border around artwork
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, artX, artY, artSize, artSize, 36);
    ctx.stroke();
    ctx.restore();

    // 4. Song Information (Title, Artist, Album)
    ctx.save();
    const metaY = 1060;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Long title wrapping
    applyFont(ctx, "bold", 68);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;

    const titleLines = getWrappedLines(ctx, song.title, 840);
    let titleCursorY = metaY;
    for (const tLine of titleLines.slice(0, 2)) {
      ctx.fillText(tLine, CANVAS_WIDTH / 2, titleCursorY);
      titleCursorY += 80;
    }

    // Artist Name
    applyFont(ctx, "normal", 44);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillText(song.artist, CANVAS_WIDTH / 2, titleCursorY + 16);

    // Album Name (if present)
    if (song.album) {
      applyFont(ctx, "normal", 32);
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`آلبوم: ${song.album}`, CANVAS_WIDTH / 2, titleCursorY + 70);
    }
    ctx.restore();
  }

  // 5. Simulated Music Player Controls & Progress Bar
  const playerY = theme === "lyrics" ? 1340 : 1280;
  if (showProgress) {
    ctx.save();
    const barWidth = 740;
    const barHeight = 8;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = playerY;

    // Track background
    drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
    ctx.fill();

    // Track active progress from dynamic currentProgress
    const totalDuration = song.duration || 210;
    const currentProgress =
      options.currentProgress !== undefined
        ? Math.max(0, Math.min(options.currentProgress, totalDuration))
        : Math.round(totalDuration * 0.38);

    const progressRatio =
      totalDuration > 0
        ? Math.max(0.04, Math.min(0.96, currentProgress / totalDuration))
        : 0.38;
    const progressWidth = barWidth * progressRatio;

    const progGrad = ctx.createLinearGradient(
      barX,
      barY,
      barX + progressWidth,
      barY
    );
    progGrad.addColorStop(0, "#ec4899");
    progGrad.addColorStop(1, "#a855f7");
    drawRoundedRect(ctx, barX, barY, progressWidth, barHeight, 4);
    ctx.fillStyle = progGrad;
    ctx.fill();

    // Thumb handle
    ctx.beginPath();
    ctx.arc(barX + progressWidth, barY + barHeight / 2, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(236, 72, 153, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Timestamps
    ctx.font = "bold 26px monospace, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "left";
    ctx.fillText(formatDuration(currentProgress), barX, barY + 38);

    ctx.textAlign = "right";
    ctx.fillText(formatDuration(totalDuration), barX + barWidth, barY + 38);

    // Player Buttons Mockup (Previous, Play/Pause Circle, Next, Heart)
    const btnY = barY + 95;
    const centerX = CANVAS_WIDTH / 2;

    // Big Play Circle Button
    ctx.beginPath();
    ctx.arc(centerX, btnY, 44, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Play triangle icon inside
    ctx.beginPath();
    ctx.moveTo(centerX - 8, btnY - 16);
    ctx.lineTo(centerX + 16, btnY);
    ctx.lineTo(centerX - 8, btnY + 16);
    ctx.closePath();
    ctx.fillStyle = "#0c0d12";
    ctx.fill();

    // Next Button (Right)
    const nextX = centerX + 110;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(nextX - 10, btnY - 14);
    ctx.lineTo(nextX + 6, btnY);
    ctx.lineTo(nextX - 10, btnY + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(nextX + 10, btnY - 14);
    ctx.lineTo(nextX + 10, btnY + 14);
    ctx.stroke();

    // Previous Button (Left)
    const prevX = centerX - 110;
    ctx.beginPath();
    ctx.moveTo(prevX + 10, btnY - 14);
    ctx.lineTo(prevX - 6, btnY);
    ctx.lineTo(prevX + 10, btnY + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(prevX - 10, btnY - 14);
    ctx.lineTo(prevX - 10, btnY + 14);
    ctx.stroke();

    // Heart icon on the far right
    const heartX = barX + barWidth - 10;
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(heartX - 6, btnY - 6, 7, Math.PI, 0, false);
    ctx.arc(heartX + 6, btnY - 6, 7, Math.PI, 0, false);
    ctx.lineTo(heartX, btnY + 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // 6. Scannable QR Code Card (if enabled)
  if (showQr) {
    ctx.save();
    const qrCardY = showProgress ? 1540 : 1480;
    const qrCardW = 460;
    const qrCardH = 170;
    const qrCardX = (CANVAS_WIDTH - qrCardW) / 2;

    drawRoundedRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 28);
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Generate QR matrix
    const targetUrl = song.shortUrl || song.url;
    const qr = generateQRCode(targetUrl);
    const qrSize = 120;
    const qrX = qrCardX + qrCardW - qrSize - 25;
    const qrY = qrCardY + (qrCardH - qrSize) / 2;

    // Draw white container for QR
    drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Render QR modules
    const cellSize = qrSize / qr.size;
    ctx.fillStyle = "#0c0d12";
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          ctx.fillRect(
            qrX + c * cellSize,
            qrY + r * cellSize,
            cellSize + 0.4,
            cellSize + 0.4
          );
        }
      }
    }

    // Text beside QR
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    applyFont(ctx, "bold", 30);
    ctx.fillText("کد QR را اسکن کنید", qrX - 25, qrCardY + 68);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    applyFont(ctx, "normal", 24);
    ctx.fillText("پلتفرم آنلاین دی بلال", qrX - 25, qrCardY + 108);

    ctx.restore();
  }

  // 7. Footer Watermark
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  applyFont(ctx, "normal", 26);
  ctx.fillText("دی بلال • پلتفرم هوشمند آهنگ لری", CANVAS_WIDTH / 2, 1850);
  ctx.restore();
}

/**
 * Exports canvas content to Blob
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
}

/**
 * Direct file download helper
 */
export function downloadCanvasImage(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  const link = document.createElement("a");
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
