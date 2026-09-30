// Headless balance check for Ship It.
//
//   node tools/balance.mjs            # every scenario, 400 seeded runs per strategy
//   node tools/balance.mjs eid-sale   # one scenario
//
// Plays each scenario with three scripted players and prints how they finish.
// A scenario is well-balanced when the passive player usually slips, the
// thoughtful player usually ships on time, and nobody wins by crunching forever.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const ctx = { window: {}, console };
ctx.globalThis = ctx.window;
vm.createContext(ctx);
for (const f of ["../scenarios.js", "../engine.js"]) vm.runInContext(readFileSync(join(here, f), "utf8"), ctx);
const { ShipIt, SHIPIT_SCENARIOS } = ctx.window;

const RUNS = 400;
const only = process.argv[2];

// Everyone to their own trade; anyone whose stream is finished goes to the biggest pile
// they can help with — a real PM would at least do this.
function rebalance(s) {
  ShipIt.autoAssign(s);
  return { ...s.assign };
}

const strategies = {
  // Never touches a lever. Takes the first option on every event.
  passive(s) {
    return { plan: { assign: rebalance(s), pace: "steady", move: { type: "none" } }, choice: () => 0 };
  },
  // Watches the forecast: pushes when late and the team can take it, rests when it can't,
  // descopes once early if the forecast is bad, demos now and then.
  thoughtful(s) {
    const f = ShipIt.forecast(s);
    const late = f.eta > s.deadline;
    let pace = "steady";
    if (late && s.morale > 55) pace = "push";
    let move = { type: "none" };
    const opts = ShipIt.moveOptions(s);
    if (s.week === 1) {
      const cuts = s.features.filter(x => x.status === "in").sort((a, b) => a.value / a.points - b.value / b.points);
      if (f.eta > s.deadline && cuts[0]) move = { type: "cut", feature: cuts[0].id };
    } else if (late && f.eta > s.deadline + 1 && opts.cut.ok && s.week < s.deadline * 0.5) {
      const cuts = opts.cut.features.slice().sort((a, b) => a.value / a.points - b.value / b.points);
      move = { type: "cut", feature: cuts[0].id };
    } else if (s.morale < 45) move = { type: "teambuild" };
    else if (s.sat < 50) move = { type: "demo" };
    else if (s.quality < 60) move = { type: "quality" };
    return {
      plan: { assign: rebalance(s), pace, move },
      choice: ev => {
        // Prefer the option that does not add work if we're late, else the first.
        const i = ev.choices.findIndex(c => c.ok !== false && late && !(c.fx.work || c.fx.addCreep || c.fx.spin));
        return i >= 0 ? i : 0;
      }
    };
  },
  // Crunches every week. Should look tempting on the burndown and bad on the scorecard.
  crunch(s) {
    return { plan: { assign: rebalance(s), pace: "crunch", move: { type: "none" } }, choice: () => 0 };
  }
};

function play(sc, strat, seed) {
  const s = ShipIt.createGame(sc, { seed });
  ShipIt.kickoff(s);
  let guard = 0;
  while (!s.over && guard++ < 60) {
    const { plan, choice } = strategies[strat](s);
    ShipIt.runWeek(s, plan);
    if (s.pending) ShipIt.resolve(s, choice(s.pending));
  }
  return s;
}

const pad = (v, n) => String(v).padStart(n);
for (const sc of SHIPIT_SCENARIOS) {
  if (only && sc.id !== only) continue;
  console.log(`\n${sc.title}  (${sc.weeks} wk, $${sc.budget.toLocaleString()}, difficulty ${sc.difficulty})`);
  console.log("  strategy     avgWeek  onTime  avgBudget%  avgScore   S   A   B   C   F   reasons");
  for (const strat of Object.keys(strategies)) {
    let wk = 0, onTime = 0, bud = 0, total = 0;
    const g = { S: 0, A: 0, B: 0, C: 0, F: 0 }, reasons = {};
    for (let i = 0; i < RUNS; i++) {
      const s = play(sc, strat, 1000 + i);
      const r = s.score;
      wk += r.used; bud += r.spent / s.budget * 100; total += r.total;
      if (r.late === 0 && s.over.reason === "shipped") onTime++;
      g[r.grade]++;
      reasons[s.over.reason] = (reasons[s.over.reason] || 0) + 1;
    }
    const rs = Object.entries(reasons).map(([k, v]) => `${k}:${v}`).join(" ");
    console.log(`  ${strat.padEnd(11)} ${pad((wk / RUNS).toFixed(1), 8)} ${pad(Math.round(onTime / RUNS * 100) + "%", 7)} ${pad((bud / RUNS).toFixed(0) + "%", 11)} ${pad((total / RUNS).toFixed(0), 9)} ${pad(g.S, 4)}${pad(g.A, 4)}${pad(g.B, 4)}${pad(g.C, 4)}${pad(g.F, 4)}   ${rs}`);
  }
}
