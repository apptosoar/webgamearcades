(() => {
  const config = window.ACTION_GAME_CONFIG;
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.querySelector("#score");
  const healthEl = document.querySelector("#health");
  const restart = document.querySelector("#restart");
  const titleEl = document.querySelector("#title");
  const action = document.querySelector("#action");

  const state = {
    w: 0,
    h: 0,
    t: 0,
    score: 0,
    health: config.health || 3,
    over: false,
    keys: new Set(),
    player: { x: 0, y: 0, r: 16, vx: 0, vy: 0, lane: 1 },
    items: [],
    shots: [],
    effects: [],
    cooldown: 0,
    spawn: 0,
    second: 0,
    touch: { active: false, x: 0, y: 0 },
  };

  const palette = {
    bg: "#0b0c0f",
    panel: "#151820",
    text: "#f4f2ea",
    muted: "#b8bec9",
    amber: "#f7b84b",
    teal: "#2bd1c4",
    red: "#f05d5e",
    violet: "#a98bff",
    green: "#73d676",
  };

  titleEl.textContent = config.title;
  restart.textContent = config.restartLabel || "Restart";
  restart.addEventListener("click", () => location.reload());
  action?.addEventListener("click", () => {
    if (config.type === "click") punchNearest();
    if (config.type === "shooter" || config.type === "defender") fire();
    if (config.type === "runner") jump();
  });

  addEventListener("keydown", (event) => {
    state.keys.add(event.key);
    if (event.key === " " || event.key === "ArrowUp") {
      if (config.type === "runner") jump();
      if (config.type === "shooter" || config.type === "defender") fire();
    }
  });
  addEventListener("keyup", (event) => state.keys.delete(event.key));
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture?.(event.pointerId);
    const p = pointer(event);
    state.touch.active = true;
    state.touch.x = p.x;
    state.touch.y = p.y;
    if (config.type === "click") punchAt(p.x, p.y);
    if (config.type === "defender") fireToward(p.x, p.y);
    if (config.type === "shooter") fire();
    if (config.type === "runner") jump();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.touch.active) return;
    const p = pointer(event);
    state.touch.x = p.x;
    state.touch.y = p.y;
  });
  canvas.addEventListener("pointerup", stopTouch);
  canvas.addEventListener("pointercancel", stopTouch);

  function resize() {
    const box = canvas.getBoundingClientRect();
    const ratio = devicePixelRatio || 1;
    state.w = Math.max(320, box.width);
    state.h = Math.max(320, box.height);
    canvas.width = Math.floor(state.w * ratio);
    canvas.height = Math.floor(state.h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!state.t) resetPlayer();
  }

  function resetPlayer() {
    state.player.x = state.w * 0.5;
    state.player.y = config.type === "runner" ? state.h - 64 : state.h * 0.72;
    if (config.type === "arena") state.player.y = state.h * 0.5;
    if (config.type === "dodge") state.player.y = state.h * 0.72;
  }

  function loop() {
    step();
    draw();
    requestAnimationFrame(loop);
  }

  function step() {
    if (state.over) return;
    state.t += 1;
    state.cooldown = Math.max(0, state.cooldown - 1);
    state.spawn -= 1;
    state.second += 1;
    if (state.second >= 60) {
      state.second = 0;
      state.score += config.passiveScore || 1;
    }

    movePlayer();
    if (state.spawn <= 0) spawnItem();
    updateShots();
    updateItems();
    updateEffects();
    scoreEl.textContent = state.score;
    healthEl.textContent = state.health;
  }

  function movePlayer() {
    const p = state.player;
    const speed = config.speed || 5;
    if (config.type === "runner") {
      p.vy += 0.8;
      p.y += p.vy;
      if (p.y > state.h - 64) {
        p.y = state.h - 64;
        p.vy = 0;
      }
      if (state.keys.has("ArrowLeft")) p.x -= speed;
      if (state.keys.has("ArrowRight")) p.x += speed;
      if (state.touch.active) p.x += clamp(state.touch.x - p.x, -speed * 1.8, speed * 1.8);
      p.x = clamp(p.x, 40, state.w - 40);
      return;
    }

    if (state.keys.has("ArrowLeft") || state.keys.has("a")) p.x -= speed;
    if (state.keys.has("ArrowRight") || state.keys.has("d")) p.x += speed;
    if (state.keys.has("ArrowUp") || state.keys.has("w")) p.y -= speed;
    if (state.keys.has("ArrowDown") || state.keys.has("s")) p.y += speed;
    if (state.touch.active && config.type !== "defender" && config.type !== "click") {
      p.x += clamp(state.touch.x - p.x, -speed * 1.8, speed * 1.8);
      p.y += clamp(state.touch.y - p.y, -speed * 1.8, speed * 1.8);
    }
    p.x = clamp(p.x, 24, state.w - 24);
    p.y = clamp(p.y, 42, state.h - 36);
  }

  function stopTouch(event) {
    canvas.releasePointerCapture?.(event.pointerId);
    state.touch.active = false;
  }

  function jump() {
    if (state.player.y >= state.h - 65) state.player.vy = -14;
  }

  function fire() {
    if (state.cooldown > 0) return;
    state.cooldown = config.fireRate || 14;
    state.shots.push({ x: state.player.x, y: state.player.y - 18, vx: 0, vy: -10, r: 5 });
  }

  function fireToward(x, y) {
    if (state.cooldown > 0) return;
    state.cooldown = config.fireRate || 12;
    const start = { x: 38, y: state.h * 0.5 };
    const angle = Math.atan2(y - start.y, x - start.x);
    state.shots.push({ x: start.x, y: start.y, vx: Math.cos(angle) * 9, vy: Math.sin(angle) * 9, r: 5 });
  }

  function punchNearest() {
    const nearest = state.items
      .filter((item) => item.kind === "enemy")
      .sort((a, b) => distance(a, state.player) - distance(b, state.player))[0];
    if (nearest) punchAt(nearest.x, nearest.y);
  }

  function punchAt(x, y) {
    const hit = state.items.find((item) => item.kind === "enemy" && distance(item, { x, y }) < item.r + 28);
    pulse(x, y, palette.amber);
    if (hit) {
      hit.dead = true;
      state.score += config.hitScore || 5;
      pulse(hit.x, hit.y, palette.red);
    }
  }

  function spawnItem() {
    const rate = Math.max(18, (config.spawnRate || 64) - Math.floor(state.score / 30));
    state.spawn = rate;
    if (config.type === "shooter") {
      state.items.push({ kind: "enemy", x: rand(24, state.w - 24), y: -24, vx: rand(-0.8, 0.8), vy: rand(1.8, 3.8), r: 18 });
      return;
    }
    if (config.type === "defender") {
      state.items.push({ kind: "enemy", x: state.w + 24, y: rand(54, state.h - 42), vx: -rand(1.4, 3.2), vy: 0, r: 18 });
      return;
    }
    if (config.type === "runner") {
      state.items.push({ kind: "hazard", x: state.w + 24, y: state.h - 54, vx: -rand(4, 7), vy: 0, r: rand(15, 24) });
      return;
    }
    if (config.type === "arena") {
      const edge = Math.floor(Math.random() * 4);
      const point = [
        { x: -24, y: rand(40, state.h - 40) },
        { x: state.w + 24, y: rand(40, state.h - 40) },
        { x: rand(24, state.w - 24), y: -24 },
        { x: rand(24, state.w - 24), y: state.h + 24 },
      ][edge];
      state.items.push({ kind: "enemy", ...point, vx: 0, vy: 0, r: 18 });
      return;
    }
    if (config.type === "click") {
      state.items.push({ kind: "enemy", x: rand(40, state.w - 40), y: rand(72, state.h - 64), vx: rand(-1.2, 1.2), vy: rand(-1.2, 1.2), r: 22, life: 110 });
      return;
    }
    if (config.pattern === "laser") {
      const vertical = Math.random() > 0.5;
      state.items.push({ kind: "laser", x: vertical ? rand(60, state.w - 60) : -80, y: vertical ? -80 : rand(80, state.h - 80), vx: vertical ? 0 : rand(2.4, 4.2), vy: vertical ? rand(2.4, 4.2) : 0, r: 18, vertical });
      return;
    }
    const fromTop = config.pattern !== "arrows";
    state.items.push({ kind: "hazard", x: fromTop ? rand(28, state.w - 28) : state.w + 28, y: fromTop ? -28 : rand(54, state.h - 54), vx: fromTop ? rand(-0.8, 0.8) : -rand(3.2, 5.4), vy: fromTop ? rand(2.4, 5.2) : 0, r: rand(13, 24) });
  }

  function updateShots() {
    state.shots.forEach((shot) => {
      shot.x += shot.vx;
      shot.y += shot.vy;
      state.items.forEach((item) => {
        if (!item.dead && item.kind === "enemy" && distance(shot, item) < shot.r + item.r) {
          item.dead = true;
          shot.dead = true;
          state.score += config.hitScore || 5;
          pulse(item.x, item.y, palette.teal);
        }
      });
    });
    state.shots = state.shots.filter((shot) => !shot.dead && shot.x > -30 && shot.x < state.w + 30 && shot.y > -40 && shot.y < state.h + 40);
  }

  function updateItems() {
    state.items.forEach((item) => {
      if (config.type === "arena" && item.kind === "enemy") {
        const angle = Math.atan2(state.player.y - item.y, state.player.x - item.x);
        item.vx = Math.cos(angle) * (config.enemySpeed || 1.7);
        item.vy = Math.sin(angle) * (config.enemySpeed || 1.7);
      }
      item.x += item.vx;
      item.y += item.vy;
      item.life = item.life == null ? item.life : item.life - 1;

      if (item.kind === "laser") {
        const hit = item.vertical
          ? Math.abs(state.player.x - item.x) < 16 && Math.abs(state.player.y - item.y) < 90
          : Math.abs(state.player.y - item.y) < 16 && Math.abs(state.player.x - item.x) < 90;
        if (hit) hurt(item);
      } else if (distance(item, state.player) < item.r + state.player.r) {
        hurt(item);
      }

      if (config.type === "defender" && item.x < 34) {
        hurt(item);
      }
    });
    state.items = state.items.filter((item) => !item.dead && item.life !== 0 && item.x > -120 && item.x < state.w + 140 && item.y > -140 && item.y < state.h + 140);
  }

  function updateEffects() {
    state.effects.forEach((effect) => (effect.life -= 1));
    state.effects = state.effects.filter((effect) => effect.life > 0);
  }

  function hurt(item) {
    if (item.dead) return;
    item.dead = true;
    state.health -= 1;
    pulse(item.x, item.y, palette.red);
    if (state.health <= 0) state.over = true;
  }

  function draw() {
    ctx.clearRect(0, 0, state.w, state.h);
    drawBackground();
    if (config.type === "defender") drawCastle();
    state.items.forEach(drawItem);
    state.shots.forEach(drawShot);
    drawPlayer();
    state.effects.forEach(drawEffect);
    if (state.over) drawGameOver();
  }

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, state.w, state.h);
    grd.addColorStop(0, config.bgA || "#151820");
    grd.addColorStop(1, config.bgB || "#22262e");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, state.w, state.h);
    drawScene(sceneName());
    drawGridOverlay();
  }

  function sceneName() {
    const title = (config.title || "").toLowerCase();
    if (title.includes("space")) return "space";
    if (title.includes("meteor")) return "meteor";
    if (title.includes("zombie")) return "graveyard";
    if (title.includes("ninja")) return "dojo";
    if (title.includes("robot")) return "factory";
    if (title.includes("arrow")) return "range";
    if (title.includes("monster")) return "cave";
    if (title.includes("laser")) return "lab";
    if (title.includes("castle")) return "castle";
    if (title.includes("bomb")) return "bomb";
    return config.pattern || config.type;
  }

  function drawScene(scene) {
    if (scene === "space" || scene === "meteor") drawSpaceScene(scene === "meteor");
    else if (scene === "graveyard") drawGraveyardScene();
    else if (scene === "dojo") drawDojoScene();
    else if (scene === "factory") drawFactoryScene();
    else if (scene === "range") drawRangeScene();
    else if (scene === "cave") drawCaveScene();
    else if (scene === "lab") drawLabScene();
    else if (scene === "castle") drawCastleScene();
    else if (scene === "bomb") drawBombScene();
  }

  function drawGridOverlay() {
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    for (let x = (state.t % 40) - 40; x < state.w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 80, state.h);
      ctx.stroke();
    }
  }

  function drawSpaceScene(withRocks) {
    ctx.fillStyle = "rgba(255,255,255,.72)";
    for (let i = 0; i < 46; i += 1) {
      const x = (i * 83 + state.t * (0.25 + (i % 4) * 0.08)) % state.w;
      const y = (i * 47 + state.t * (0.45 + (i % 5) * 0.06)) % state.h;
      circle(x, y, i % 7 === 0 ? 2.1 : 1.1);
    }
    ctx.fillStyle = "rgba(43,209,196,.12)";
    circle(state.w * 0.78, state.h * 0.18, Math.min(state.w, state.h) * 0.18);
    if (!withRocks) return;
    ctx.fillStyle = "rgba(247,184,75,.18)";
    for (let i = 0; i < 8; i += 1) {
      const x = (i * 137 - state.t * 0.8) % (state.w + 120);
      const y = (i * 61 + state.t * 0.5) % state.h;
      path([x, y - 12, x + 18, y - 4, x + 12, y + 16, x - 14, y + 9, x - 20, y - 6]);
    }
  }

  function drawGraveyardScene() {
    drawGround("#142016");
    ctx.fillStyle = "rgba(244,242,234,.12)";
    for (let x = 36; x < state.w; x += 92) {
      roundRect(x, state.h - 96 - ((x / 92) % 2) * 12, 26, 48, 10);
      ctx.fillRect(x - 7, state.h - 58, 40, 10);
    }
    ctx.fillStyle = "rgba(115,214,118,.16)";
    circle(state.w * 0.82, state.h * 0.18, 48);
  }

  function drawDojoScene() {
    drawGround("#1c1812");
    ctx.fillStyle = "rgba(247,184,75,.1)";
    for (let x = -40; x < state.w; x += 86) {
      ctx.fillRect(x, 72, 26, state.h - 128);
    }
    ctx.strokeStyle = "rgba(240,93,94,.22)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, state.h * 0.34);
    ctx.lineTo(state.w, state.h * 0.28);
    ctx.stroke();
  }

  function drawFactoryScene() {
    drawGround("#171a20");
    ctx.fillStyle = "rgba(169,139,255,.14)";
    for (let x = 28; x < state.w; x += 104) {
      roundRect(x, state.h - 178, 54, 118, 5);
      ctx.fillRect(x + 18, state.h - 224, 18, 46);
    }
    ctx.strokeStyle = "rgba(43,209,196,.18)";
    ctx.lineWidth = 2;
    for (let y = 70; y < state.h - 70; y += 54) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.w, y + Math.sin((state.t + y) * 0.015) * 18);
      ctx.stroke();
    }
  }

  function drawRangeScene() {
    drawGround("#24181a");
    ctx.strokeStyle = "rgba(247,184,75,.18)";
    ctx.lineWidth = 3;
    for (let y = 70; y < state.h - 50; y += 70) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.w, y - 30);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(240,93,94,.12)";
    for (let x = state.w - 80; x > 0; x -= 150) {
      circle(x, state.h * 0.5, 34);
      ctx.fillStyle = "rgba(244,242,234,.12)";
      circle(x, state.h * 0.5, 18);
      ctx.fillStyle = "rgba(240,93,94,.12)";
    }
  }

  function drawCaveScene() {
    drawGround("#1f1420");
    ctx.fillStyle = "rgba(0,0,0,.18)";
    for (let x = 0; x < state.w; x += 74) {
      path([x, 0, x + 28, 0, x + 16, 56 + (x % 4) * 12]);
      path([x + 18, state.h, x + 54, state.h, x + 38, state.h - 68 - (x % 5) * 9]);
    }
    ctx.fillStyle = "rgba(240,93,94,.14)";
    circle(state.w * 0.2, state.h * 0.24, 42);
  }

  function drawLabScene() {
    drawGround("#071c22");
    ctx.strokeStyle = "rgba(43,209,196,.18)";
    ctx.lineWidth = 2;
    for (let x = 40; x < state.w; x += 82) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + Math.sin((state.t + x) * 0.02) * 24, state.h - 58);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(115,214,118,.1)";
    for (let x = 68; x < state.w; x += 160) roundRect(x, 78, 54, 90, 10);
  }

  function drawCastleScene() {
    drawGround("#1c2117");
    ctx.fillStyle = "rgba(244,242,234,.1)";
    for (let x = 74; x < state.w; x += 118) {
      roundRect(x, state.h - 170, 62, 110, 8);
      ctx.fillRect(x - 8, state.h - 186, 16, 22);
      ctx.fillRect(x + 23, state.h - 190, 16, 26);
      ctx.fillRect(x + 52, state.h - 186, 16, 22);
    }
    ctx.fillStyle = "rgba(247,184,75,.12)";
    circle(state.w * 0.72, state.h * 0.18, 44);
  }

  function drawBombScene() {
    drawGround("#261b10");
    ctx.fillStyle = "rgba(247,184,75,.13)";
    for (let x = 24; x < state.w; x += 86) {
      ctx.fillRect(x - ((state.t * 2) % 86), state.h - 82, 42, 10);
      ctx.fillRect(x + 22 - ((state.t * 2) % 86), state.h - 62, 42, 10);
    }
    ctx.fillStyle = "rgba(240,93,94,.16)";
    for (let x = 80; x < state.w; x += 180) circle(x, state.h - 92, 18);
  }

  function drawGround(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, state.h - 58, state.w, 58);
    ctx.fillStyle = "rgba(255,255,255,.05)";
    ctx.fillRect(0, state.h - 60, state.w, 2);
  }

  function drawPlayer() {
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = config.playerColor || palette.teal;
    if (config.playerShape === "ship") {
      path([0, -22, 16, 18, 0, 10, -16, 18]);
    } else if (config.playerShape === "ninja") {
      ctx.fillRect(-14, -22, 28, 34);
      ctx.fillStyle = palette.text;
      ctx.fillRect(-10, -14, 20, 5);
    } else if (config.playerShape === "car") {
      roundRect(-16, -24, 32, 48, 7);
    } else {
      circle(0, 0, p.r);
    }
    ctx.restore();
  }

  function drawItem(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === "laser") {
      ctx.fillStyle = palette.red;
      if (item.vertical) roundRect(-8, -88, 16, 176, 8);
      else roundRect(-88, -8, 176, 16, 8);
      ctx.restore();
      return;
    }
    ctx.fillStyle = item.kind === "enemy" ? config.enemyColor || palette.red : config.hazardColor || palette.amber;
    if (config.enemyShape === "zombie") {
      circle(0, 0, item.r);
      ctx.fillStyle = palette.green;
      ctx.fillRect(-12, -4, 24, 8);
    } else if (config.enemyShape === "robot") {
      roundRect(-item.r, -item.r, item.r * 2, item.r * 2, 5);
      ctx.fillStyle = palette.text;
      ctx.fillRect(-8, -4, 16, 5);
    } else if (config.enemyShape === "meteor") {
      path([0, -item.r, item.r, -4, item.r * 0.5, item.r, -item.r * 0.8, item.r * 0.6, -item.r, -item.r * 0.4]);
    } else if (config.enemyShape === "arrow") {
      const direction = item.vx < 0 ? -1 : 1;
      ctx.scale(direction, 1);
      path([item.r, 0, -item.r, -8, -item.r * 0.4, 0, -item.r, 8]);
    } else if (config.enemyShape === "bomb") {
      circle(0, 0, item.r);
      ctx.fillStyle = palette.red;
      ctx.fillRect(-3, -item.r - 8, 6, 10);
    } else {
      circle(0, 0, item.r);
    }
    ctx.restore();
  }

  function drawShot(shot) {
    ctx.fillStyle = palette.teal;
    circle(shot.x, shot.y, shot.r);
  }

  function drawCastle() {
    ctx.fillStyle = "rgba(244,242,234,.12)";
    roundRect(10, state.h * 0.5 - 64, 48, 128, 8);
    ctx.fillStyle = palette.amber;
    ctx.fillRect(20, state.h * 0.5 - 80, 10, 18);
    ctx.fillRect(38, state.h * 0.5 - 80, 10, 18);
  }

  function drawEffect(effect) {
    ctx.globalAlpha = effect.life / 18;
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, effect.r + (18 - effect.life) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,.62)";
    ctx.fillRect(0, 0, state.w, state.h);
    ctx.fillStyle = palette.text;
    ctx.textAlign = "center";
    ctx.font = "800 34px system-ui";
    ctx.fillText(config.gameOverLabel || "Game Over", state.w / 2, state.h / 2 - 8);
    ctx.font = "700 18px system-ui";
    ctx.fillText(`${config.scoreLabel || "Score"} ${state.score}`, state.w / 2, state.h / 2 + 28);
  }

  function pulse(x, y, color) {
    state.effects.push({ x, y, r: 12, color, life: 18 });
  }

  function pointer(event) {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function path(points) {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();
    ctx.fill();
  }

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  resize();
  addEventListener("resize", resize);
  loop();
})();
