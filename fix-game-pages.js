const fs = require("fs");
const path = require("path");

const GAMES_DIR = path.join(__dirname, "games");
const TOPBAR_CSS = `
<style>
body { display: flex !important; flex-direction: column !important; align-items: center !important; place-items: unset !important; }
.site-topbar { position: sticky; top: 0; z-index: 10; width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; min-height: 54px; padding: 10px clamp(14px, 4vw, 36px); border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(14,15,18,0.92); backdrop-filter: blur(18px); box-sizing: border-box; flex-shrink: 0; }
.site-brand { display: flex; align-items: center; gap: 9px; color: #f4f2ea; text-decoration: none; font-weight: 800; font-size: 0.95rem; }
.site-brand-mark { display: grid; width: 30px; height: 30px; flex-shrink: 0; place-items: center; border-radius: 7px; background: linear-gradient(135deg, #f7b84b, #f05d5e); color: #15110a; font-weight: 900; font-size: 0.85rem; }
.site-nav { display: flex; gap: 2px; }
.site-nav a { padding: 7px 10px; border-radius: 7px; color: #b8bec9; text-decoration: none; font-size: 0.88rem; transition: color 0.15s; }
.site-nav a:hover { color: #f4f2ea; }
@media (max-width: 600px) { .site-nav { display: none; } }
.wrap { height: min(calc(100svh - 54px), 720px) !important; }
</style>`;

const TOPBAR_HTML = `<header class="site-topbar">
  <a class="site-brand" href="/"><span class="site-brand-mark">G</span><span>Webgame Arcades</span></a>
  <nav class="site-nav">
    <a href="/">Games</a>
    <a href="/blog.html">Blog</a>
    <a href="/community.html">Community</a>
    <a href="/about.html">About</a>
  </nav>
</header>`;

const games = fs.readdirSync(GAMES_DIR).filter(d =>
  fs.statSync(path.join(GAMES_DIR, d)).isDirectory() && d !== "sample-clicker"
);

for (const game of games) {
  const filePath = path.join(GAMES_DIR, game, "index.html");
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, "utf8");

  // 1. Add topbar CSS before </head>
  if (!html.includes("site-topbar")) {
    html = html.replace("</head>", TOPBAR_CSS + "\n</head>");
  }

  // 2. Add topbar HTML after <body ...>
  if (!html.includes("site-topbar")) {
    html = html.replace(/(<body[^>]*>)/, `$1\n${TOPBAR_HTML}`);
  } else {
    html = html.replace(/(<body[^>]*>)/, `$1\n${TOPBAR_HTML}`);
  }

  // 3. Remove Korean <section class="game-info" lang="ko"> ... </section>
  const koStart = html.indexOf('<section class="game-info" lang="ko">');
  if (koStart !== -1) {
    // Find the matching </section>
    let depth = 0;
    let i = koStart;
    while (i < html.length) {
      if (html.slice(i, i + 8) === "<section") depth++;
      if (html.slice(i, i + 10) === "</section>") {
        depth--;
        if (depth === 0) {
          const koEnd = i + 10;
          html = html.slice(0, koStart) + html.slice(koEnd);
          break;
        }
      }
      i++;
    }
  }

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`  ✓ ${game}`);
}

console.log("\nDone.");
