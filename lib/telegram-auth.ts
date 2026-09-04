import crypto from "crypto";
import { auth } from "./auth";

export function signCookieValue(value: string, secret: string): string {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64");
  return `${value}.${signature}`;
}

export async function getAuthSecret(): Promise<string> {
  if (process.env.BETTER_AUTH_SECRET) {
    return process.env.BETTER_AUTH_SECRET;
  }
  try {
    const ctx = await auth.$context;
    if (ctx?.secret) {
      return ctx.secret;
    }
  } catch (e) {
    console.error("Error getting auth context secret:", e);
  }
  return "deybalal_secret_auth_fallback_key";
}

export function getBotUsername(): string {
  return (
    process.env.TELEGRAM_BOT_USERNAME ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
    "deybalalirbot"
  ).replace(/^@/, "");
}
