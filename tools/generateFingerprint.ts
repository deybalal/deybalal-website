import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function generateFingerprint(filePath: string) {
  const { stdout } = await execFileAsync("fpcalc", [filePath]);

  const fingerprintMatch = stdout.match(/FINGERPRINT=(.+)/);
  const durationMatch = stdout.match(/DURATION=(\d+)/);

  if (!fingerprintMatch || !durationMatch) {
    throw new Error("Failed to generate fingerprint");
  }

  return {
    fingerprint: fingerprintMatch[1],
    duration: Number(durationMatch[1]),
  };
}
