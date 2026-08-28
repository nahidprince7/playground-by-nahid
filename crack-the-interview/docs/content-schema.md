# Content schema — skills in, job titles out

The game has no intelligence of its own. Every question is authored ahead of time
and committed as JSON. This document is the contract between the authoring step
(Nahid → Claude) and the engine.

---

## The central idea

Questions do not belong to jobs. They belong to **skills**.

A job title is a recipe — *this title needs these six topics, at this level* — and
the engine draws the questions from the skill banks at runtime. So a React
question is written once and reused by every job that touches React, and fixing a
mistake in it fixes it everywhere.

The payoff compounds: the first job title costs 24 new questions, the fifth one
costs almost none.

```
content/
├── index.json                 # the job cards
├── job-titles/<slug>.json     # recipes — which skills, which level, round sizes
└── skills/<skill>.json        # the question banks
content.js                     # GENERATED from all of the above — what the browser reads
```

**`content/` is where content is authored and reviewed. `content.js` is what the
game actually loads.** `validate.py` generates the second from the first, and it
exists for one reason: a `<script>` tag works when `index.html` is opened straight
off disk, while `fetch()` is blocked over `file://`. Never hand-edit `content.js`
— every run of `validate.py` overwrites it. Do commit it; the static host has no
build step to generate it.

---

## The authoring workflow

1. Nahid pastes a LinkedIn job description into a chat with Claude.
2. Claude works out which skills it needs. Existing skill files get reused;
   genuinely new ones get created.
3. Claude writes only the questions that don't exist yet, into the skill banks.
4. Claude writes the job title recipe and adds it to `content/index.json`.
5. `python3 validate.py`, from the project folder, must pass. As well as checking
   the banks, it regenerates `content.js`.
6. Commit — including `content.js`.

**A job description is read for exactly one thing: which skills it asks about.**
Everything about the employer goes on the floor — the company name, the industry,
the mission paragraphs, the pitch, the location, the deadline, the HR boilerplate.
No field exists that could hold any of it.

**Interview rounds are ours, not the posting's.** Some job ads publish their own
hiring process. We ignore it — every job title uses the same four rounds, so
players learn one structure and then feel the difficulty rather than the format.

**The title is written by Nahid**, not lifted from the posting's headline, and
carries the level in parentheses: `Software Engineer (.NET, 2-4 years)`. The years
in the title are the years the questions are pitched at, which need not match what
the posting asked for.

---

## `content/skills/<skill>.json`

```json
{
  "skill": "react",
  "label": "React",
  "questions": [ ... ]
}
```

`skill` must equal the filename. One skill is one thing a JD would name — `react`,
`sql-server`, `kotlin`, `spring`. Not `frontend`, which is a topic, and not
`programming`, which is nothing.

Two skills covering the same idea in different dialects (`sql-server` and `mysql`)
is fine and expected. Near-duplicate questions across them are the price of having
questions that sound like the job.

**`behavioral` is special.** It is available to every job title, always, and is
never one of the six revisable topics — you cannot revise your way through an HR
screen. Every other skill only reaches a player through a job title that names it.

### Every question

```json
{
  "id": "react-03",
  "stage": "technical",
  "levels": ["mid", "senior"],
  "platform": "android",
  "type": "mcq",
  "prompt": "...",
  "explanation": "..."
}
```

| Field | Meaning |
|---|---|
| `id` | `<skill>-<nn>`, unique across everything |
| `stage` | `hr` · `technical` · `deepdive` · `ask` — which round it belongs in |
| `levels` | which job levels it's fair for: `junior` · `mid` · `senior` |
| `platform` | **optional.** `web` · `ios` · `android`. Present means only jobs on that platform may draw it |
| `explanation` | **required.** Shown after answering, right or wrong |

`explanation` is the reason someone replays the game, so it teaches rather than
confirms. One or two sentences, plain language, still worth reading by someone who
got it right — usually by naming the second-best answer and why it loses.

### `mcq`

```json
{ "type": "mcq",
  "options": ["...", "...", "...", "..."],
  "correct": 1,
  "eliminate": 3 }
```

Exactly four options. `correct` is 0-based. `eliminate` is the option the *"let me
think out loud"* lifeline removes — pick the most obviously wrong one, so the
lifeline helps without handing over the answer.

### `red-flag`

Shows code or a quoted answer; the player picks what's wrong with it.

```json
{ "type": "red-flag",
  "subject": { "kind": "code", "language": "kotlin", "content": "...\n..." },
  "options": ["...", "...", "...", "..."],
  "correct": 1,
  "eliminate": 3 }
```

`subject.kind` is `code` (with `language`) or `quote` — a quote is something a
candidate said, which is how HR-round red flags work.

### `order`

```json
{ "type": "order",
  "instruction": "Put these in the order you'd actually do them.",
  "items": [ { "id": "a", "text": "..." } ],
  "correctOrder": ["b", "c", "a", "d"] }
```

All or nothing. Partial credit on orderings gets fiddly and the sequence is the
whole point.

### `open`

```json
{ "type": "open",
  "modelAnswer": "...",
  "keyPoints": ["...", "..."] }
```

No auto-scoring. The model answer is revealed, `keyPoints` renders as a checklist,
and the player self-scores. Self-scoring is honest enough — nobody cheats a game
they're playing to prepare for something real.

---

## `content/job-titles/<slug>.json`

```json
{
  "slug": "software-engineer-dotnet",
  "title": "Software Engineer (.NET, 2-4 years)",
  "level": "mid",
  "difficulty": 3,
  "platform": "web",
  "stack": [".NET Core", "Angular", "React", "SQL Server"],

  "briefing": {
    "summary": "...",
    "requirements": ["...", "..."]
  },

  "topics": [
    { "id": "backend", "label": ".NET Core, Web API & C#", "skills": ["dotnet-core"] },
    { "id": "data",    "label": "SQL Server & EF Core",    "skills": ["sql-server", "ef-core"] }
  ],

  "rounds": [
    { "id": "hr", "name": "HR Screen",
      "interviewer": { "name": "Tanha", "role": "Recruiter" }, "count": 5 }
  ],

  "extra": []
}
```

**Exactly six topics.** They're what the player revises three of, and each groups
one or more skills. `behavioral` is never among them.

**Exactly four rounds**, in order: `hr`, `technical`, `deepdive`, `ask`. `count` is
how many questions that round draws. 5–7 each, 20–28 in a job overall.

`platform` gates platform-tagged questions. Use `web` for anything that isn't a
mobile job.

`extra` holds job-specific questions in the same shape as bank questions, for the
ones too specific to belong in a skill — a question about a fifteen-year-old
in-house ERP is meaningless in any other job. Use it sparingly; a question that
could live in a skill should.

`briefing.summary` describes the *work*, never the employer, and should quietly
tell the player which topics to revise — the posting's real emphasis, said plainly.

---

## Rules for generated questions

These are what separate this from a generic quiz site.

1. **Every question traces back to a line in the JD.** If the posting doesn't
   mention Kubernetes, no Kubernetes question.
2. **Ask what the job asks.** A posting that says "high volume" four times should
   produce questions about load, not language trivia.
3. **No trick questions, no memorised syntax.** Wrong options must be things a
   real candidate would plausibly say. An option nobody would pick is a wasted one.
4. **Difficulty follows `levels`.** Junior asks what a thing is; senior asks when
   you'd choose it over the alternative, and what it costs.
5. **The best distractor is nearly right** — the true-but-secondary finding, the
   fix that addresses the symptom. Say so in the explanation.
6. **HR-round questions are about character, not knowledge.**
