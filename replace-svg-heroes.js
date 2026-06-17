const fs = require("fs");
const path = require("path");

const SLUG_TO_GAME = {
  "building-neon-dodge": "neon-dodge",
  "zombie-survival-arena-design": "zombie-survival",
  "space-shooter-auto-fire": "space-shooter",
  "building-ninja-dash": "ninja-dash",
  "building-robot-arena": "robot-arena",
  "building-arrow-dodge": "arrow-dodge",
  "building-monster-punch": "monster-punch",
  "building-car-smash": "car-smash",
  "building-laser-escape": "laser-escape",
  "building-castle-defender": "castle-defender",
  "building-bomb-runner": "bomb-runner",
  "building-meteor-dodge": "meteor-dodge",
  "building-pop-blitz": "pop-blitz",
  "building-water-balloon-blitz": "water-balloon-blitz",
  "building-time-stop": "time-stop",
  "building-memory-grid": "memory-grid",
  "building-lane-rush": "lane-rush",
  "building-paint-race": "paint-race",
  "building-tap-sprint": "tap-sprint",
  "building-pendulum-hit": "pendulum-hit",
  "building-block-stacker": "block-stacker",
  "building-tile-link": "tile-link",
  "building-crate-shift": "crate-shift",
  "building-marble-gate": "marble-gate",
  "building-maze-escape": "maze-escape",
  "building-shelf-snap": "shelf-snap",
  "building-otter-pop": "otter-pop",
  "building-sudoku": "sudoku",
  "building-trap-scout": "trap-scout",
  "building-window-wash": "window-wash",
  "5-games-for-your-lunch-break": "neon-dodge",
};

for (const [slug, game] of Object.entries(SLUG_TO_GAME)) {
  const filePath = path.join(__dirname, "blog", slug, "index.html");
  if (!fs.existsSync(filePath)) {
    console.log(`  skip (not found): ${slug}`);
    continue;
  }

  let html = fs.readFileSync(filePath, "utf8");

  const svgStart = html.indexOf("<svg ");
  const svgEnd = html.indexOf("</svg>") + "</svg>".length;

  if (svgStart === -1) {
    console.log(`  skip (no svg): ${slug}`);
    continue;
  }

  const gameName = game.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const imgTag = `<img src="/assets/thumbs/${game}.png" alt="${gameName}" style="width:100%;border-radius:12px;margin:0 0 32px;display:block;object-fit:cover;height:200px;">`;

  html = html.slice(0, svgStart) + imgTag + html.slice(svgEnd);
  fs.writeFileSync(filePath, html, "utf8");
  console.log(`  ✓ ${slug}`);
}

console.log("\nDone.");
