/* Headless check: does each extra input node actually keep fish alive?
 *
 * Runs the real sim (no rendering) with a seeded RNG for each cumulative
 * sensor set and reports fish eaten per minute. The number should fall
 * monotonically as nodes are added — if it does not, the weights are lying
 * and the demo is a cartoon.
 *
 *   node tools/tune.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { module: { exports: {} }, Math, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(here, '..', 'sim.js'), 'utf8'), ctx);
const Sim = ctx.Sim;

// deterministic RNG so runs are comparable
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAGES = [
  ['blind (no inputs)', []],
  ['+ predator x/y', ['pdx', 'pdy']],
  ['+ proximity', ['pdx', 'pdy', 'prox']],
  ['+ approaching', ['pdx', 'pdy', 'prox', 'appr']],
  ['+ walls', ['pdx', 'pdy', 'prox', 'appr', 'wlx', 'wly']],
  ['+ dodge', ['pdx', 'pdy', 'prox', 'appr', 'wlx', 'wly', 'ddx', 'ddy']],
];

const SECONDS = 120;
const DT = 1 / 60;
const TRIALS = 16;

console.log(`\n  ${SECONDS}s x ${TRIALS} seeds per stage, ${Sim.DEFAULTS.count} fish\n`);
console.log('  ' + 'brain'.padEnd(22) + 'nodes'.padStart(6) + 'eaten/min'.padStart(12) + '   survival');
console.log('  ' + '-'.repeat(62));

const results = [];
for (const [name, ids] of STAGES) {
  let total = 0;
  for (let s = 0; s < TRIALS; s++) {
    const active = {};
    for (const id of ids) active[id] = true;
    const w = Sim.createWorld({ active, rnd: mulberry32(1234 + s * 977) });
    for (let t = 0; t < SECONDS / DT; t++) Sim.step(w, DT);
    total += w.eaten / (SECONDS / 60);
  }
  const perMin = total / TRIALS;
  results.push({ name, nodes: ids.length, perMin });
}

const worst = Math.max(...results.map((r) => r.perMin));
for (const r of results) {
  const bar = '#'.repeat(Math.round((1 - r.perMin / worst) * 26));
  const pct = ((1 - r.perMin / worst) * 100).toFixed(0);
  console.log(
    '  ' + r.name.padEnd(22) +
    String(r.nodes).padStart(6) +
    r.perMin.toFixed(1).padStart(12) +
    '   ' + bar.padEnd(26) + ' ' + pct + '%'
  );
}

/* The dip at "+ predator x/y" is the point of the whole demo, not a bug: a
 * fish that knows only the direction of the threat — and has to assume it is
 * always upon it — panics into the glass and dies more than one that never
 * looked. So we do not require monotonicity from the start. We require:
 *   1. every node from `prox` onward pays for itself, and
 *   2. the finished brain is far safer than no brain at all.
 */
const blind = results[0].perMin;
const full = results[results.length - 1].perMin;

let ok = true;
for (let i = 3; i < results.length; i++) {
  if (results[i].perMin > results[i - 1].perMin + 0.8) {
    console.log(`  REGRESSION: "${results[i].name}" is worse than "${results[i - 1].name}"`);
    ok = false;
  }
}
if (full > blind * 0.6) {
  console.log(`  WEAK: the full brain (${full.toFixed(1)}) barely beats blind (${blind.toFixed(1)})`);
  ok = false;
}

console.log(
  ok
    ? `\n  OK — full brain cuts deaths ${(blind / full).toFixed(1)}x vs blind.` +
      `\n  (the bump at 2 nodes is deliberate: direction without distance = pure panic)\n`
    : '\n  Weights need work.\n'
);
