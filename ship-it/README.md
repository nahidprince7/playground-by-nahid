# Ship It

A project management simulation. Five projects are dealt at random from a pool
of ten. Pick one, then run it week by week until it ships or gets cancelled.

Every project has its own budget, deadline, team and work. Each week you decide
who works on what, how hard the team pushes, and which single management move
to make. Then the week runs, and something usually goes wrong. The forecast bar
shows where you are heading. The verdict scores you on the iron triangle
(schedule, budget, scope) plus quality and stakeholders.

## The projects

| Project | Type | Weeks | Budget | Difficulty |
|---|---|---|---|---|
| Startup MVP | Zero to launch | 6 | $25k | ●●○○○ |
| Office Relocation | Operations | 6 | $38k | ●●○○○ |
| University Admission Campaign | Marketing | 7 | $37k | ●●○○○ |
| Eid Flash Sale | E-commerce launch | 8 | $60k | ●●●○○ |
| Dhaka Wedding Expo | Event management | 8 | $44k | ●●●○○ |
| Cloud Migration | Infrastructure | 9 | $76k | ●●●○○ |
| Indie Game Launch | Game development | 10 | $68k | ●●●○○ |
| Hospital Records Migration | Data migration | 10 | $78k | ●●●●○ |
| Mobile Banking App v1 | Fintech product | 12 | $132k | ●●●●○ |
| Government Tax Portal | Public sector | 14 | $175k | ●●●●● |

## What you control

- **Kickoff scope.** Cut optional features before work starts. It costs half
  as much stakeholder goodwill as cutting them later.
- **Allocation.** People work at full speed in their own trade and half speed
  outside it. Effort put on a finished workstream is wasted.
- **Pace.** Sustainable, Push (+20%) or Crunch (+45%). Push and crunch drain
  morale and quality, and some of a tired team's output has to be redone.
- **One move a week.** Hire or release a contractor, run a team day out, give a
  stakeholder demo, run a quality sprint, cut a feature, extend the deadline
  (once, and not on fixed-date projects) or ask for more budget (once).
- **Events.** These include scope creep, sickness, resignations, vendor price
  rises, surprise bugs and status meetings. Every choice has a cost.

## Run it

Everything is static:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/ship-it/`. You can also open `index.html`
directly from disk.

## Files

- `index.html`: every screen and all of the styling.
- `scenarios.js`: the ten projects, as data.
- `engine.js`: the simulation rules. Pure logic with no DOM, so node can run it.
- `game.js`: rendering and input. It reads the engine's state and never
  changes a number itself.
- `tools/balance.mjs`: plays every scenario 400 times with three scripted
  players and prints how they finish.
- `docs/`: design notes, the scenario schema and the decision log.

There is no npm, framework, bundler, backend or build step.
