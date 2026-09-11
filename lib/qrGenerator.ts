/**
 * Pure client-side QR Code generator (Model 2, Byte mode, ECC Level M)
 * Zero external dependencies, runs seamlessly in any modern browser.
 */

// Galois Field GF(256) tables for Reed-Solomon error correction
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // generator polynomial for GF(256): x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function polyMul(p1: number[], p2: number[]): number[] {
  const res = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return res;
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    poly = polyMul(poly, [1, EXP_TABLE[i]]);
  }
  return poly;
}

function rsCalculateEcc(data: number[], eccLength: number): number[] {
  const gen = rsGeneratorPoly(eccLength);
  const res = new Array(eccLength).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) {
      for (let j = 0; j < eccLength; j++) {
        res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return res;
}

// Version table for ECC Level M
// [version, totalDataBytes, eccBytesPerBlock, numBlocks]
const VERSION_SPECS = [
  { version: 1, size: 21, dataCapacity: 14, eccPerBlock: 10, blocks: 1, align: [] },
  { version: 2, size: 25, dataCapacity: 26, eccPerBlock: 16, blocks: 1, align: [6, 18] },
  { version: 3, size: 29, dataCapacity: 42, eccPerBlock: 26, blocks: 1, align: [6, 22] },
  { version: 4, size: 33, dataCapacity: 62, eccPerBlock: 18, blocks: 2, align: [6, 26] },
  { version: 5, size: 37, dataCapacity: 84, eccPerBlock: 24, blocks: 2, align: [6, 30] },
  { version: 6, size: 41, dataCapacity: 106, eccPerBlock: 16, blocks: 4, align: [6, 34] },
  { version: 7, size: 45, dataCapacity: 122, eccPerBlock: 18, blocks: 4, align: [6, 22, 38] },
];

export interface QRCodeMatrix {
  size: number;
  modules: boolean[][];
}

export function generateQRCode(text: string): QRCodeMatrix {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Find smallest version that can accommodate data
  // Byte mode header: 4 bits mode + 8 bits count = 12 bits -> 1.5 bytes + dataLen
  const requiredDataBytes = dataLen + 2; // + mode & count + terminator
  const spec = VERSION_SPECS.find((s) => s.dataCapacity >= requiredDataBytes) || VERSION_SPECS[VERSION_SPECS.length - 1];

  // 1. Bit stream
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for versions 1-9 in byte mode)
  pushBits(dataLen, 8);
  // Data bytes
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8Bytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxDataBits = spec.dataCapacity * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes (0xEC, 0x11)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte array
  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    dataBytes.push(b);
  }

  // Error correction
  const blocksCount = spec.blocks;
  const bytesPerBlock = Math.floor(spec.dataCapacity / blocksCount);
  const eccPerBlock = spec.eccPerBlock;

  const dataBlocks: number[][] = [];
  const eccBlocks: number[][] = [];

  for (let b = 0; b < blocksCount; b++) {
    const blockData = dataBytes.slice(b * bytesPerBlock, (b + 1) * bytesPerBlock);
    dataBlocks.push(blockData);
    eccBlocks.push(rsCalculateEcc(blockData, eccPerBlock));
  }

  // Interleave data and ECC
  const finalSequence: number[] = [];
  for (let i = 0; i < bytesPerBlock; i++) {
    for (let b = 0; b < blocksCount; b++) {
      finalSequence.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < blocksCount; b++) {
      finalSequence.push(eccBlocks[b][i]);
    }
  }

  // 2. Grid & Function Patterns
  const size = spec.size;
  const modules: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  function setFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[nr][nc] = true;
        } else {
          modules[nr][nc] = false;
        }
      }
    }
  }

  // Finder patterns at top-left, top-right, bottom-left
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (modules[6][i] === null) modules[6][i] = i % 2 === 0;
    if (modules[i][6] === null) modules[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  if (spec.align.length > 0) {
    for (const r of spec.align) {
      for (const c of spec.align) {
        if (modules[r][c] !== null) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            modules[r + dr][c + dc] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // Dark module
  modules[size - 8][8] = true;

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (modules[8][i] === null) modules[8][i] = false;
    if (modules[i][8] === null) modules[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (modules[8][i] === null) modules[8][i] = false;
    if (modules[i][8] === null) modules[i][8] = false;
  }

  // 3. Place data bits (Mask pattern 0: (row + col) % 2 === 0)
  let bitIndex = 0;
  const finalBits: number[] = [];
  for (const byte of finalSequence) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((byte >> i) & 1);
    }
  }

  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column
    const colList = [rightCol, rightCol - 1];

    const rowStart = upward ? size - 1 : 0;
    const rowEnd = upward ? -1 : size;
    const rowStep = upward ? -1 : 1;

    for (let r = rowStart; r !== rowEnd; r += rowStep) {
      for (const c of colList) {
        if (modules[r][c] === null) {
          const bit = bitIndex < finalBits.length ? finalBits[bitIndex++] : 0;
          // Apply standard mask (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0;
          modules[r][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    upward = !upward;
  }

  // 4. Write Format Information (ECC M, Mask 0 = 0b00000 ^ 0b10101 = 0b10101)
  // Standard format string for (ECC M, mask 0) with BCH error code: 101010000010010
  const formatInfo = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> i) & 1) === 1;
    // Top-left
    if (i < 6) modules[8][i] = bit;
    else if (i === 6) modules[8][7] = bit;
    else if (i === 7) modules[8][8] = bit;
    else if (i === 8) modules[7][8] = bit;
    else modules[14 - i][8] = bit;

    // Bottom-left / Top-right
    if (i < 8) {
      modules[size - 1 - i][8] = bit;
    } else {
      modules[8][size - 15 + i] = bit;
    }
  }

  // Convert to pure boolean array
  const cleanModules: boolean[][] = modules.map((row) =>
    row.map((cell) => cell === true)
  );

  return {
    size,
    modules: cleanModules,
  };
}
