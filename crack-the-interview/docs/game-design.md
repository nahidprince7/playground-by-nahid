# Crack the Interview — game design

## The problem with a quiz

A quiz asks *do you know the answer?* An interview asks something harder: *can
you hold it together while someone judges you in real time?* Everybody has been
in the room where they knew the answer and still fell apart.

So the questions are only half the game. The other half is the set of moves you
can make **around** a question — stalling, thinking out loud, admitting you don't
know. Those are limited, they cost something, and using them well is the skill
the game actually teaches. That is what makes it a simulation.

---

## The loop, concretely

### Screen 1 — Pick a job

Cards, one per pack. Each shows the job title with its experience band, the stack
as tags, and a difficulty. **No employer appears anywhere in the game** — packs are
built from job descriptions, but which company posted one is not something the
player ever sees or needs. Tapping a card opens the briefing.

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Software Engineer           │  │ DevOps Engineer             │
│ (.NET, 2-4 years)           │  │ (Kubernetes, 5+ years)      │
│ .NET Core · Angular · SQL   │  │ K8s · Terraform · AWS       │
│ ●●●○○   24 questions        │  │ ●●●●○   22 questions        │
└─────────────────────────────┘  └─────────────────────────────┘
```

### Screen 2 — The briefing (this is the prep round)

The actual job description, condensed. Below it, six topics pulled from that JD.
**You may revise only three.** A 30-second clock runs while you choose.

Questions from a revised topic give **+50% confidence on a correct answer**.
Questions from a topic you skipped **cost double when you get them wrong**.

This is the first real decision in the game, and it's the one people get wrong the
same way they get it wrong in life: they revise what they already know instead of
what the JD keeps repeating. The JD text is right there on screen — the answer is
in it, if you read it.

### Screen 3 — The interview (four rounds)

```
┌─────────────────────────────────────────────────┐
│  Round 2 of 4 · Technical Screen        ⏱ 0:38  │
│  Interviewer confidence  ███████░░░  71%        │
├─────────────────────────────────────────────────┤
│  Rafi · Senior Engineer                         │
│  "Your endpoint returns 200 but users see       │
│   stale data. Where do you look first?"         │
│                                                 │
│   A) Add more queue workers                     │
│   B) Check the cache TTL and invalidation       │
│   C) Restart the database                       │
│   D) Ask the frontend team to hard-refresh      │
├─────────────────────────────────────────────────┤
│  ↻ Repeat (1)   💭 Think out loud (2)   🤝 (1)  │
└─────────────────────────────────────────────────┘
```

**Every pack runs the same four rounds.** Some postings publish their own hiring
process — two rounds here, five there — and we ignore it. This is our game, not a
re-enactment of any company's pipeline, and a structure the player already knows
is what lets them feel the confidence bar instead of relearning the rules each
time. Four rounds, each with its own interviewer and its own flavour of question:

| # | Round | Interviewer | Question types | What it tests |
|---|---|---|---|---|
| 1 | HR Screen | Recruiter | MCQ, red flag | Tone, motivation, not sounding bitter about your last job |
| 2 | Technical Screen | Senior engineer | MCQ | Fundamentals from the JD's stack |
| 3 | Deep Dive | Tech lead | Red flag, order the steps | Debugging instinct, process thinking |
| 4 | The Ask | Hiring manager | Open-ended, MCQ | Your questions for them, scope, the salary conversation |

5–7 questions per round. Confidence carries across rounds; it never resets.

### The meters

**Interviewer confidence (0–100%, starts at 60%)** — the only meter that can end
the game. Every answer moves it. Hit 0 and the interview stops right there,
mid-round: *"Thanks for coming in — we'll be in touch."* That abrupt ending is the
point. Real interviews end like that.

**The clock (per question)** — 45s on MCQ, 90s on open-ended. Letting it run out
is not an instant loss; it costs confidence, the same as a mediocre answer. Silence
reads as *doesn't know*, which is exactly how it reads in a real room.

### The lifelines

Three moves, charges shown in the toolbar, spent across the whole game:

| Move | Charges | Effect | Cost |
|---|---|---|---|
| ↻ **"Could you repeat that?"** | 2 | +20s on the clock | −3% confidence |
| 💭 **"Let me think out loud"** | 3 | Removes one wrong option | −5% confidence |
| 🤝 **"I don't know — but here's how I'd find out"** | 1 | Skips the question with **−5%** instead of the full wrong-answer penalty | Costs the charge |

That third one is the heart of the game. In a real interview, admitting ignorance
gracefully beats bluffing every single time — and this is the only rule in the game
that rewards you for not knowing something. Players discover it, and it's a lesson
that survives the browser tab closing.

### Scoring

| Outcome | Confidence delta |
|---|---|
| Correct | +8% (+12% if you revised the topic) |
| Correct but slow (under 10s left) | +5% |
| Wrong | −12% (−24% if you skipped the topic) |
| Clock ran out | −15% |
| Red-flag question answered badly | −18% (these hit harder — they're character, not knowledge) |

Open-ended questions can't be auto-scored. The model answer is revealed and the
player picks: *"I said all of that"* (+8%), *"I got the gist"* (+3%), *"I had no
idea"* (−10%). Self-scoring is honest enough — nobody cheats a game they're
playing to prepare for something real.

### Screen 4 — The verdict

| Final confidence | Ending |
|---|---|
| 0% (drained mid-interview) | **Rejected on the spot** |
| 1–39% | **Ghosted** — no email ever comes |
| 40–64% | **Waitlisted** — "we went with someone more senior" |
| 65–84% | **Offer** |
| 85%+ | **Offer, and they moved fast** — plus a counter-offer scene |

Then the debrief, which is the part people screenshot:

- The confidence graph across all 4 rounds — where you cracked
- Your weakest topic, named, with the questions you missed
- Which lifelines you burned and whether they were worth it
- One line of advice tied to your worst round

---

## What it should feel like

Tense but not cruel. The interviewers have names and faces (CSS avatars, no image
assets) and react — a small portrait state change on a good answer, a pause and a
note-taking animation on a bad one. Nothing punishing about the visuals; the
confidence bar sliding down is punishment enough.

Dark theme, same palette family as *Are You DevOps?* Fira Code for anything
code-shaped, Plus Jakarta Sans for everything else.

---

## Explicitly out of scope for v1

- Live AI / paste-your-own-JD (needs a backend — killed on purpose)
- Accounts, saved progress, leaderboards
- Audio
- Multiplayer or "interview your friend"
