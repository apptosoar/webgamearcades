const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const GAMES = [
  "neon-dodge",
  "zombie-survival",
  "space-shooter",
  "ninja-dash",
  "robot-arena",
  "arrow-dodge",
  "monster-punch",
  "car-smash",
  "laser-escape",
  "castle-defender",
  "bomb-runner",
  "meteor-dodge",
  "pop-blitz",
  "water-balloon-blitz",
  "time-stop",
  "memory-grid",
  "lane-rush",
  "paint-race",
  "tap-sprint",
  "pendulum-hit",
  "block-stacker",
  "tile-link",
  "crate-shift",
  "marble-gate",
  "maze-escape",
  "shelf-snap",
  "otter-pop",
  "sudoku",
  "trap-scout",
  "window-wash",
];

const ROOT = path.join(__dirname);
const OUT = path.join(ROOT, "assets", "thumbs");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 720 });

  for (const game of GAMES) {
    const htmlPath = path.join(ROOT, "games", game, "index.html");
    if (!fs.existsSync(htmlPath)) {
      console.log(`  skip (not found): ${game}`);
      continue;
    }

    const url = `file:///${htmlPath.replace(/\\/g, "/")}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
      // wait for initial render / canvas draw
      await page.waitForTimeout(1200);

      const outFile = path.join(OUT, `${game}.png`);

      // Try .stage first (DOM-based games), fall back to canvas#game
      const hasStage = await page.locator(".stage").count() > 0;
      const hasCanvas = await page.locator("canvas#game").count() > 0;

      if (hasStage) {
        await page.locator(".stage").first().screenshot({ path: outFile });
      } else if (hasCanvas) {
        await page.locator("canvas#game").first().screenshot({ path: outFile });
      } else {
        // last resort: screenshot the body
        await page.screenshot({ path: outFile, clip: { x: 0, y: 0, width: 800, height: 500 } });
      }

      console.log(`  ✓ ${game} (${hasStage ? "stage" : hasCanvas ? "canvas" : "body"})`);
    } catch (e) {
      console.log(`  ✗ ${game}: ${e.message.split("\n")[0]}`);
    }
  }

  await browser.close();
  console.log("\nDone — saved to assets/thumbs/");
}

main().catch(console.error);
