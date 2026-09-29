# Ship It: game design

## The problem with a PM quiz

Anyone can memorise "scope, time, cost: pick two". Project management is hard
because you choose between those trade-offs every week, with partial information,
while things keep going wrong. So the game is a simulation. It never asks a
question with a right answer. It hands you levers that each cost something and
lets the consequences pile up.

---

## The loop

### Screen 1: Pick a project

Five cards are dealt from a pool of ten, with a **Deal new projects** button to
reshuffle. Each card shows the project type, title, a two-line pitch, budget,
deadline, team size and a 1–5 difficulty rating.

### Screen 2: The charter

This is the planning phase before work starts:

- **Definition of done**: one sentence saying what "shipped" means.
- **Budget, deadline, weekly burn, planned scope**: the numbers you are about to
  spend.
- **The team**: name, trade, speed (points/week) and weekly rate.
- **Workstreams**, flagged **UNDERSTAFFED** when the team's capacity in that
  trade is lower than the work, or **NO X ON TEAM** when nobody has the trade
  at all. The Indie Game has no tester on purpose.
- **Optional features**: tap to cut. A cut at kickoff costs the feature's
  stakeholder value. The same cut mid-project costs double, and any work
  already done on the feature is lost.

That last rule is the first lesson. Negotiate scope before the work starts.

### Screen 3: The weeks

Each week the player:

1. **Allocates** every person to a workstream. People work at full speed in
   their own trade and half speed outside it. The page projects each person's
   output live and warns about effort wasted on finished streams.
2. **Sets the pace** for the week:

   | Pace | Output | Morale | Quality | Rework |
   |---|---|---|---|---|
   | Sustainable | ×1.0 | +4 | 0 | 0% |
   | Push | ×1.2 | −7 | −2 | 4% |
   | Crunch | ×1.45 | −16 | −6 | 12% |

   Rework is the share of output that turns out wrong and never counts. Morale
   feeds back into output: a person at 0 morale works at 60% speed. So a crunch
   gets less effective every week it continues.
3. **Makes one management move**:

   | Move | Effect |
   |---|---|
   | Hire contractor | 1.5× the average rate for that trade, plus a one-week signing fee. Works at 35% in week one and 70% in week two. **Each newcomer also slows everyone else by 8%** while they ramp up (Brooks's law). Max 2 at once. |
   | Release contractor | Stops the cost |
   | Team day out | +15 morale, costs money, −10% output |
   | Stakeholder demo | +10 stakeholders, −15% output. Also walks back an earlier rosy status (see events). |
   | Quality sprint | +10 quality, −25% output |
   | Cut a feature | Removes its points. Costs 2× its stakeholder value. |
   | Extend deadline | +2 weeks, −15 stakeholders. Once only, and not on fixed-date projects. |
   | Request budget | +15% budget, −12 stakeholders. Once only. |

4. **Runs the week.** Points land, the weekly burn is spent, and the meters
   move. Then, from week 3 on, there is a 55% chance of an **event**.

The **forecast bar** is always visible. It shows the estimated finish week from
recent velocity and the estimated cost at completion (EAC), coloured
green/amber/red. It is the most important thing on the screen, and the game
teaches you to trust it early.

### Events

Each event is a short scenario with two or three choices. None is a free win.
Generic events are re-skinned with each project's context (who the sponsor is,
what the vendor is, what the bug is). Each scenario also adds one event of its
own.

| Event | The trade-off |
|---|---|
| Scope creep | Accept (+work, +goodwill) · trade it for a smaller feature · say no (−goodwill) |
| Sick team member | Lose them 2 weeks · pay a temp · make them work from bed (morale) |
| Surprise bug | Fix properly (work) · patch (quality) · weekend fix (morale) |
| Vendor price rise | Pay · switch and redo the integration |
| Status meeting | Honest numbers · show only the good parts (**deferred penalty**) |
| Team friction | Mediate (slow week) · ignore (morale) |
| Finance cut | Accept −8% · push back (goodwill) |
| Resignation (low morale only) | Counter-offer (rate) · replace (ramp-up) · absorb (morale) |
| Ambiguous spec | Workshop (slow week) · assume (rework) |
| Shortcut found | Adopt (small cost, saves work) · ignore |
| Eid holiday | Week off (morale) · skeleton crew · business as usual (big morale hit) |
| Leadership borrows someone | Lend (goodwill) · refuse |

The **status meeting** is the watermelon-project lesson. Showing only the good
parts gives +8 stakeholders now. If the project then ships late, the sponsor
takes −15 on launch day. A later demo can walk the spin back early for less.

If morale falls below 30, a resignation becomes likely.

### How it ends

| Ending | Trigger |
|---|---|
| Shipped | All work done |
| Shipped early | Player chose **Ship at N%** (available from 70% done). Stakeholders are charged for what's missing. |
| Funding pulled | Spend passes 125% of budget |
| Project cancelled | Time used reaches 150% of the deadline |
| Replaced | Stakeholder satisfaction hits 0 |

Passive pressure: stakeholders lose 1 point per week while the forecast says
late, and 6 per week once past the deadline.

### Screen 4: The verdict

There are five scores out of 100, averaged into a project score:

| Dimension | Formula |
|---|---|
| Schedule | 100 − 20 per week late |
| Budget | 100 − 5 per 1% over budget |
| Scope | delivered ÷ originally planned points (accepted requests can make up for cuts) |
| Quality | the quality meter |
| Stakeholders | satisfaction, after launch-day adjustments: −15 for a spun status that came due, −10 if quality < 50, and a charge for scope left out when shipping early |

**Grades:** S ≥ 90 · A ≥ 80 · B ≥ 66 · C ≥ 50 · F below, or on any cancellation
(capped at 30).

Then comes the debrief: a burndown (actual vs ideal), budget burn against the
budget line, **one to three lessons tied to what actually happened** (Brooks's
law, crunch as a loan, watermelon status, cut early/cut cheap, or the lesson for
the weakest dimension), and the full project log.

---

## What it should feel like

A calm dashboard under slow-building pressure. Nothing flashes or punishes. The
forecast pill turning amber is the tension. It uses the same dark family as the
other games, with **amber** as this game's accent (deadlines, warnings,
"shipping"), Fira Code for numbers and Plus Jakarta Sans for everything else.

## Out of scope for v1

- Task dependencies / critical path (workstreams are independent on purpose;
  allocation is already the core puzzle)
- Named individual skills beyond one trade per person
- Saved games, leaderboards, accounts
- Sound
