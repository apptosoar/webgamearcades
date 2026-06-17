const fs = require("fs");
const path = require("path");

const GAMES_DIR = path.join(__dirname, "games");

// CSS to inject into <head>
const TOPBAR_CSS = `<style>
.site-topbar { width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; min-height: 54px; padding: 0 clamp(14px, 4vw, 36px); border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(14,15,18,0.95); box-sizing: border-box; flex-shrink: 0; position: sticky; top: 0; z-index: 10; }
.site-brand { display: flex; align-items: center; gap: 9px; color: #f4f2ea; text-decoration: none; font-weight: 800; font-size: 0.95rem; }
.site-brand-mark { display: grid; width: 30px; height: 30px; flex-shrink: 0; place-items: center; border-radius: 7px; background: linear-gradient(135deg, #f7b84b, #f05d5e); color: #15110a; font-weight: 900; font-size: 0.82rem; }
.game-actions { display: flex; align-items: center; gap: 6px; }
.game-actions a { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.13); background: rgba(255,255,255,0.06); color: #b8bec9; text-decoration: none; font-size: 0.82rem; font-weight: 600; transition: background 0.15s, color 0.15s; white-space: nowrap; }
.game-actions a:hover { background: rgba(255,255,255,0.12); color: #f4f2ea; }
.wrap { height: min(calc(100svh - 54px), 720px) !important; }
</style>`;

// Topbar HTML — info link is a scroll anchor to #game-info section
const TOPBAR_HTML = `<header class="site-topbar">
  <a class="site-brand" href="/"><span class="site-brand-mark">G</span><span>Webgame Arcades</span></a>
  <div class="game-actions">
    <a href="#game-info">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      About
    </a>
    <a href="/">← All Games</a>
  </div>
</header>`;

const games = fs.readdirSync(GAMES_DIR).filter(d =>
  fs.statSync(path.join(GAMES_DIR, d)).isDirectory() && d !== "sample-clicker"
);

for (const game of games) {
  const filePath = path.join(GAMES_DIR, game, "index.html");
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, "utf8");

  // 1. Remove the previous messy <style> block added by fix-game-pages.js
  //    It starts with \nbody { display: flex !important and ends with </style>
  html = html.replace(/\n<style>\nbody \{ display: flex !important[\s\S]*?<\/style>/g, "");

  // 2. Remove previously added <header class="site-topbar"> ... </header>
  html = html.replace(/<header class="site-topbar">[\s\S]*?<\/header>\n?/g, "");

  // 3. Add clean topbar CSS before </head>
  html = html.replace("</head>", TOPBAR_CSS + "\n</head>");

  // 4. Add topbar HTML right after <body ...>
  html = html.replace(/(<body[^>]*>)/, `$1\n${TOPBAR_HTML}`);

  // 5. Add id="game-info" to the English game-info section (not lang="ko")
  html = html.replace(
    /<section class="game-info"(?! lang=)>/,
    '<section class="game-info" id="game-info">'
  );

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`  ✓ ${game}`);
}

console.log("\nDone.");
