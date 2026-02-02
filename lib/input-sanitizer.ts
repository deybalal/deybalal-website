/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Remove script tags and their content
  let sanitized = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Remove iframe tags
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ""
  );

  // Remove object and embed tags
  sanitized = sanitized.replace(
    /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    ""
  );

  return sanitized.trim();
}

/**
 * Escape HTML special characters
 * Use this for displaying user input as plain text
 */
export function escapeHtml(input: string): string {
  if (!input) return "";

  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, "");

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, "");

  // Remove special characters except alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized || "unnamed";
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize text content for comments and descriptions
 * Removes HTML but preserves line breaks
 */
export function sanitizeTextContent(input: string, maxLength = 1000): string {
  if (!input) return "";

  // First escape HTML
  let sanitized = escapeHtml(input);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate CUID format (used for IDs in the app)
 */
export function isValidCuid(id: string): boolean {
  if (!id) return false;

  // CUID format: c + timestamp + counter + fingerprint + random
  const cuidRegex = /^c[a-z0-9]{24}$/;
  return cuidRegex.test(id);
}

/**
 * Sanitize and validate slug
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return "";

  // Convert to lowercase
  let sanitized = slug.toLowerCase();

  // Replace spaces and special chars with hyphens
  sanitized = sanitized.replace(/[^a-z0-9-]/g, "-");

  // Remove consecutive hyphens
  sanitized = sanitized.replace(/-+/g, "-");

  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, "");

  return sanitized;
}

/**
 * Validate file path to prevent directory traversal
 */
export function isValidFilePath(filepath: string, allowedDir: string): boolean {
  if (!filepath) return false;

  // Check for directory traversal attempts
  if (
    filepath.includes("..") ||
    filepath.includes("./") ||
    filepath.includes("\\")
  ) {
    return false;
  }

  // Ensure path starts with allowed directory
  return filepath.startsWith(allowedDir);
}
