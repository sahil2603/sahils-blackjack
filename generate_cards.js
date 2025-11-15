// generate_cards.js
// Node script — generates back.svg + 52 card front SVGs (Arial-ish style)
// Usage: node generate_cards.js

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "assets", "cards");

// ensure directory exists
fs.mkdirSync(outDir, { recursive: true });

/* -----------------------
   Create back.svg (blue SAHIL back)
   ----------------------- */
const backSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="420" rx="22" fill="#1E75FF"/>
  <rect x="10" y="10" width="280" height="400" rx="18" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="4"/>
  <text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#FFFFFF"
    text-anchor="middle" dominant-baseline="middle">SAHIL</text>
</svg>
`;

fs.writeFileSync(path.join(outDir, "back.svg"), backSvg, "utf8");
console.log("wrote: back.svg");

/* -----------------------
   Card fronts generator
   ----------------------- */
const suits = [
  { code: "S", sym: "♠", color: "#0b0b0b" }, // spade black
  { code: "H", sym: "♥", color: "#E63946" }, // heart red
  { code: "D", sym: "♦", color: "#E63946" }, // diamond red
  { code: "C", sym: "♣", color: "#0b0b0b" }  // club black
];

const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function mkFrontSVG(rank, suitSym, suitColor) {
  // simple front: white card with rounded corners, small rank at top-left,
  // large suit in center, mirrored rank bottom-right
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="420" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" xml:lang="en">
  <rect width="300" height="420" rx="22" fill="#ffffff"/>
  <rect x="8" y="8" width="284" height="404" rx="18" fill="none" stroke="#e6e6e6" stroke-width="2"/>

  <!-- top-left rank -->
  <text x="28" y="46" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="${suitColor}">
    ${rank}
  </text>

  <!-- top-left small suit below rank -->
  <text x="28" y="84" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${suitColor}">
    ${suitSym}
  </text>

  <!-- big center suit -->
  <text x="50%" y="52%" font-family="Arial, Helvetica, sans-serif" font-size="140" font-weight="700" fill="${suitColor}"
    text-anchor="middle" dominant-baseline="middle">${suitSym}</text>

  <!-- mirrored bottom-right rank (rotated) -->
  <g transform="translate(300,420) rotate(180)">
    <text x="28" y="46" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="${suitColor}">
      ${rank}
    </text>
    <text x="28" y="84" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="${suitColor}">
      ${suitSym}
    </text>
  </g>
</svg>
`;
}

// write all 52
for (const s of suits) {
  for (const r of ranks) {
    const filename = `${r}${s.code}.svg`; // e.g. AS.svg, 10D.svg
    const svg = mkFrontSVG(r, s.sym, s.color);
    fs.writeFileSync(path.join(outDir, filename), svg, "utf8");
    console.log("wrote:", filename);
  }
}

console.log("All card SVGs generated in:", outDir);
