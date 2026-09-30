# Ship It: decision log

## 2026-09-29: first build

**The brief** (from Nahid): a project management game. Scenarios come up at
random, the player picks one of five, and projects differ in type, money and
timeline. It should follow the other playground games.

**Pool of ten, deal five.** "Five scenarios, randomly" could mean five fixed
scenarios shuffled, or five drawn from a larger pool. The pool gives more
replay value and a real reason to press **Deal new projects**. Changing the
deal size is one constant (`DEAL` in `game.js`).

**Turn-based weeks, not real time.** The DevOps game is real-time because
traffic is. Project work is a sequence of planning decisions, so each turn is
one week. That also keeps it playable on a phone.

**Workstreams are independent.** Real projects have dependencies and a
critical path. Modelling them would double the UI for a lesson the burndown
already teaches. Allocation by trade (full speed in your trade, half speed
outside it) turned out to be enough of a puzzle, because each project
under-staffs at least one trade.

**Engine and UI split.** Crack the Interview keeps logic and UI in one
`game.js`. Here the rules are in `engine.js`, with no DOM, so
`tools/balance.mjs` can play the real game thousands of times. Balancing by hand
would have been guesswork.

**Mechanics that carry a named PM lesson.** Each is small in code, and the
debrief names it when it happens:

- *Brooks's law*: newcomers ramp at 35% → 70% → 100% and slow everyone else by
  8% each.
- *Crunch is a loan*: output ×1.45, but morale drives future output, and 12%
  of a crunch week is rework.
- *Watermelon status*: a rosy update is +8 now and −15 at launch if late.
- *Cut early, cut cheap*: cutting a feature mid-project costs double what it
  costs at kickoff.
- *EAC over spend*: the forecast shows estimate-at-completion, not just money
  spent.

### Balance passes

1. **First run**: far too hard. The thoughtful player shipped on time 0–20% of
   the time, and crunching every week was the best strategy on short projects.
2. **Scaled all scope by 0.85 and added rework** to push (4%) and crunch (12%).
   That made the game too easy, and passive play scored S grades.
3. **Tightened scoring**: sustainable pace no longer heals quality on its own.
   Quality starts at 75, the grade bands went up to S90/A80/B66/C50, and the
   late and overspend penalties rose to 20/week and 5/1%.
4. **Per-scenario scope scaling** so the difficulty dots match reality. The
   Hospital and Tax Portal projects were easier than their ratings, and Indie
   Game, Office Move and Admissions were harder.

Crunch still reaches the deadline most often on the six-week Startup MVP. It is
left that way because it scores lower anyway, which is honest about startups.

## Parked ideas

- Task dependencies and a critical-path view, as a "hard mode"
- Individual skills and seniority beyond a single `speed`
- A risk register at kickoff: pay up front to reduce the chance of certain events
- A post-launch week, where low quality turns into support tickets that eat the next project's capacity
- Bangla language toggle
