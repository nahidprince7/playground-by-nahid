# Crack the Interview

A role-based software interview simulation where every answer changes the
interviewer's confidence.

Pick a job card, revise three of its six topics in 30 seconds, then work through
four rounds assembled fresh from reusable skill banks. Correct answers build
confidence; weak answers drain it. Hit zero and the interview ends immediately.

## The candidate moves

Three lifelines model things good candidates actually do:

- **Could you repeat that?** buys 20 seconds at a small confidence cost.
- **Let me think out loud** removes one weak option while showing your reasoning.
- **I don't know—but here's how I'd find out** skips safely for less than any
  wrong answer costs.

The charges are global. Once spent, they do not refill between rounds.

## Question formats

- Multiple choice
- Red-flag review of code or a quote
- Ordering a workflow by dragging or tapping two rows to swap
- Open answers compared against a model answer and self-scored

## Run it

Everything is static. The cleanest local run is:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/crack-the-interview/`.

Opening `index.html` directly also works. `validate.py` builds `content.js` from
the source JSON so browsers can load the same reviewed content under `file://`
without a server or a folder-permission dialog.

## Files

- `index.html` — every screen and all responsive styling.
- `game.js` — loading, validation, assembly, state, timers, scoring and debrief.
- `content/` — job recipes and reusable question banks.
- `validate.py` — content integrity and pool-size checks.

No npm, framework, bundler, backend, API key or build step.
