import path from "path";
import crypto from "crypto";
// import fs from "fs";

/**
 * Downloads an image from a URL and saves it to the public/assets/avatars directory.
 * @param url The URL of the image to download.
 * @param filename The name to save the file as (without extension).
 * @returns The local path to the saved image (relative to public directory), or null if failed.
 */
export async function downloadAvatar(
  url: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Failed to fetch avatar from ${url}: ${response.statusText}`
      );
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine extension from content type or default to jpg
    const contentType = response.headers.get("content-type");
    let ext = "jpg";
    if (contentType) {
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("webp")) ext = "webp";
    }

    // Hash the userId to avoid exposing it in the public URL
    const hashedId = crypto
      .createHash("sha256")
      .update(userId)
      .digest("hex")
      .slice(0, 16);
    const fileName = `${hashedId}.${ext}`;
    const relativePath = `/assets/avatars/${fileName}`;
    const absolutePath = path.join(
      process.cwd(),
      "public",
      "assets",
      "avatars",
      fileName
    );

    // @ts-expect-error: Bun global is available in the target environment
    await Bun.write(absolutePath, buffer);

    return relativePath;
  } catch (error) {
    console.error("Error downloading avatar:", error);
    return null;
  }
}
