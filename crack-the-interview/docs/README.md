# Crack the Interview — planning docs

Planning workspace for *Crack the Interview*. Nothing in this folder ships to the
browser — these are the documents Codex reads before writing any code, and the
record of why the game is shaped the way it is.

| Doc | What's in it |
|---|---|
| [`game-design.md`](./game-design.md) | The concept, the simulation loop, meters, lifelines, endings |
| [`content-schema.md`](./content-schema.md) | How a LinkedIn JD becomes a question pack, and the pack JSON schema |
| [`build-spec.md`](./build-spec.md) | The handoff spec for Codex — files, screens, state, conventions |
| [`codex-prompt.md`](./codex-prompt.md) | **The prompt itself.** Self-contained — copy everything below the line into Codex |
| [`decision-log.md`](./decision-log.md) | How the design got here, including what was tried and reversed, and ideas parked for later |

---

## The one-line pitch

**Crack the Interview** — *survive a real job interview, question by question.*
Pick a job pulled from a real LinkedIn posting, face four rounds of interviewers,
and keep their confidence in you above zero long enough to reach the offer.

---

## Decisions already made

These are settled. Codex should not re-litigate them.

| Decision | Choice | Why |
|---|---|---|
| Name | **Crack the Interview** | Sits alongside the other two games in the repo root |
| Core loop | Interview **simulation**, not a quiz | Matches the family — *Are You DevOps?* is a simulation with meters, not a quiz |
| Content source | **Pre-built, committed JSON** | Site stays static: no backend, no API key, no cost, works offline |
| Content shape | **Skill banks + job-title recipes** | Questions belong to skills, not jobs — so React is written once and reused everywhere |
| Rounds | **Always the same four** | Some postings publish their own process; we ignore it. One structure, learned once |
| `behavioral` | Always available, never revisable | You can't revise your way through an HR screen |
| Question types | MCQ · Spot the red flag · Order the steps · Open-ended with model answer | All four ship; see `content-schema.md` |
| Content authoring | Nahid supplies the LinkedIn JD → Claude generates the pack JSON → committed to the repo | Keeps quality controlled and the runtime dumb |
| Tech | Vanilla HTML/CSS/JS + Tailwind CDN | Same as *Are You DevOps?* |

---

## Content so far

314 questions across 47 skills, feeding 9 job titles. Run `python3 validate.py` from the project folder after any content change — it
checks the banks can still fill every round, then regenerates `content.js`, which
is the file the browser actually reads.

| Job title | Level | Questions per play |
|---|---|---|
| ReactJS Developer (React & Realtime, 1-2 years) | junior | 22 |
| Software Engineer (.NET, 2-4 years) | mid | 24 |
| Software Engineer (Frontend, 3-5 years) | mid | 24 |
| Software Quality Assurance Engineer (2-5 years) | mid | 24 |
| DevOps Engineer (AWS + Kubernetes, 7+ years) | senior | 24 |
| Rust Software Engineer (Industrial, 5+ years) | senior | 23 |
| Sr. Software Engineer (Android, 3-6 years) | senior | 22 |
| Sr. Software Engineer (Java + React, 5+ years) | senior | 23 |
| Sr. Software Engineer (iOS, 7+ years) | senior | 21 |

Every skill bank is also selectable on its own through **Customize your
interview**, which builds a job out of any five of them at any level.

## Still open

- [x] Thin spots the validator warns about. Five job descriptions added on
      2026-08-31 widened every pool; the validator now runs with no warnings at
      all. Junior is the shallowest level and the one to watch.
- [ ] Do we log plays with a copy of `log.php` like the DevOps game does?
- [ ] OG image (`assets/og-interview.png`) — needs designing before launch
