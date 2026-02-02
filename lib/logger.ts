/**
 * Security logging utility
 * Logs security-related events without exposing sensitive information
 */

type LogLevel = "info" | "warn" | "error";

interface SecurityLogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  details: Record<string, unknown>;
  userId?: string;
  ip?: string;
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown> = {},
  level: LogLevel = "info"
): void {
  const logEntry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details: sanitizeLogDetails(details),
  };

  // In production, send to logging service (e.g., Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to logging service
    console[level]("[SECURITY]", JSON.stringify(logEntry));
  } else {
    console[level]("[SECURITY]", event, details);
  }
}

/**
 * Sanitize log details to prevent sensitive data leakage
 */
function sanitizeLogDetails(
  details: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
  ];

  for (const [key, value] of Object.entries(details)) {
    // Check if key contains sensitive information
    const isSensitive = sensitiveKeys.some((sensitive) =>
      key.toLowerCase().includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogDetails(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log authentication attempts
 */
export function logAuthAttempt(
  success: boolean,
  email: string,
  ip: string,
  reason?: string
): void {
  logSecurityEvent(
    success ? "auth.login.success" : "auth.login.failed",
    {
      email: maskEmail(email),
      ip,
      reason,
    },
    success ? "info" : "warn"
  );
}

/**
 * Log suspicious file upload attempts
 */
export function logSuspiciousUpload(
  userId: string,
  filename: string,
  reason: string,
  ip: string
): void {
  logSecurityEvent(
    "upload.suspicious",
    {
      userId,
      filename,
      reason,
      ip,
    },
    "warn"
  );
}

/**
 * Log unauthorized access attempts
 */
export function logUnauthorizedAccess(
  userId: string | undefined,
  resource: string,
  action: string,
  ip: string
): void {
  logSecurityEvent(
    "access.unauthorized",
    {
      userId: userId || "anonymous",
      resource,
      action,
      ip,
    },
    "warn"
  );
}

/**
 * Mask email for logging (show first char and domain)
 */
function maskEmail(email: string): string {
  if (!email) return "[unknown]";
  const [local, domain] = email.split("@");
  if (!domain) return "[invalid]";
  return `${local[0]}***@${domain}`;
}

/**
 * Mask identifier for logging
 */
function maskIdentifier(identifier: string): string {
  if (!identifier) return "[unknown]";
  if (identifier.startsWith("ip:")) {
    const ip = identifier.substring(3);
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `ip:${parts[0]}.${parts[1]}.***.***.`;
    }
  }
  return identifier.substring(0, 8) + "***";
}
