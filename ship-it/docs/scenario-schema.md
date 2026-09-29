# Ship It: scenario schema

A scenario is one entry in `window.SHIPIT_SCENARIOS` in `scenarios.js`. Adding
one needs no code change. The pick screen deals from whatever is in the array.

## Units

- **Money**: dollars. `rate` and `overhead` are per week. `budget` is the total.
- **Work**: points. One average person (`speed: 10`) delivers 10 points in a
  normal week in their own trade, or 5 outside it.

## Shape

```js
{
  id: "eid-sale",                 // unique, kebab-case
  title: "Eid Flash Sale",
  kicker: "E-commerce launch",    // the project type, shown above the title
  difficulty: 3,                  // 1–5, display only; set it from the balance run
  summary: "…",                   // two sentences for the card and the charter
  goal: "…",                      // the definition of done, one sentence
  weeks: 8,                       // deadline
  budget: 60000,
  overhead: 800,                  // non-payroll weekly cost (rent, tools, ad spend…)
  morale: 75,                     // starting morale, optional (default 75)
  fixedDeadline: true,            // optional: disables the "Extend deadline" move

  team: [
    { name: "Tania", role: "design", rate: 1300, speed: 10 }   // speed defaults to 10
  ],
  workstreams: [
    { id: "ux", name: "Storefront design", role: "design", points: 45 }
  ],
  features: [                     // optional scope, cuttable at kickoff or later
    { id: "dark", name: "Dark mode", ws: "ux", points: 10, value: 3 }   // value = stakeholder cost to cut
  ],
  ctx: {                          // flavour for the generic events
    client: "The marketing director",
    vendor: "The payment gateway",
    bug: "Stock counts go negative when…",   // a full sentence
    shortcut: "an open-source cart module…"  // completes "found ___"
  },
  creep: [                        // what the scope-creep event can ask for
    { name: "bKash one-tap pay", ws: "checkout", points: 25, value: 8 }
  ],
  specials: [ /* events unique to this project, same shape as below */ ]
}
```

`role` is a free string. The rule is that a person's `role` must equal a
workstream's `role` to work at full speed on it. A workstream whose role nobody
has, like `qa` in the Indie Game, is a deliberate staffing gap.

## Events

```js
{
  id: "eid-competitor",           // unique across generic + special events
  title: "A rival announces the same dates",
  weight: 1,                      // relative draw chance
  body: "…",                      // may use the placeholders below
  choices: [
    { label: "Move the launch up", detail: "Beat them to it.", fx: { deadline: -1, sat: 10 } }
  ]
}
```

Placeholders in `title`, `body`, `label` and `detail`: `{member}` (a random
team member, chosen when the event is drawn), `{client}`, `{vendor}`, `{bug}`,
`{shortcut}`, `{creepName}`, `{creepWeeks}` and `{etaText}`.

Each event fires at most once per game.

### Effect grammar (`fx`)

| Key | Meaning |
|---|---|
| `burn: n` | Costs n × this week's burn. Using it keeps costs in scale across projects. |
| `morale`, `quality`, `sat: ±n` | Adjust the meter (clamped 0–100) |
| `satIfOnTime`, `satIfLate: ±n` | Stakeholder change that depends on the forecast |
| `work: { to, n }` | Adds n person-weeks (n × 10 points) of work |
| `save: { to, n }` | Completes n person-weeks of work |
| `weekMod: ±r` | Next week's output multiplier, e.g. −0.15 |
| `deadline: ±n` | Moves the deadline |
| `budgetPct: ±n` | Changes the budget by n% |
| `out: n` | The named `{member}` is away n weeks (still paid) |
| `raise: r` | Their rate × (1 + r) |
| `quit: true` | They leave for good |
| `replace: true` | They leave, and a new hire takes their seat (ramps up from zero) |
| `addCreep: true` | Accepts the drawn creep feature into scope |
| `cutSmallest: true` | Removes the smallest in-scope feature (for "trade it") |
| `spin: true` | Marks a rosy status report: −15 stakeholders at the end if late |

`to` is `"most"` (the stream with the most work left), `"role:<role>"`,
`"creep"` or `"member"` (the named person's current stream).

## Balancing a new scenario

1. Rough target: the total points should be about 90–95% of what the team can
   deliver at a sustainable pace with perfect allocation (`Σ speed × weeks`).
   Make at least one trade short of capacity, so allocation matters.
2. Budget ≈ `(payroll + overhead) × weeks × 1.05–1.08`. That is enough for the
   plan and not enough for a contractor plus a slip.
3. Run `node tools/balance.mjs <id>` and aim for these on-time rates with the
   **thoughtful** player:

   | Difficulty | Target on time |
   |---|---|
   | 2 | 45–60% |
   | 3 | 25–40% |
   | 4 | 20–35% |
   | 5 | 15–25% |

   The **crunch** player should always average a lower score than the
   thoughtful one.
4. Scale all of a scenario's workstream and feature points together to tune.
   Each 5% of scope moves the finish date by roughly half a week on an
   8-week project.
