import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: number) {
  if (!time || isNaN(time)) return "0:00";
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}
export function formatPlayCount(count: number | undefined) {
  if (count === undefined || count === null) return "0";
  if (count < 1000) return count.toString();
  if (count < 1000000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
}
// Helper function to calculate string similarity (Levenshtein distance)
export const getStringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0 || len2 === 0) return 0;

  // Create a matrix for dynamic programming
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
};

export const DEFAULT_DOWNLOAD_HOST = "https://dl.deybalal.ir";

export function getDownloadHost(): string {
  const host =
    process.env.NEXT_PUBLIC_DOWNLOAD_HOST || DEFAULT_DOWNLOAD_HOST;
  return host.replace(/\/+$/, "");
}

/**
 * Ensures an asset path points to the dedicated download storage server.
 * Handles:
 * - relative paths like `/assets/cover/...` or `assets/mp3/...`
 * - absolute URLs on older or external domains containing `/assets/...`
 * - fallbacks when path is falsy
 */
export function getAssetUrl(
  path: string | null | undefined,
  fallback: string = ""
): string {
  if (!path) return fallback;

  // If already absolute URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    if (path.includes("/assets/")) {
      const downloadHost = getDownloadHost();
      const assetsIndex = path.indexOf("/assets/");
      return `${downloadHost}${path.substring(assetsIndex)}`;
    }
    return path;
  }

  // If relative path under /assets/
  if (path.startsWith("/assets/") || path.startsWith("assets/")) {
    const downloadHost = getDownloadHost();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${downloadHost}${cleanPath}`;
  }

  return path;
}

/**
 * Resolves all audio URLs inside links JSON to point to dedicated storage
 */
export function resolveSongLinks<
  T extends Record<string | number, { url: string; size?: string; bytes?: number }> | null | undefined
>(links: T): T {
  if (!links) return links;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(links)) {
    if (val && typeof val === "object" && "url" in val) {
      result[key] = {
        ...val,
        url: getAssetUrl((val as { url: string }).url),
      };
    } else {
      result[key] = val;
    }
  }
  return result as T;
}
