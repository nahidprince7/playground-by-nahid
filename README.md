# Playground by Nahid

A small collection of interactive things I build to make hard ideas **playable**.
One landing page, two browser games — no install, no build, no sign-up.

> **Live:** open `index.html` (the hub) → pick a project → play full-screen.
> Suggested subdomain: **`playground.yourdomain`**

---

## Projects

| Project | What it is | Play |
|---|---|---|
| **Are You DevOps?** | A system-design simulation game. Deploy CDNs, load balancers, caches and databases to keep your infrastructure alive as traffic surges from a viral tweet to a full DDoS — without blowing the budget. | [`DevOps Challange/`](./DevOps%20Challange/) |
| **Fish Brain** | *Build a fish brain by neural networking.* Grow a real neural network one node at a time and watch the consequences swim around underneath it. Add a sense, see the net rewire, learn whether it was worth anything against the predator. | [`neural-network/`](./neural-network/) |

Each project is fully self-contained and unchanged — the hub page just links into its folder.

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
└── README.md
```

---

## Tech

Pure HTML / CSS / vanilla JavaScript. The hub page is a single self-contained
file — its previews are CSS art, so there are no image assets to load. The games
bring their own styling (Tailwind CDN for DevOps, Canvas 2D for Fish Brain).

---

**Playground by Nahid** · [github.com/nahidprince7](https://github.com/nahidprince7)
