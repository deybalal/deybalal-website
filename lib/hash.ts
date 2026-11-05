export interface UserTimeInfo {
  localTime: string;
  timezone: string;
}

const HASH_SECRET =
  process.env.NEXT_PUBLIC_HASH_SECRET || process.env.HASH_SECRET;

/**
 * Generates the raw SHA-256 signature.
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

  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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
  // Using btoa/atob for browser/node compatibility or a cross-platform helper
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
  const { isValid } = await unpackAndVerifyHash(
    typeof btoa !== "undefined"
      ? btoa(JSON.stringify({ t: timestamp, u: userTimeInfo, s: hash }))
      : Buffer.from(
          JSON.stringify({ t: timestamp, u: userTimeInfo, s: hash })
        ).toString("base64"),
    url
  );
  return isValid;
}
