import { NextResponse } from "next/server";
import svgCaptcha from "svg-captcha";
import { cookies } from "next/headers";
import crypto from "crypto";

// Fail fast if the secret isn't configured — never fall back to a
// hardcoded default, since that value is now public (visible in
// your source/history) and would let anyone forge tokens.
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET;
if (!CAPTCHA_SECRET) {
  throw new Error("CAPTCHA_SECRET environment variable is not set");
}

/**
 * Sign {timestamp}:{answer} with HMAC-SHA256.
 * The answer itself is NEVER included in the returned token — only
 * the timestamp and the signature are. This means there is nothing
 * in the token a client can decode to learn the answer or the secret.
 */
function signAnswer(answer: string, timestamp: number): string {
  const hmac = crypto
    .createHmac("sha256", CAPTCHA_SECRET as string)
    .update(`${timestamp}:${answer.toLowerCase().trim()}`)
    .digest("hex");
  return Buffer.from(`${timestamp}:${hmac}`).toString("base64");
}

export async function GET() {
  const captcha = svgCaptcha.createMathExpr({
    mathMin: 1,
    mathMax: 9,
    mathOperator: "+",
    noise: 3,
    color: true,
    background: "transparent",
    width: 200,
    height: 60,
    fontSize: 52,
  });

  const timestamp = Date.now();
  const token = signAnswer(captcha.text, timestamp);

  const cookieStore = await cookies();
  cookieStore.set("captcha_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  return new NextResponse(captcha.data, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
