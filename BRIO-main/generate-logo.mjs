import sharp from "sharp";
import { existsSync, copyFileSync } from "fs";

const W = 1854, H = 1653;
const cx = 927, cy = 826.5;
const r = 740;
const rx = r / 2;
const ry = r * Math.sin(Math.PI / 3);

const V = [
  [cx - rx, cy - ry],
  [cx + rx, cy - ry],
  [cx + r, cy],
  [cx + rx, cy + ry],
  [cx - rx, cy + ry],
  [cx - r, cy],
];
const hexPoints = V.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
const nodes = V.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="50" fill="#ffffff" opacity="0.96"/>`).join("\n      ");

// Bold geometric "B": a stem + two bowls, drawn as filled paths (font-independent)
const stemX = 690, stemW = 168;        // vertical stem
const top = 470, bot = 1183;           // letter top/bottom
const mid = (top + bot) / 2;
const bowlR1 = (mid - top) / 2 + 60;   // upper bowl radius-ish
// Build B via a stem rect + two right-facing bowls using cubic beziers
const B = `
  <path d="
    M ${stemX} ${top}
    L 1060 ${top}
    C 1300 ${top}, 1300 ${mid - 10}, 1060 ${mid - 10}
    L ${stemX + stemW} ${mid - 10}
    L ${stemX + stemW} ${mid + 10}
    L 1090 ${mid + 10}
    C 1340 ${mid + 10}, 1340 ${bot}, 1060 ${bot}
    L ${stemX} ${bot}
    Z
  " fill="#ffffff"/>
  <rect x="${stemX}" y="${top}" width="${stemW}" height="${bot - top}" rx="20" fill="#ffffff"/>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="${cx}" y1="${cy - ry}" x2="${cx}" y2="${cy + ry}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7A23C"/>
      <stop offset="0.5" stop-color="#EA3F94"/>
      <stop offset="1" stop-color="#7A2C95"/>
    </linearGradient>
  </defs>
  <g>
    <polygon points="${hexPoints}" fill="url(#g)"/>
    <polygon points="${hexPoints}" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="12" stroke-linejoin="round"/>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="1020" fill="#ffffff">B</text>
    ${nodes}
  </g>
</svg>`;

const out = "public/brio-logo.png";
const backup = "public/brio-logo-original.png";
if (existsSync(out) && !existsSync(backup)) {
  copyFileSync(out, backup);
  console.log("backed up original -> " + backup);
}
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("wrote " + out + " (Brio 'B')");
await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile("public/brio-icon-256.png");
console.log("wrote public/brio-icon-256.png");
