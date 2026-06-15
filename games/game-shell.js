addEventListener("load", () => requestAnimationFrame(() => focus()));

function installTouchControls(options) {
  const opts = options || {};
  const stage = document.querySelector("#stage") || document.querySelector(".stage");
  const wrap = document.querySelector(".wrap");
  let startX = 0, startY = 0, tracking = false;
  if (stage) {
    stage.addEventListener("pointerdown", e => { tracking = true; startX = e.clientX; startY = e.clientY; stage.setPointerCapture?.(e.pointerId) });
    stage.addEventListener("pointerup", e => {
      if (!tracking) return; tracking = false; stage.releasePointerCapture?.(e.pointerId);
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.hypot(dx, dy) < 18) { opts.tap?.(e); return }
      opts.move?.(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp"));
    });
    stage.addEventListener("pointercancel", () => { tracking = false });
  }
  if (!wrap || !opts.move) return;
  const pad = document.createElement("div");
  pad.className = "touch-controls";
  pad.setAttribute("aria-label", "Touch controls");
  [["up","ArrowUp","^"],["left","ArrowLeft","<"],["down","ArrowDown","v"],["right","ArrowRight",">"]].forEach(([cls, key, label]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label;
    b.addEventListener("pointerdown", e => { e.preventDefault(); opts.move(key) });
    pad.appendChild(b);
  });
  if (opts.action) {
    const b = document.createElement("button"); b.type = "button"; b.className = "action";
    b.textContent = opts.actionLabel || "Action";
    b.addEventListener("pointerdown", e => { e.preventDefault(); opts.action() });
    pad.appendChild(b);
  }
  const last = wrap.lastElementChild;
  wrap.insertBefore(pad, last);
}
