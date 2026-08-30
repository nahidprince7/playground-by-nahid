# Prompt for Codex

Copy everything below the line into Codex. It is self-contained — the content
already exists in the repo, so Codex only builds the engine.

---

Build a browser game called **Crack the Interview**. It lives in the
`crack-the-interview/` folder of a static site called *Playground by Nahid*,
alongside two existing games. The question content is already written and
committed. **Do not write, edit or generate any question content** — your job is
the engine that assembles and runs an interview from it.

## Hard constraints

- Static site. **No build step, no bundler, no npm, no framework.** Opening
  `index.html` from disk must work.
- No backend, no API calls, no API keys. All content is JSON fetched from
  `content/` in the same folder.
- Vanilla JavaScript. Tailwind via CDN for layout, hand-written CSS where
  Tailwind gets in the way. Match `../DevOps Challange/index.html`.
- **Mobile first.** Everything stacks into a single column below 640px. No
  horizontal scroll, no fixed pixel widths on anything containing text. This repo
  has been burned twice by desktop-first layouts.
- Files you create: `index.html` (all screens + styling), `game.js` (state
  machine, assembly, scoring, timers), `README.md` (last, matching the tone of
  `../neural-network/README.md`).
- **Do not touch `content/` or `validate.py`.**

## What the game is

The player picks a job title, gets 30 seconds to revise 3 of 6 topics, then sits
through a four-round interview. Every answer moves an **interviewer confidence
meter**. Hit 0 and the interview ends on the spot, mid-round. Reach the end with
enough confidence and you get an offer.

It is a simulation, not a quiz. The difference is the three lifelines — the moves
a real candidate makes around a question they're unsure of.

## Content model

```
content/
├── index.json                 # the job cards
├── job-titles/<slug>.json     # a recipe: which skills, which levels, round sizes
└── skills/<skill>.json        # the question banks — questions live here
```

A **job title** does not contain questions. It lists 6 revisable **topics**, each
mapping to one or more **skills**, and says how many questions each round needs.
The engine draws the questions from the skill banks at runtime. This is the
central design decision: one React question is reused by every job that needs
React.

`content/index.json`:
```json
{ "jobs": [ { "slug": "...", "title": "...", "stack": ["..."],
              "level": "mid", "difficulty": 3, "questionCount": 24 } ] }
```

`content/job-titles/<slug>.json`:
```json
{
  "slug": "software-engineer-dotnet",
  "title": "Software Engineer (.NET, 2-4 years)",
  "level": "mid", "difficulty": 3, "platform": "web",
  "stack": [".NET Core", "Angular", "React", "SQL Server"],
  "briefing": { "summary": "...", "requirements": ["...", "..."] },
  "topics": [
    { "id": "backend", "label": ".NET Core, Web API & C#", "skills": ["dotnet-core"] },
    { "id": "data",    "label": "SQL Server & EF Core",    "skills": ["sql-server", "ef-core"] }
  ],
  "rounds": [
    { "id": "hr",        "name": "HR Screen",        "interviewer": { "name": "Tanha", "role": "Recruiter" },      "count": 5 },
    { "id": "technical", "name": "Technical Screen", "interviewer": { "name": "Rafi",  "role": "Senior Engineer" }, "count": 7 },
    { "id": "deepdive",  "name": "Deep Dive",        "interviewer": { "name": "Imran", "role": "Tech Lead" },       "count": 7 },
    { "id": "ask",       "name": "The Ask",          "interviewer": { "name": "Sadia", "role": "Hiring Manager" },  "count": 5 }
  ],
  "extra": []
}
```

Always exactly 6 topics and exactly those 4 rounds, in that order. `extra` is an
optional array of job-specific questions in the same shape as bank questions —
treat them as if they came from a skill named `extra`.

`content/skills/<skill>.json`:
```json
{ "skill": "react", "label": "React", "questions": [ ... ] }
```

## Question shapes

Every question has `id`, `type`, `stage`, `levels`, `prompt`, `explanation`, and
optionally `platform`.

- `stage` — `hr` | `technical` | `deepdive` | `ask`. Which round it belongs in.
- `levels` — array from `junior` | `mid` | `senior`. Which job levels it's fair for.
- `platform` — optional. `web` | `ios` | `android`. If present, only jobs with a
  matching `platform` may use it. If absent, any job may.
- `explanation` — shown after answering, right or wrong. Always render it.

**`mcq`** — `options` (exactly 4 strings), `correct` (0-based index),
`eliminate` (index the "think out loud" lifeline removes).

**`red-flag`** — same as mcq, plus `subject`: `{ kind: "code", language, content }`
or `{ kind: "quote", content }`. Render code in a monospace block preserving
newlines; render a quote as a styled blockquote.

**`order`** — `instruction`, `items` (`[{id, text}]`), `correctOrder` (array of
ids). Drag to reorder, or tap-to-swap on touch. Scored all or nothing.

**`open`** — `modelAnswer`, `keyPoints` (array of strings). No auto-scoring: show
a text area or just a "ready" button, then reveal the model answer with keyPoints
as a checklist, and let the player self-score with three buttons —
*I said all of that* (+8), *I got the gist* (+3), *No idea* (−10).

## Assembling an interview

When the player starts a job title, for each round in order:

1. Collect the candidate pool: every question in every skill named by any of the
   job's `topics`, **plus every question in `skills/behavioral.json`** —
   behavioral is always available to every job and is deliberately not one of the
   6 revisable topics. Plus anything in the job's `extra`.
2. Filter: `question.stage === round.id`, `question.levels.includes(job.level)`,
   and `!question.platform || question.platform === job.platform`.
3. Shuffle, then take `round.count`. If the pool is smaller than `count`, take
   what there is and carry on — do not repeat a question within a game.
