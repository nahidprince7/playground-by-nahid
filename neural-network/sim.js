/* ------------------------------------------------------------------
 * sim.js — the fish brain and the world it lives in.
 *
 * Pure logic, no DOM. index.html draws it; tools/tune.mjs runs it
 * headless to prove every input node earns its keep.
 *
 * The brain is a real net: inputs -> 10 tanh hidden -> 2 tanh outputs
 * (steer x, steer y). The weights are hand-wired rather than trained,
 * but the forward pass is genuine and it is the only thing steering a
 * fish. Nothing about the fish's behaviour is scripted around it.
 *
 * A sensor the user has not switched on has no input node. The network
 * still needs a number in that slot, so it gets the sensor's `prior` —
 * a worst-case guess. That is what makes a missing node cost something:
 * a fish with no `prox` sensor assumes the predator is forever on top
 * of it, so it panics non-stop and slams into the glass.
 * ------------------------------------------------------------------ */
(function (root) {
  'use strict';

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const hypot = Math.hypot;
  const tanh = Math.tanh;

  /* ---------------------------- sensors --------------------------- */

  const SENSORS = [
    {
      id: 'pdx', label: 'Predator X', short: 'pred·x', group: 'threat',
      bn: 'বড় মাছ ডানে না বামে',
      desc: 'Which way is away from the predator, left/right.',
      prior: 0,
    },
    {
      id: 'pdy', label: 'Predator Y', short: 'pred·y', group: 'threat',
      bn: 'বড় মাছ উপরে না নিচে',
      desc: 'Which way is away from the predator, up/down.',
      prior: 0,
    },
    {
      id: 'prox', label: 'Proximity', short: 'near', group: 'threat',
      bn: 'কত কাছে চলে এসেছে',
      desc: '1 when the predator is touching me, 0 at the edge of my vision.',
      prior: 1, // blind guess: "it is always right on top of me"
    },
    {
      id: 'appr', label: 'Approaching', short: 'chase', group: 'threat',
      bn: 'আমার দিকেই আসছে, নাকি চলে যাচ্ছে',
      desc: '+1 when it is swimming straight at me, -1 when it is leaving.',
      prior: 1, // blind guess: "it is always coming for me"
    },
    {
      id: 'wlx', label: 'Wall X', short: 'wall·x', group: 'world',
      bn: 'পাশের কাচ কত কাছে',
      desc: 'Push off the left and right glass before I get cornered.',
      prior: 0,
    },
    {
      id: 'wly', label: 'Wall Y', short: 'wall·y', group: 'world',
      bn: 'উপর-নিচের কাচ কত কাছে',
      desc: 'Push off the top and bottom glass before I get cornered.',
      prior: 0,
    },
    {
      id: 'ddx', label: 'Dodge X', short: 'dodge·x', group: 'skill',
      bn: 'ধেয়ে আসার লাইন থেকে পাশে সরা',
      desc: 'Sidestep out of the charge line instead of being chased down.',
      prior: 0,
    },
    {
      id: 'ddy', label: 'Dodge Y', short: 'dodge·y', group: 'skill',
      bn: 'ধেয়ে আসার লাইন থেকে পাশে সরা',
      desc: 'Sidestep out of the charge line instead of being chased down.',
      prior: 0,
    },
  ];

  /* ---------------------------- weights ---------------------------
   * The flee and dodge units are AND-gates. A single tanh unit can act
   * as one: give it a bias steep enough that no input alone can push it
   * positive. So "flee right" only fires when the predator is on my left
   * AND it is close AND it is actually chasing me. Take the `prox` node
   * away and its prior of 1 holds the gate half-open forever — which is
   * exactly the panic we want to show.
   *
   * Each signed direction gets a mirrored pair (right/left, down/up) so
   * the output layer can subtract them. That keeps the gate working on a
   * signed value, which one unit cannot do on its own.
   * ---------------------------------------------------------------- */

  const F_DIR = 6.0, F_PROX = 5.0, F_APPR = 1.2, F_BIAS = -8.75;
  const D_DIR = 5.0, D_PROX = 4.5, D_APPR = 1.5, D_BIAS = -9.35;

  const HIDDEN = [
    { id: 'fleeR', label: 'flee →', b: F_BIAS, w: { pdx:  F_DIR, prox: F_PROX, appr: F_APPR } },
    { id: 'fleeL', label: 'flee ←', b: F_BIAS, w: { pdx: -F_DIR, prox: F_PROX, appr: F_APPR } },
    { id: 'fleeD', label: 'flee ↓', b: F_BIAS, w: { pdy:  F_DIR, prox: F_PROX, appr: F_APPR } },
    { id: 'fleeU', label: 'flee ↑', b: F_BIAS, w: { pdy: -F_DIR, prox: F_PROX, appr: F_APPR } },

    { id: 'dodgeR', label: 'dodge →', b: D_BIAS, w: { ddx:  D_DIR, prox: D_PROX, appr: D_APPR } },
    { id: 'dodgeL', label: 'dodge ←', b: D_BIAS, w: { ddx: -D_DIR, prox: D_PROX, appr: D_APPR } },
    { id: 'dodgeD', label: 'dodge ↓', b: D_BIAS, w: { ddy:  D_DIR, prox: D_PROX, appr: D_APPR } },
    { id: 'dodgeU', label: 'dodge ↑', b: D_BIAS, w: { ddy: -D_DIR, prox: D_PROX, appr: D_APPR } },

    { id: 'wallX', label: 'off wall x', b: 0, w: { wlx: 3.2 } },
    { id: 'wallY', label: 'off wall y', b: 0, w: { wly: 3.2 } },
  ];

  // The wall units outweigh the flee units on purpose. A panicking fish will
  // otherwise swim straight into the glass and hold itself there while the
  // predator sweeps the perimeter. Letting the wall win at point-blank range
  // turns "pinned" into "sliding along the glass", which is survivable.
  const OUTPUTS = [
    { id: 'sx', label: 'Steer X', b: 0,
      w: { fleeR: 1.9, fleeL: -1.9, dodgeR: 1.8, dodgeL: -1.8, wallX: 4.6 } },
    { id: 'sy', label: 'Steer Y', b: 0,
      w: { fleeD: 1.9, fleeU: -1.9, dodgeD: 1.8, dodgeU: -1.8, wallY: 4.6 } },
  ];

  /**
   * One honest forward pass.
   * @param raw    every sensor's measured value
   * @param active {sensorId: bool} — which input nodes exist right now
   * @returns {inputs, hidden, outputs} — kept so the diagram upstairs can
   *          light up the exact activations that moved this fish.
   */
  function forward(raw, active) {
    const inputs = {};
    for (const s of SENSORS) inputs[s.id] = active[s.id] ? raw[s.id] : s.prior;

    const hidden = {};
    for (const h of HIDDEN) {
      let sum = h.b;
      for (const k in h.w) sum += h.w[k] * inputs[k];
      hidden[h.id] = tanh(sum);
    }

    const outputs = {};
    for (const o of OUTPUTS) {
      let sum = o.b;
      for (const k in o.w) sum += o.w[k] * hidden[k];
      outputs[o.id] = tanh(sum);
    }
    return { inputs, hidden, outputs };
  }

  /* ---------------------------- sensing --------------------------- */

  function sense(f, w) {
    const p = w.predator;

    const rx = f.x - p.x;
    const ry = f.y - p.y;
    const d = hypot(rx, ry) || 1e-6;
    const ux = rx / d; // points away from the predator
    const uy = ry / d;

    const prox = clamp(1 - d / w.vision, 0, 1);

    const pv = hypot(p.vx, p.vy) || 1e-6;
    const hx = p.vx / pv;
    const hy = p.vy / pv;
    const appr = hx * -ux + hy * -uy; // +1 = charging straight at me

    // Sidestep: perpendicular to the charge, on whichever side I already
    // stand. Fleeing straight ahead of a chaser only delays it; stepping
    // out of its line makes it overshoot and swing round.
    let px = -hy, py = hx;
    if (px * ux + py * uy < 0) { px = -px; py = -py; }

    // Quadratic ramp: near-silent across most of the band, then it bites hard
    // right at the glass. A linear one just herds everyone into the middle,
    // which is the one place the predator actually patrols.
    const m = w.wallBand;
    const ramp = (t) => { const c = clamp(t, 0, 1); return c * c; };
    const wlx = ramp((m - f.x) / m) - ramp((f.x - (w.width - m)) / m);
    const wly = ramp((m - f.y) / m) - ramp((f.y - (w.height - m)) / m);

    return { pdx: ux, pdy: uy, prox, appr, wlx, wly, ddx: px, ddy: py };
  }

  /* ----------------------------- world ---------------------------- */

  const DEFAULTS = {
    width: 1000,
    height: 520,
    count: 30,
    vision: 120,     // how far a fish can see the predator
    wallBand: 60,    // how early the wall sensor starts pushing
    thrust: 640,     // px/s^2 the brain is allowed to command
    wander: 95,      // idle drift, so even a dead brain still swims
    maxSpeed: 190,   // fish are faster than the predator — if they use it
    predSpeed: 160,
    predTurn: 1.25, // rad/s. The low turn rate is what makes it sweep round in arcs.
    predR: 24,
    fishR: 6,
    respawnDelay: 1.2,
  };

  function makeFish(w, rnd) {
    return {
      x: rnd() * w.width,
      y: rnd() * w.height,
      vx: (rnd() - 0.5) * 40,
      vy: (rnd() - 0.5) * 40,
      angle: rnd() * Math.PI * 2,
      alive: true,
      respawn: 0,
      seed: rnd() * 100,
      wander: rnd() * 10,
      hue: 165 + rnd() * 65,
      wig: rnd() * 6,
      panic: 0,
      net: null,
      raw: null,
    };
  }

  function respawnFish(f, w, rnd) {
    const p = w.predator;
    let x = 0, y = 0;
    for (let tries = 0; tries < 14; tries++) {
      const side = (rnd() * 4) | 0;
      const t = rnd();
      if (side === 0) { x = 10; y = t * w.height; }
      else if (side === 1) { x = w.width - 10; y = t * w.height; }
      else if (side === 2) { x = t * w.width; y = 10; }
      else { x = t * w.width; y = w.height - 10; }
      if (hypot(x - p.x, y - p.y) > w.vision) break;
    }
    f.x = x; f.y = y;
    f.vx = (rnd() - 0.5) * 30;
    f.vy = (rnd() - 0.5) * 30;
    f.alive = true;
    f.panic = 0;
  }

  function createWorld(opts) {
    const w = Object.assign({}, DEFAULTS, opts || {});
    w.rnd = w.rnd || Math.random;
    w.time = 0;
    w.eaten = 0;
    w.events = []; // {x, y, hue} — the renderer drains these for the bursts
    w.active = w.active || {};
    for (const s of SENSORS) if (!(s.id in w.active)) w.active[s.id] = false;

    w.predator = {
      x: w.width * 0.5, y: w.height * 0.5,
      vx: w.predSpeed, vy: 0,
      angle: 0, wig: 0,
    };

    w.fish = [];
    for (let i = 0; i < w.count; i++) w.fish.push(makeFish(w, w.rnd));
    return w;
  }

  function setCount(w, n) {
    while (w.fish.length < n) {
      const f = makeFish(w, w.rnd);
      respawnFish(f, w, w.rnd);
      w.fish.push(f);
    }
    while (w.fish.length > n) w.fish.pop();
    w.count = n;
  }

  function resize(w, width, height) {
    const kx = width / w.width;
    const ky = height / w.height;
    w.width = width;
    w.height = height;
    // Keep the predator sized to the tank. It used to be a fixed 24px, which
    // looked huge and swam past the walls on small / mobile canvases.
    w.predR = clamp(Math.min(width, height) * 0.05, 13, 24);
    for (const f of w.fish) { f.x *= kx; f.y *= ky; }
    w.predator.x *= kx;
    w.predator.y *= ky;
  }

  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  /* ------------------------------ step ---------------------------- */

  function step(w, dt) {
    dt = Math.min(dt, 1 / 30); // a stalled tab must not teleport the predator
    w.time += dt;
    const rnd = w.rnd;
    const p = w.predator;

    /* -- predator: lock on to the nearest fish, but it can only turn so
       -- fast, and that is what makes it sweep round in wide arcs. */
    let target = null;
    let best = Infinity;
    for (let i = 0; i < w.fish.length; i++) {
      const f = w.fish[i];
      if (!f.alive) continue;
      const dd = (f.x - p.x) ** 2 + (f.y - p.y) ** 2;
      if (dd < best) { best = dd; target = f; }
    }

    let desired = p.angle;
    if (target) desired = Math.atan2(target.y - p.y, target.x - p.x);

    // Only a gentle nudge off the glass. It must still be willing to pin a
    // fish against the wall, otherwise the wall sensor would be worthless.
    const m = 44;
    let ax = 0, ay = 0;
    if (p.x < m) ax += 1; else if (p.x > w.width - m) ax -= 1;
    if (p.y < m) ay += 1; else if (p.y > w.height - m) ay -= 1;
    if (ax || ay) {
      const away = Math.atan2(ay, ax);
      const k = 0.3;
      desired = Math.atan2(
        (1 - k) * Math.sin(desired) + k * Math.sin(away),
        (1 - k) * Math.cos(desired) + k * Math.cos(away)
      );
    }

    p.angle += clamp(angDiff(desired, p.angle), -w.predTurn * dt, w.predTurn * dt);
    p.vx = Math.cos(p.angle) * w.predSpeed;
    p.vy = Math.sin(p.angle) * w.predSpeed;
    // Clamp by the predator's own radius so its body stays inside the glass
    // (a fixed 6px margin let most of the fish poke through on small tanks).
    const pm = w.predR * 1.6;
    p.x = clamp(p.x + p.vx * dt, pm, w.width - pm);
    p.y = clamp(p.y + p.vy * dt, pm, w.height - pm);
    p.wig += dt * (6 + w.predSpeed * 0.03);

    /* ---------------------------- fish ---------------------------- */
    const bite = w.predR + w.fishR;

    for (let i = 0; i < w.fish.length; i++) {
      const f = w.fish[i];

      if (!f.alive) {
        f.respawn -= dt;
        if (f.respawn <= 0) respawnFish(f, w, rnd);
        continue;
      }

      const raw = sense(f, w);
      const net = forward(raw, w.active);
      f.raw = raw;
      f.net = net;

      const sx = net.outputs.sx;
      const sy = net.outputs.sy;
      f.panic = clamp(hypot(sx, sy), 0, 1);

      f.wander += dt;
      const wx = Math.cos(f.wander * 0.9 + f.seed) * w.wander;
      const wy = Math.sin(f.wander * 1.3 + f.seed * 2.1) * w.wander;

      f.vx += (sx * w.thrust + wx) * dt;
      f.vy += (sy * w.thrust + wy) * dt;

      const drag = Math.pow(0.12, dt);
      f.vx *= drag;
      f.vy *= drag;

      const sp = hypot(f.vx, f.vy);
      const cap = w.maxSpeed * (1 + 0.2 * f.panic); // adrenaline
      if (sp > cap) { f.vx = (f.vx / sp) * cap; f.vy = (f.vy / sp) * cap; }

      f.x += f.vx * dt;
      f.y += f.vy * dt;

      // The glass. A fish with no wall sensor still bounces off it — it just
      // keeps swimming back into it, which is how the predator corners it.
      if (f.x < w.fishR) { f.x = w.fishR; f.vx = Math.abs(f.vx) * 0.35; }
      if (f.x > w.width - w.fishR) { f.x = w.width - w.fishR; f.vx = -Math.abs(f.vx) * 0.35; }
      if (f.y < w.fishR) { f.y = w.fishR; f.vy = Math.abs(f.vy) * 0.35; }
      if (f.y > w.height - w.fishR) { f.y = w.height - w.fishR; f.vy = -Math.abs(f.vy) * 0.35; }

      if (sp > 6) f.angle = Math.atan2(f.vy, f.vx);
      f.wig += dt * (5 + sp * 0.06);

      if (hypot(f.x - p.x, f.y - p.y) < bite) {
        f.alive = false;
        f.respawn = w.respawnDelay;
        w.eaten++;
        w.events.push({ x: f.x, y: f.y, hue: f.hue });
      }
    }
  }

  /* ---------------------------- exports --------------------------- */

  const api = {
    SENSORS, HIDDEN, OUTPUTS, DEFAULTS,
    forward, sense, createWorld, step, setCount, resize, clamp,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Sim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
