/**
 * Manual SHA-256 implementation for zero-dependency and non-secure environments.
 * Based on the FIPS 180-2 specification.
 */
function sha256_sync(message: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  // UTF-8 encoding
  const ascii = unescape(encodeURIComponent(message));
  for (let i = 0; i < ascii.length * 8; i += 8) {
    words[i >> 5] |= (ascii.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
  }

  const asciiBitLength = ascii.length * 8;
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);

  const k = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const w = new Uint32Array(64);

  for (let i = 0; i < words.length; i += 16) {
    let [a, b, c, d, e, f, g, h] = hash;

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j];
      } else {
        const s0 =
          rightRotate(w[j - 15], 7) ^
          rightRotate(w[j - 15], 18) ^
          (w[j - 15] >>> 3);
        const s1 =
          rightRotate(w[j - 2], 17) ^
          rightRotate(w[j - 2], 19) ^
          (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return Array.from(hash)
    .map((x) => x.toString(16).padStart(8, "0"))
    .join("");
}

export interface UserTimeInfo {
  localTime: string;
  timezone: string;
}

const HASH_SECRET =
  process.env.NEXT_PUBLIC_HASH_SECRET || process.env.HASH_SECRET;

/**
 * Generates the raw SHA-256 signature using a manual implementation.
 */
async function generateSignature(
  url: string,
  timestamp: number,
  userTimeInfo: UserTimeInfo
): Promise<string> {
  if (!HASH_SECRET) {
    throw new Error("HASH_SECRET is not defined");
  }

  const data = `${timestamp}:${url}:${HASH_SECRET}:${JSON.stringify(
    userTimeInfo
  )}`;

  return sha256_sync(data);
}

/**
 * Packs the request information into a single Base64 encoded hash string.
 */
export async function packRequestHash(
  url: string,
  userTimeInfo: UserTimeInfo
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await generateSignature(url, timestamp, userTimeInfo);

  const payload = {
    t: timestamp,
    u: userTimeInfo,
    s: signature,
  };

  const jsonString = JSON.stringify(payload);
  // Using btoa/Buffer for cross-platform Base64
  return typeof btoa !== "undefined"
    ? btoa(jsonString)
    : Buffer.from(jsonString).toString("base64");
}

/**
 * Unpacks and verifies the provided hash.
 */
export async function unpackAndVerifyHash(
  packedHash: string,
  url: string
): Promise<{
  isValid: boolean;
  timestamp?: number;
  userTimeInfo?: UserTimeInfo;
}> {
  try {
    const jsonString =
      typeof atob !== "undefined"
        ? atob(packedHash)
        : Buffer.from(packedHash, "base64").toString("utf8");

    const {
      t: timestamp,
      u: userTimeInfo,
      s: signature,
    } = JSON.parse(jsonString);

    if (typeof timestamp !== "number" || !userTimeInfo || !signature) {
      return { isValid: false };
    }

    const expectedSignature = await generateSignature(
      url,
      timestamp,
      userTimeInfo
    );

    if (expectedSignature !== signature) {
      return { isValid: false };
    }

    // Check if timestamp is within 60 seconds
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - timestamp);

    if (timeDifference > 60) {
      console.warn(
        `[Hash Verification] Timestamp expired. Diff: ${timeDifference}s`
      );
      return { isValid: false, timestamp, userTimeInfo };
    }

    return { isValid: true, timestamp, userTimeInfo };
  } catch (error) {
    console.error("[Hash Verification] Error:", error);
    return { isValid: false };
  }
}

// Deprecated functions kept for compatibility during migration if needed
export async function generateRequestHash(
  url: string,
  timestamp: number,
  userTimeInfo: UserTimeInfo
): Promise<string> {
  return generateSignature(url, timestamp, userTimeInfo);
}

export async function verifyRequestHash(
  hash: string,
  url: string,
  timestamp: number,
  userTimeInfo: UserTimeInfo
): Promise<boolean> {
  const payload = JSON.stringify({ t: timestamp, u: userTimeInfo, s: hash });
  const packedHash =
    typeof btoa !== "undefined"
      ? btoa(payload)
      : Buffer.from(payload).toString("base64");

  const { isValid } = await unpackAndVerifyHash(packedHash, url);
  return isValid;
}