4. Record which topic each question came from, by finding the topic whose
   `skills` array contains the question's skill. Behavioral and extra questions
   have no topic — they get no revision bonus and no skipped-topic penalty.

Shuffle from a fresh random seed each play, so replaying the same job gives a
different interview. That is the main reason for replay value — don't cache it.

## Screens

One `<section>` per screen, one visible at a time, driven by `state.screen`. No
router, no hash navigation.

**`pick`** — cards from `content/index.json`: title, stack tags, difficulty dots,
question count. Tapping one fetches the job title JSON and its skill files.

**`briefing`** — the `summary` and `requirements`, then the 6 topics as
selectable chips. **Pick exactly 3.** A 30-second clock runs. When it expires, go
in with whatever is selected, including nothing — that's a legal move and the
debrief should say so.

**`interview`** — the main screen:
- Header: `Round 2 of 4 · Technical Screen`, the question clock, the confidence bar.
- The interviewer's name and role, with a CSS avatar (initials in a circle — no
  image files anywhere in this game).
- The question, then the answer UI for its type.
- Lifeline toolbar with remaining charges.
- After answering: the explanation, and a Next button. **The clock stops the
  moment an answer is locked in, before the explanation renders.**

**`verdict`** — the outcome, then the debrief.

## State

One object. No state stored anywhere in the DOM.

```js
const state = {
  screen: 'pick',
  job: null,            // the job title JSON
  skills: {},           // skill id -> loaded bank
  revised: [],          // topic ids, exactly 3 (or fewer if the clock won)
  plan: [],             // [{ round, question, topic }] — the whole interview, assembled up front
  cursor: 0,            // index into plan
  confidence: 60,       // 0-100. The only losing condition.
  lifelines: { repeat: 2, thinkAloud: 3, dontKnow: 1 },
  eliminated: [],       // option indices hidden on the current question
  timeLeft: 45,
  history: [],          // { questionId, topic, skill, correct, delta, lifeline, timedOut }
};
```

## Rules the engine must get right

1. **Confidence clamps to 0–100.** Reaching 0 ends the interview *immediately*,
   mid-round, without asking the remaining questions. Verdict: rejected on the spot.
2. **Scoring**, applied to confidence:
   | Event | Delta |
   |---|---|
   | Correct | +8 |
   | Correct, on a topic the player revised | +12 |
   | Correct with under 10s left | +5 |
   | Wrong | −12 |
   | Wrong, on a topic the player skipped | −24 |
   | Clock ran out | −15 |
   | Wrong on a `red-flag` question | −18 |
   | `open` self-score | +8 / +3 / −10 |
   A question with no topic (behavioral, extra) uses the plain values.
3. **The clock**: 45s for `mcq`, `red-flag` and `order`; 90s for `open`. Use a
   **single `setInterval` for the whole game**, cleared on every screen change.
   Do not start a new interval per question — that is how the clock ends up
   running at double speed after a replay.
4. **Lifelines** — charges are global, never refill:
   | Move | Charges | Effect | Cost |
   |---|---|---|---|
   | "Could you repeat that?" | 2 | +20s on the clock | −3 confidence |
   | "Let me think out loud" | 3 | Hide the option at `eliminate` | −5 confidence |
   | "I don't know — but here's how I'd find out" | 1 | Skip the question | −5 confidence |
   The third one must be cheaper than any wrong answer in every case. It is the
   heart of the game: admitting ignorance gracefully beats bluffing. Disable
   "think out loud" on `order` and `open` questions, which have no options.
5. **Validate content on load** — 4 options on every mcq/red-flag, `correctOrder`
   matching `items`, every named skill file present. On failure, say so on screen.
   Never fail silently into a blank round.

## Verdict and debrief

| Final confidence | Ending |
|---|---|
| 0 (drained mid-interview) | **Rejected on the spot** |
| 1–39 | **Ghosted** — no email ever comes |
| 40–64 | **Waitlisted** — they went with someone more senior |
| 65–84 | **Offer** |
| 85+ | **Offer, and they moved fast** |

Then the debrief, built entirely from `history` — this is the part people
screenshot:
- The confidence line across all four rounds, so you can see where you cracked.
- Weakest topic, named, with the questions you got wrong.
- Which lifelines you spent and whether they paid off.
- Whether the topics you revised were the ones you got asked.

## House conventions

- Copy the `.pg-bar` topbar and `.pg-foot` footer blocks verbatim from
  `../neural-network/index.html` (they start around lines 428 and 1314),
  including their `<style>` block. Links point at `../index.html`.
- OG meta tags following `../DevOps Challange/index.html`: `og:site_name` is
  `Playground by Nahid`, image `https://playground.devadda.site/assets/og-interview.png`
  at 1200×630, `og:url` is `https://playground.devadda.site/crack-the-interview/`.
- Dark theme, same slate/navy family as the DevOps game. Plus Jakarta Sans for
  text, Fira Code for anything code-shaped, both from Google Fonts.
- Add a third card to the root `../index.html` matching the two already there,
  with a CSS-art preview — no image asset.
- Add the row to the projects table in `../README.md`.

## Build order

1. Screen shell, state machine, and the `pick` screen.
2. Content loading and the assembly algorithm — log the assembled plan and check
   it against `validate.py`'s output before building any UI on top of it.
3. `interview` screen with `mcq` only: scoring, clock, confidence bar, verdict.
4. `red-flag`, then `order`, then `open`.
5. Lifelines.
6. `briefing` screen and the revision bonus.
7. Debrief.
8. Playground chrome, OG tags, hub card, README.

Steps 1–3 are a playable game. Everything after is what makes it worth replaying.
