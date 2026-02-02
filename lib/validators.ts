/**
 * Common validation utilities
 */

/**
 * Validate file type using magic numbers (file signatures)
 */
export async function validateFileType(
  buffer: Buffer,
  expectedTypes: string[]
): Promise<{ valid: boolean; detectedType: string | null }> {
  // File signatures (magic numbers)
  const signatures: Record<string, number[][]> = {
    "audio/mpeg": [
      [0xff, 0xfb], // MP3
      [0xff, 0xf3], // MP3
      [0xff, 0xf2], // MP3
      [0x49, 0x44, 0x33], // ID3 tag
    ],
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47]],
    "image/webp": [
      [0x52, 0x49, 0x46, 0x46], // RIFF
    ],
    "image/gif": [
      [0x47, 0x49, 0x46, 0x38], // GIF8
    ],
  };

  let detectedType: string | null = null;

  // Check each signature
  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      const matches = sig.every((byte, index) => buffer[index] === byte);
      if (matches) {
        detectedType = mimeType;
        break;
      }
    }
    if (detectedType) break;
  }

  const valid = detectedType ? expectedTypes.includes(detectedType) : false;

  return { valid, detectedType };
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number
): { valid: boolean; message?: string } {
  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      message: `حجم فایل نباید بیشتر از ${maxSizeMB}MB باشد`,
    };
  }
  return { valid: true };
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  _buffer: Buffer,
  _options: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
  }
): Promise<{
  valid: boolean;
  message?: string;
  dimensions?: { width: number; height: number };
}> {
  // This is a simplified version - in production, use a library like 'sharp' or 'image-size'
  // For now, we'll just return valid
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("رمز عبور باید حداقل ۸ کاراکتر باشد");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("رمز عبور باید شامل حروف کوچک انگلیسی باشد");
  }

  // Optional: special characters
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push("رمز عبور باید شامل کاراکترهای خاص باشد");
  // }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate content length
 */
export function validateContentLength(
  content: string,
  maxLength: number,
  fieldName = "محتوا"
): { valid: boolean; message?: string } {
  if (content.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} نباید بیشتر از ${maxLength} کاراکتر باشد`,
    };
  }
  return { valid: true };
}

/**
 * File size constants
 */
export const FILE_SIZE_LIMITS = {
  AUDIO_MAX: 23 * 1024 * 1024, // 23MB
  IMAGE_MAX: 5 * 1024 * 1024, // 5MB
  AVATAR_MAX: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * Content length constants
 */
export const CONTENT_LENGTH_LIMITS = {
  COMMENT_MAX: 1000,
  DESCRIPTION_MAX: 5000,
  BIO_MAX: 500,
  TITLE_MAX: 200,
} as const;
