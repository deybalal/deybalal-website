import { NextResponse } from "next/server";
// import { sanitizeFilename } from "@/lib/input-sanitizer";
// import { validateFileSize, FILE_SIZE_LIMITS } from "@/lib/validators";
// import path from "path";
// import { unlink, writeFile, readFile } from "fs/promises";
// import { exec } from "child_process";
// import { Readable } from "stream";
// import { execFile } from "child_process";
// import { promisify } from "util";

// const execFileAsync = promisify(execFile);

export async function GET(/* request: Request */) {
  /*
  try {
    const file = await readFile("./4.mp3");
    const buffer = Buffer.from(file.buffer);

    const tempFilename = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;
    const tempFilenameTwo = `${tempFilename}1.wav`;
    const tempFilePath = path.join("./", `${tempFilename}.mp3`);

    await writeFile(tempFilePath, buffer);

    const std = await execFileAsync("ffmpeg", [
      "-i",
      tempFilePath,
      "-y",
      "-ar",
      "44100", // sample rate
      "-ac",
      "1", // mono
      "-sample_fmt",
      "s16", // 16-bit depth
      "-f",
      "wav",
      tempFilenameTwo,
    ]);

    const tempFileTwoPath = path.join("./", `${tempFilenameTwo}`);

    const args = ["-raw", tempFileTwoPath, "-rate", "44100", "-channels", "1"];
    const child = await execFileAsync("fpcalc", args, {
      timeout: 15000,
      killSignal: "SIGTERM",
    });

    const result = child.stdout;
    const fingerprintMatch = result.match(/FINGERPRINT=(.+)/);

    if (!fingerprintMatch) {
      throw new Error("Failed to generate fingerprint");
    }

    const fingerprint = fingerprintMatch[1];
    const dbJson = await readFile("./db.json", { encoding: "utf-8" });
    const db = JSON.parse(dbJson);

    const fund = db.find(
      (item: { fingerprint: (Readable | null | string)[] }) =>
        item.fingerprint.includes(fingerprint)
    );

    return NextResponse.json({
      success: true,
      data: {
        result: fund,
      },
      fnd: fingerprint,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود آهنگ" },
      { status: 500 }
    );
  }
  */
  return NextResponse.json({ success: true, message: "dummydata" });
}
