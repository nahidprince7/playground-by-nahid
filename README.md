# Playground by Nahid

A small collection of interactive things I build to make hard ideas **playable**.
One landing page, three browser games — no install, no build, no sign-up.

> **Live:** open `index.html` (the hub) → pick a project → play full-screen.
> Suggested subdomain: **`playground.yourdomain`**

---

## Projects

| Project | What it is | Play |
|---|---|---|
| **Crack the Interview** | *Survive a real job interview, question by question.* Pick a role, get 30 seconds to revise three topics, then face four rounds. Every answer moves the interviewer's confidence — let it hit zero and the interview ends mid-sentence. | [`crack-the-interview/`](./crack-the-interview/) |
| **Fish Brain** | *Build a fish brain by neural networking.* Grow a real neural network one node at a time and watch the consequences swim around underneath it. Add a sense, see the net rewire, learn whether it was worth anything against the predator. | [`neural-network/`](./neural-network/) |
| **Are You DevOps?** | A system-design simulation game. Deploy CDNs, load balancers, caches and databases to keep your infrastructure alive as traffic surges from a viral tweet to a full DDoS — without blowing the budget. | [`DevOps Challange/`](./DevOps%20Challange/) |

Each project is fully self-contained — the hub page just links into its folder, and the games share a slim "Playground by Nahid" top bar + footer that link back to the hub.

---

## Run locally

Everything is static, so any simple web server works:

```bash
# from the repo root
python3 -m http.server 8080
# then open http://localhost:8080/
```

Opening `index.html` directly by double-clicking also works, though a local
server is the cleaner way to test the links.

---

## Deploy

It's a plain static site — point any static host at the **repo root** with zero config:

- **Vercel / Netlify:** import the repo, framework preset "Other", output = root.
- **GitHub Pages:** Settings → Pages → deploy from the root of your branch.

Then map your custom subdomain (e.g. `arcade.yourdomain`) to it.

---

## Structure

```
.
├── index.html            # the hub / landing page (personal branding + cards)
├── DevOps Challange/     # "Are You DevOps?" — untouched
├── neural-network/       # "Fish Brain" — untouched
├── crack-the-interview/  # "Crack the Interview" — an interview simulation
│   ├── content/          # questions, authored as JSON — see below
│   ├── content.js        # generated bundle, what the browser actually reads
│   ├── docs/             # design notes and the spec the game was built from
│   └── validate.py       # checks the content, then rebuilds content.js
└── README.md
```

### Adding a role to Crack the Interview

Questions belong to **skills**, not to jobs. A job title is a recipe naming six
topics, and the game draws its questions from the skill banks at runtime — so a
React question written once is reused by every role that touches React.

1. Write any missing questions into `content/skills/<skill>.json`.
2. Add the recipe to `content/job-titles/<slug>.json` and list it in
   `content/index.json`.
3. Run `python3 validate.py` from that folder. It checks every job can still fill
   its four rounds, then regenerates `content.js`.
4. Commit, including `content.js`.

`content/content-schema.md` in `docs/` is the full contract. Never hand-edit
`content.js` — it is overwritten on every run.

---

## Tech

Pure HTML / CSS / vanilla JavaScript throughout — no build step, no bundler, no
framework anywhere. The hub page is a single self-contained file, and its previews
are CSS art, so there are no image assets to load. The games bring their own
styling: Canvas 2D for Fish Brain, Tailwind CDN for the other two.

Crack the Interview is the only one with content separate from code. Its questions
live as JSON under `content/`, and `validate.py` bundles them into `content.js`
so a `<script>` tag can load them — `fetch()` is blocked when a page is opened
straight off disk, a `<script>` tag is not.

---

**Playground by Nahid**

[GitHub](https://github.com/nahidprince7) ·
[YouTube](https://www.youtube.com/@devAI070) ·
[LinkedIn](https://www.linkedin.com/in/iammdnahidhasan/) ·
[Facebook](https://www.facebook.com/search/top?q=dev%20ai)
