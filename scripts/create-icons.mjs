/**
 * Generates PNG icon files for the Chrome extension.
 * Uses only Node.js built-ins — no extra dependencies.
 * Run: node scripts/create-icons.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// Minimal valid 1×1 transparent PNG as a starting point
// We'll write a proper PNG using raw binary

function createPNG(size, bgColor, fgColor) {
  // We encode a basic PNG: IHDR + IDAT + IEND
  // For simplicity we create a solid-colored square icon
  // Full PNG spec implementation
  
  const { r: br, g: bg, b: bb } = hexToRgb(bgColor);
  const { r: fr, g: fg, b: fb } = hexToRgb(fgColor);
  
  // Create raw RGBA pixel data
  const pixels = new Uint8Array(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const isInRoundedRect = isInRR(x, y, size, size, Math.round(size * 0.22));
      if (isInRoundedRect) {
        // Draw background
        pixels[idx] = br;
        pixels[idx + 1] = bg;
        pixels[idx + 2] = bb;
        pixels[idx + 3] = 255;
        
        // Draw bookmark icon
        const p = size * 0.18;
        const bx = p, by = p;
        const bw = size - p * 2, bh = size - p * 2;
        const lw = size * 0.1;
        
        if (isOnBookmark(x, y, bx, by, bw, bh, lw)) {
          pixels[idx] = fr;
          pixels[idx + 1] = fg;
          pixels[idx + 2] = fb;
          pixels[idx + 3] = 255;
        }
      } else {
        // Transparent
        pixels[idx + 3] = 0;
      }
    }
  }
  
  return encodePNG(size, size, pixels);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function isInRR(x, y, w, h, r) {
  if (x < r && y < r) return dist(x, y, r, r) <= r;
  if (x > w - r - 1 && y < r) return dist(x, y, w - r - 1, r) <= r;
  if (x < r && y > h - r - 1) return dist(x, y, r, h - r - 1) <= r;
  if (x > w - r - 1 && y > h - r - 1) return dist(x, y, w - r - 1, h - r - 1) <= r;
  return true;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function isOnBookmark(x, y, bx, by, bw, bh, lw) {
  // Bookmark: vertical lines on sides, top bar, V notch at bottom
  // Left edge
  const halfLw = lw / 2;
  
  // Left side (excluding bottom triangle area)
  if (x >= bx - halfLw && x <= bx + halfLw && y >= by && y <= by + bh * 0.85) return true;
  // Right side (excluding bottom triangle area)
  if (x >= bx + bw - halfLw && x <= bx + bw + halfLw && y >= by && y <= by + bh * 0.85) return true;
  // Top bar
  if (y >= by - halfLw && y <= by + halfLw && x >= bx - halfLw && x <= bx + bw + halfLw) return true;
  
  // Bottom V shape
  const midX = bx + bw / 2;
  const vStart = by + bh * 0.62;
  const vEnd = by + bh;
  
  if (y >= vStart && y <= vEnd) {
    const progress = (y - vStart) / (vEnd - vStart);
    const leftEdge = bx + progress * (midX - bx);
    const rightEdge = bx + bw - progress * (bx + bw - midX);
    
    if ((x >= leftEdge - halfLw && x <= leftEdge + halfLw) ||
        (x >= rightEdge - halfLw && x <= rightEdge + halfLw)) {
      return true;
    }
    // Fill bottom horizontal cap
    if (y >= vEnd - halfLw) {
      if (x >= bx - halfLw && x <= bx + bw + halfLw) return true;
    }
    if (y <= vStart + halfLw) {
      if (x >= bx - halfLw && x <= bx + bw + halfLw) return true;
    }
  }
  
  return false;
}

// PNG encoder (pure JS)
function encodePNG(width, height, pixels) {
  const chunks = [];
  
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  chunks.push(makeChunk("IHDR", ihdr));
  
  // IDAT - compress with zlib
  // Build raw image data (filter byte 0 = None before each row)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(0); // filter type: None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawRows.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  
  const rawData = Buffer.from(rawRows);
  const compressed = zlibDeflate(rawData);
  chunks.push(makeChunk("IDAT", compressed));
  
  // IEND
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));
  
  return Buffer.concat([sig, ...chunks]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBytes = Buffer.from(type, "ascii");
  const crc = crc32(Buffer.concat([typeBytes, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

// Simple zlib deflate using Node's zlib
import { deflateSync } from "zlib";
function zlibDeflate(data) {
  return deflateSync(data);
}

// CRC32
function crc32(buf) {
  const table = makeCRCTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let _crcTable = null;
function makeCRCTable() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    _crcTable[n] = c;
  }
  return _crcTable;
}

// Generate icons
const sizes = [16, 48, 128];
for (const size of sizes) {
  const png = createPNG(size, "#6366f1", "#ffffff");
  const outPath = join(outDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ Generated icon-${size}.png (${png.length} bytes)`);
}

console.log("\nIcons written to public/icons/");
