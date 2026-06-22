/* site-chrome.js — shared header + footer for all non-SPA pages */
(function () {
  function init() {
  if (document.getElementById("sc-header")) return;

  /* ── CSS ──────────────────────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = [
    "#sc-header{position:sticky;top:0;z-index:100;align-self:stretch;display:grid;grid-template-columns:1fr auto;align-items:center;gap:18px;min-height:68px;padding:12px clamp(16px,4vw,44px);border-bottom:1px solid rgba(255,255,255,0.12);background:rgba(16,17,20,0.84);backdrop-filter:blur(18px);box-sizing:border-box}",
    ".sc-brand{display:flex;align-items:center;gap:10px;min-width:0;color:#f4f2ea;text-decoration:none;font-weight:800}",
    ".sc-brand-mark{display:grid;width:34px;height:34px;flex-shrink:0;place-items:center;border-radius:8px;background:linear-gradient(135deg,#f7b84b,#f05d5e);color:#15110a;font-weight:900;box-shadow:0 8px 20px rgba(247,184,75,0.22)}",
    ".sc-nav{display:flex;gap:4px}",
    ".sc-nav a{padding:9px 12px;border-radius:8px;color:#b8bec9;text-decoration:none;font-size:.92rem;font-weight:500;transition:transform 160ms ease,color 150ms ease}",
    ".sc-nav a:hover{color:#f4f2ea;transform:translateY(-1px)}",
    ".sc-nav a.sc-active{color:#f7b84b;font-weight:600}",
    "@media(max-width:900px){.sc-nav{display:none}}",
    "#sc-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;width:min(1440px,calc(100% - 32px));margin:0 auto;padding:24px 0 36px;border-top:1px solid rgba(255,255,255,0.12);color:#b8bec9;font-size:.88rem}",
    ".sc-footer-brand{display:flex;flex-direction:column;gap:4px}",
    ".sc-footer-brand strong{color:#f4f2ea;font-weight:800;font-size:.95rem;display:block}",
    ".sc-footer-brand span{display:block}",
    ".sc-footer-nav{display:flex;flex-wrap:wrap;align-items:center}",
    ".sc-footer-nav a{color:#b8bec9;text-decoration:none;padding:4px 14px;transition:color .15s}",
    ".sc-footer-nav a:hover{color:#f4f2ea}",
    ".sc-footer-nav a+a{border-left:1px solid rgba(255,255,255,0.12)}",
    /* sticky footer for non-game pages */
    "body:not(.game-wrap-adjust){display:flex;flex-direction:column;min-height:100dvh}",
    "body:not(.game-wrap-adjust) #sc-footer{margin-top:auto}",
    /* game pages: fit within viewport accounting for header + footer */
    ".game-wrap-adjust .wrap{height:min(calc(100dvh - 68px - var(--sc-footer-h,108px)),720px)!important}",
    ".game-wrap-adjust .game{height:calc(100dvh - 68px - var(--sc-footer-h,108px))!important}",
  ].join("");
  document.head.appendChild(style);

  /* ── Active nav detection ─────────────────────────────────────────────── */
  const p = location.pathname;
  function active(href) {
    if (href === "/" && (p === "/" || p.startsWith("/games/"))) return true;
    if (href !== "/" && p.startsWith(href.replace(".html", ""))) return true;
    return false;
  }
  const NAV = [
    { label: "Games",     href: "/" },
    { label: "Blog",      href: "/blog.html" },
    { label: "Community", href: "/community.html" },
    { label: "About",     href: "/about.html" },
  ];

  /* ── Header ───────────────────────────────────────────────────────────── */
  const header = document.createElement("header");
  header.id = "sc-header";
  header.innerHTML =
    '<a class="sc-brand" href="/">' +
      '<span class="sc-brand-mark">G</span>' +
      '<span>Webgame Arcades</span>' +
    "</a>" +
    '<nav class="sc-nav">' +
    NAV.map(n =>
      '<a href="' + n.href + '"' + (active(n.href) ? ' class="sc-active"' : "") + ">" + n.label + "</a>"
    ).join("") +
    "</nav>";

  /* Remove any old header the page injected, then prepend ours */
  document.querySelectorAll("header").forEach(h => h.remove());
  document.body.insertBefore(header, document.body.firstChild);

  /* ── Footer ───────────────────────────────────────────────────────────── */
  const footer = document.createElement("footer");
  footer.id = "sc-footer";
  footer.innerHTML =
    '<div class="sc-footer-brand">' +
      "<strong>Webgame Arcades</strong>" +
      "<span>A collection of web games that run directly in your browser</span>" +
    "</div>" +
    '<nav class="sc-footer-nav" aria-label="Footer menu">' +
      '<a href="/about.html">About</a>' +
      '<a href="/privacy.html">Privacy Policy</a>' +
      '<a href="/terms.html">Terms</a>' +
      '<a href="/faq.html">FAQ</a>' +
      '<a href="/contact.html">Contact</a>' +
    "</nav>";

  /* Remove any old footer, then append ours */
  document.querySelectorAll("footer").forEach(f => f.remove());
  document.body.appendChild(footer);

  /* ── Sync footer height as CSS variable so game areas can subtract it ── */
  function syncFooterH() {
    document.documentElement.style.setProperty('--sc-footer-h', footer.offsetHeight + 'px');
  }
  requestAnimationFrame(syncFooterH);
  window.addEventListener('resize', syncFooterH);

  /* ── Game play page: fix .wrap height for 68px topbar ────────────────── */
  if (/^\/games\/[^/]+\/$/.test(p) || /^\/games\/[^/]+\/index\.html$/.test(p)) {
    document.body.classList.add("game-wrap-adjust");
  }
  } // end init

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
