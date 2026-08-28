# Build spec — for Codex

Read [`game-design.md`](./game-design.md) and [`content-schema.md`](./content-schema.md)
first. This document covers only *how it gets built*: files, screens, state, and the
house conventions it has to match.

---

## Constraints, non-negotiable

- **Static.** No build step, no bundler, no npm, no framework. Opening the file
  from disk must work.
- **No backend.** Question packs are JSON fetched from the same folder. The one
  exception is an optional `log.php` play-counter, copied from the DevOps game.
- **Vanilla JS.** Tailwind via CDN for layout, hand-written CSS where Tailwind
  fights back. Same as `../../DevOps Challange/index.html`.
- **Mobile first.** This repo has already been burned twice by desktop-first
  layouts. Everything stacks in a single column under 640px — no grid that
  reflows, no horizontal scroll, no fixed pixel widths on anything that holds text.

## Files

```
crack-the-interview/
├── index.html              # all screens, all styling, the shell
├── game.js                 # engine: state machine, assembly, scoring, timers
├── validate.py             # authoring tool — checks the content, not part of the game
├── docs/                   # planning — this folder, not shipped
├── content/
│   ├── index.json          # the job cards
│   ├── job-titles/         # recipes: which skills, which level, round sizes
│   └── skills/             # the question banks
└── README.md               # written last, matching the other two projects' tone
```

Splitting the engine out follows `../neural-network/` (`index.html` + `sim.js`) rather
than the DevOps game's single 113KB file. Content stays out of both — and unlike
the other two games it is genuinely separate, because it grows every time a job
description arrives.

---

## Screens

One `<section>` each, one visible at a time, driven by a `screen` field in state.
No router, no hash navigation.

| Screen | Enters when | Leaves to |
|---|---|---|
| `pick` | Load. Renders cards from `packs/index.json` | `briefing` (fetches the pack) |
| `briefing` | A card is tapped | `interview` (once 3 topics are chosen or 30s expires) |
| `interview` | Prep ends | `verdict` (questions exhausted, or confidence hits 0) |

The interview screen loops over `pack.rounds`. Every pack ships the same four
rounds with 5–7 questions each, so the header reads `Round 2 of 4` — but drive it
from `pack.rounds.length` rather than hard-coding 4, so a pack with a bad round
count renders honestly instead of lying.
| `verdict` | Interview ends | `pick` (play another) or `briefing` (retry this job) |

If fewer than three topics are picked when the prep clock expires, go in with
whatever was selected — including nothing. Walking in unprepared is a legal move
and the debrief should say so.

## State

One object, one place. No state anywhere else in the DOM.

```js
const state = {
  screen: 'pick',
  pack: null,             // the loaded pack JSON
  revised: [],            // topic ids, max 3
  confidence: 60,         // 0–100, the only losing condition
  roundIndex: 0,
  questionIndex: 0,       // within the round
  lifelines: { repeat: 2, thinkAloud: 3, dontKnow: 1 },
  eliminated: [],         // option indices hidden on the current question
  timeLeft: 45,
  history: [],            // { questionId, topic, correct, deltaConfidence, usedLifeline, timedOut }
};
```

`history` is what the debrief is built from, so append to it on every question
including timeouts and skips — the "which topic cracked you" analysis has no other
source.

## Rules the engine must get right

1. **Confidence clamps to 0–100.** Reaching 0 ends the interview *immediately*,
   mid-round, without asking the remaining questions.
2. **The revision multiplier** applies at scoring time: correct on a revised topic
   is +12 instead of +8, wrong on a non-revised topic is −24 instead of −12. Topics
   that were neither revised nor skipped don't exist — all six are one or the other.
3. **One timer.** A single `setInterval` the whole game, cleared on every screen
   change. Do not start a fresh interval per question; that's how the clock ends up
   running twice as fast after a replay.
4. **The clock stops the moment an answer is locked in**, before the explanation
   renders. The explanation is not timed and the player should be able to read it.
5. **Lifeline charges are global**, not per round, and never refill.
6. **"I don't know"** is a −5 skip. It must be cheaper than a wrong answer in every
   case, or the mechanic teaches the opposite of what it's meant to.
7. **Content is validated on load** — six topics, every named skill file present,
   MCQ options exactly four, `correctOrder` matching `items`. A malformed file
   should say so on screen, not fail silently into a blank round.
8. **Assembly is re-shuffled every play.** Replaying the same job title must give a
   different interview — that is where the replay value lives. Don't cache a plan.

## Look

Dark, same family as *Are You DevOps?*: slate/navy ground, one accent for
confidence-up and one for confidence-down. Plus Jakarta Sans for text, Fira Code for
anything code-shaped. Interviewer avatars are CSS — initials in a circle, no image
files.

The confidence bar animates its width and colour together (green → amber → red) and
is the most prominent thing on the interview screen after the question itself.

## House conventions to copy

- **Playground chrome.** Copy the `.pg-bar` topbar and `.pg-foot` footer blocks
  verbatim from `../../neural-network/index.html` (around lines 428 and 1314), including
  their `<style>` block. Links point at `../index.html`.
- **OG tags.** Match the pattern in `../../DevOps Challange/index.html` — `og:site_name`
  is `Playground by Nahid`, the image is
  `https://playground.devadda.site/assets/og-interview.png` at 1200×630, and
  `og:url` is the folder URL. The image needs to exist before launch.
- **Hub card.** Add a third card to the root `index.html` matching the two there,
  with a CSS-art preview — no image asset.
- **Root README.** Add the row to the projects table.

## Build order

1. Screen shell + state machine + the `pick` screen. The content is already written.
2. Content loading and the assembly algorithm, checked against `validate.py`.
3. `interview` screen with `mcq` only, scoring, timer, verdict.
4. The other three question types.
5. Lifelines.
6. `briefing` screen and the revision multiplier.
7. Debrief on the verdict screen.
8. Playground chrome, OG tags, hub card, READMEs.

Steps 1–3 are a playable game. Everything after makes it worth replaying.
