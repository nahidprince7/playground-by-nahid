# Are You DevOps? — System Design Simulation

An interactive, single-file DevOps simulation game that puts you in charge of deploying and scaling a web infrastructure under real-time traffic pressure. Built as a self-contained HTML application with Tailwind CSS.

## Overview

"Are You DevOps?" challenges you to manage a deployment architecture blueprint through escalating traffic scenarios. Starting with a simple single-server setup, you must purchase, deploy, and upgrade infrastructure components — CDN, load balancers, web servers, Redis cache, and databases — to keep your system alive under surging request loads.

## Features

- **Simulation Stages** — Progress through scenario-based levels (e.g., "The Reddit Rush") with specific uptime and throughput goals
- **Interactive Topology Board** — Visual deployment blueprint with dynamic SVG connection pathways between infrastructure nodes
- **Real-Time Metrics Dashboard** — Live monitoring of uptime, traffic (req/s), average latency, budget balance, and operational costs
- **Infrastructure Components**:
  - **CDN Edge Cache** — Absorbs static file assets (40% load reduction), deploy for $500
  - **NGINX Load Balancer** — Routes incoming requests with round-robin algorithm, deploy for $300
  - **Auto-Scaling Web Servers** — Horizontal scaling (+$200 per server) and vertical upgrades (+$250)
  - **Redis In-Memory Cache** — Absorbs 80% of database read actions, deploy for $400
  - **Database Cluster** — Tiered upgrades (+$350) from SQLite to higher-capacity tiers
- **Sandbox Mode** — Manual traffic injection with a configurable slider (10–1500 req/s) and burst/storm buttons
- **Senior Architect Log** — Live diagnostic console with system advisories
- **Bottleneck Warning System** — Floating alert cards that slide in when infrastructure components are overloaded
- **Play / Pause / Reset Controls** — Full simulation lifecycle management
- **Sound Toggle** — Optional audio feedback

## Tech Stack

| Category | Technology |
|----------|------------|
| UI Framework | [Tailwind CSS](https://tailwindcss.com/) (CDN) |
| Fonts | [Google Fonts](https://fonts.google.com/) — Plus Jakarta Sans, Fira Code |
| Animations | Custom CSS keyframes (flow, pulse-glow, floating particles) |
| Graphics | Inline SVG icons and dynamic SVG connection pathways |
| Logic | Vanilla JavaScript (embedded in the HTML file) |

## Getting Started

1. Clone or download the repository
2. Open [`index.html`](index.html) in any modern web browser
3. Click **Run** to start the simulation
4. Purchase and deploy infrastructure components to handle increasing traffic

No build tools, dependencies, or server required — everything runs client-side.

## How to Play

1. **Start the simulation** by clicking the green **Run** button
2. Watch the **Senior Architect Log** for real-time diagnostics and recommendations
3. **Deploy components** by clicking locked nodes in the topology board (CDN, Load Balancer, Redis Cache)
4. **Scale servers** horizontally (add more servers) or vertically (upgrade existing ones)
5. **Upgrade the database** to increase its capacity limit
6. **Monitor metrics** — uptime, latency, traffic, budget, and ops cost — to keep the system stable
7. **Meet the scenario goal** (e.g., survive 45 seconds at 95% uptime) to clear the stage

## Project Structure

```
DevOps Challange/
├── index.html    # Complete application (HTML + CSS + JS)
└── README.md     # This file
```

## Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Safari, Edge). JavaScript must be enabled.