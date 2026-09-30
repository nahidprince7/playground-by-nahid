# Ship It: planning docs

This folder records why the game is shaped the way it is and how to extend it.
Nothing in it ships to the browser.

| Doc | What's in it |
|---|---|
| [`game-design.md`](./game-design.md) | The concept, the weekly loop, the meters, moves, events and scoring |
| [`scenario-schema.md`](./scenario-schema.md) | How to write a new project, the event effect grammar, and how to balance it |
| [`decision-log.md`](./decision-log.md) | Choices made along the way, what was tuned, and ideas parked for later |

---

## The one-line pitch

**Ship It**: *deliver the project on time, on budget, with the team intact.*
Pick one of five randomly dealt projects, spend its money and weeks, and find
out which corner of the iron triangle you are willing to break.

---

## Decisions already made

| Decision | Choice | Why |
|---|---|---|
| Name | **Ship It** | Short, and it is what every PM is trying to do |
| Core loop | **Turn-based weekly planning**, not real-time | Project management is a series of decisions under uncertainty, not reflexes. Each week is one decision cycle. |
| Scenario pool | **10 projects, 5 dealt at random** | Each visit feels fresh and gives the player a real choice. Replays surface projects they haven't seen. |
| Project types | Software **and** non-software (events, office move, campaigns) | PM skills are not only for software. Varied types keep the pool from reading as ten versions of one app. |
| Content | **Committed JS data** (`scenarios.js`), no build step | Loads from a `<script>` tag, so it works under `file://` like the other games |
| Rules | One pure `engine.js`, with the UI separate | The balance tool can run the real rules headless, so they are never copied into the tool |
| Tech | Vanilla HTML/CSS/JS, the same dark palette family and chrome as the other games | Consistent with the playground |

---

## Balance snapshot

`node tools/balance.mjs`: the share of runs that ship on time, out of 400 per
strategy. "Thoughtful" is a scripted player that watches the forecast, descopes
early and pushes only while morale can take it.

| Difficulty | On time (thoughtful player) |
|---|---|
| ●●○○○ | ~45–60% |
| ●●●○○ | ~25–40% |
| ●●●●○ | ~20–35% |
| ●●●●● | ~20% |

Crunching every week always scores worse than the thoughtful player, even on
the Startup MVP, where it does reach the deadline more often. A human who
reassigns people and uses moves well should do clearly better than both.

## Still open

- [ ] OG image (`assets/og-shipit.png`)
- [ ] Log plays with a copy of `log.php`, as the DevOps game does?
- [ ] More scenarios. See `scenario-schema.md`. Construction and NGO projects would widen the range.
