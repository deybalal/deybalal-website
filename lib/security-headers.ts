/**
 * Security headers configuration
 */

export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy - prevents XSS attacks
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    // Prevent clickjacking attacks
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Control referrer information
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Feature policy / Permissions policy
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
    ].join(", "),

    // XSS Protection (legacy but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Strict Transport Security (HSTS) - only in production with HTTPS
    ...(process.env.NODE_ENV === "production"
      ? {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }
      : {}),
  };
}

/**
 * CORS configuration
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ];

  // Check if origin is allowed
  const isAllowed =
    origin &&
    allowedOrigins.some((allowed) => {
      // Remove trailing slash for comparison
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowed = allowed.replace(/\/$/, "");
      return normalizedOrigin === normalizedAllowed;
    });

  if (!isAllowed && process.env.NODE_ENV === "production") {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin || allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}
