import crypto from "crypto";

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET;
if (!CAPTCHA_SECRET) {
  throw new Error("CAPTCHA_SECRET environment variable is not set");
}

const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function verifyCaptchaToken(token: string, userAnswer: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    const timestamp = parseInt(decoded.slice(0, separatorIndex), 10);
    const signature = decoded.slice(separatorIndex + 1);
    if (!Number.isFinite(timestamp) || !signature) return false;

    // TTL check
    if (Date.now() - timestamp > CAPTCHA_TTL_MS) return false;

    // Recompute the expected signature using the user's submitted
    // answer, then compare it to the signature in the token — the
    // token never contained the answer itself.
    const expectedSignature = crypto
      .createHmac("sha256", CAPTCHA_SECRET as string)
      .update(`${timestamp}:${userAnswer.toLowerCase().trim()}`)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");

    // Signatures must be equal length for timingSafeEqual, and a
    // length mismatch itself means "not equal" — check that first.
    if (sigBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
