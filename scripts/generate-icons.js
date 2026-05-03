// Run with: node scripts/generate-icons.js
// Requires: npm install --save-dev sharp
// Creates PNG icons from SVG source

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const sizes = [16, 48, 128];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background rounded rect
  const radius = size * 0.22;
  ctx.fillStyle = "#6366f1";
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Draw bookmark icon (simplified)
  const padding = size * 0.22;
  const w = size - padding * 2;
  const h = size - padding * 2;
  const x = padding;
  const y = padding;

  ctx.strokeStyle = "white";
  ctx.lineWidth = size * 0.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Bookmark shape
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y);
  ctx.lineTo(x + w * 0.85, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.12);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w * 0.5, y + h * 0.72);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h * 0.12);
  ctx.quadraticCurveTo(x, y, x + w * 0.15, y);
  ctx.closePath();
  ctx.stroke();

  const buffer = canvas.toBuffer("image/png");
  writeFileSync(join(outDir, `icon-${size}.png`), buffer);
  console.log(`✓ icon-${size}.png`);
}

console.log("Icons generated in public/icons/");
