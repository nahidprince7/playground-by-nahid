# Decision log

A record of how this project got its shape, kept so that a future session — or a
future Nahid — doesn't relitigate settled questions or quietly undo a decision
without knowing what it cost. Newest work goes at the bottom.

---

## 2026-08-28 — planning session

The whole design was worked out in one sitting, before a line of game code
existed. Four LinkedIn job descriptions went in; 92 questions, 24 skills and 4
job titles came out, plus the spec Codex builds from.

### Naming

Wanted a third game alongside *Fish Brain* and *Are You DevOps?* on the theme of
cracking interviews. Shortlisted `Final Round`, `Offer Letter`, `Interview Boss`,
`Survive the Interview`. Nahid required the word "interview" in the name, then
picked **Crack the Interview** — the most literal option, and the one that reads
as a promise rather than a joke.

### Simulation, not a quiz

The founding decision. A quiz asks *do you know the answer?*; an interview asks
whether you can hold together while someone judges you. So the questions are only
half the game.

The other half is the three **lifelines** — *"Could you repeat that?"*, *"Let me
think out loud"*, and *"I don't know, but here's how I'd find out."* That third
one is deliberately cheaper than any wrong answer. It is the only rule in the
game that rewards you for not knowing something, and it's the thing players are
meant to take away from it. **If a future change makes bluffing cheaper than
admitting ignorance, the game has lost its point.**

Confidence starts at 60, hits 0, and the interview ends *mid-round*. That abrupt
stop is intentional — real interviews end like that.

### Static content, no backend

Considered a "paste your own JD" box backed by a live model. Killed it: the whole
playground is static with no build, no key and no cost, and a backend would break
that. Claude generates the content at authoring time and it gets committed. This
also means quality is controlled rather than sampled.

### Two reversals worth remembering

**Company identity was in the schema, then removed.** The first draft turned each
employer into an archetype ("Fast-growing fintech startup"). Nahid: *"kon company
ki egula amader dekhar bishoy na."* Correct — a JD is read for exactly one thing,
which skills it asks about. There is now no field anywhere that could hold an
employer's identity, deliberately.

**Rounds briefly mirrored the posting's own hiring process.** One JD published its
stages (HR, then the project owner), so the schema was widened to let a job title
carry 2–4 rounds. Nahid: *"amra amader ta amader moto korbo."* Reverted to a fixed
four. The reasoning holds up: a structure the player already knows is what lets
them feel the confidence bar instead of relearning the format each time. The iOS
job title had already been built as two rounds and was rebuilt as four.

### The restructure: skill banks, not job packs

Nahid's idea, and the largest change of the session. The first build put 24
questions inside each job's own file. That duplicates — React appears in a .NET
job *and* in any frontend job — so a fix has to be made in five places.

Now **questions belong to skills, not to jobs.** A job title is a recipe: six
topics, each naming one or more skills, plus how many questions each round draws.
The engine assembles the interview at runtime.

The cost, accepted openly: bank questions can't reference one specific posting.
The `extra` array on a job title exists for the handful that genuinely need to.

It worked immediately. The fourth JD (Java/Spring/React) already had React in the
bank, so it only needed Java, Spring and MySQL written. The fifth will be cheaper
still.

Folders were named `subjects/` and `jobs/` for about ten minutes before Nahid
renamed them **`skills/`** and **`job-titles/`**.

### Two things the restructure produced on its own

**`behavioral` is never a revisable topic.** It's available to every job title,
always, and supplies most of the HR round — but it isn't one of the six topics
the player revises, because you cannot revise your way through an HR screen. This
also freed all six revision slots to be technical.

**Questions carry an optional `platform` tag.** It let iOS-flavoured architecture
questions and platform-neutral ones share one `architecture.json` without a .NET
job ever drawing "you inherit a 3,000-line view controller."

### Content written this session

| Job title | Level | Per play |
|---|---|---|
| Software Engineer (.NET, 2-4 years) | mid | 24 |
| Sr. Software Engineer (iOS, 7+ years) | senior | 21 |
| Sr. Software Engineer (Android, 3-6 years) | senior | 22 |
| Sr. Software Engineer (Java + React, 5+ years) | senior | 23 |

`ai-workflow` was split out as its own skill — working *with* coding agents,
context files, reviewing generated code — separate from `ai-integration`, which is
about putting AI features into a product. One JD asked for the first at length.
Both will keep coming up.

`validate.py` was written to prove each job title can actually fill its four
rounds from the banks. It passes, with warnings on three thin pools.

---

## Parked — ideas for "aro shundor", after it's playable

Not decided, not scheduled. Written down so they aren't lost.

- **Interviewer reactions.** The design says a CSS avatar changes state on a good
  or bad answer. Worth doing properly once the loop works — it's most of the
  atmosphere for very little code.
- **A shareable result card.** The debrief is the screenshot moment; right now
  it's a screen, not an image. Canvas-render it and the game markets itself.
- **Salary negotiation as a real scene** at 85+ confidence, rather than a line of
  text. It's the one part of interviewing nobody practises.
- **A "why this is wrong" pass on distractors.** Explanations currently name the
  second-best answer sometimes. Doing it every time would make replaying more
  valuable than winning.
- **Sound.** Explicitly out of scope for v1 and probably for good — a ticking
  clock might be the one exception.
- **Thin pools.** iOS technical, .NET deep dive and The Ask draw from a pool
  barely bigger than the round, so replays repeat. More JDs is the fix, not
  cleverer selection.
