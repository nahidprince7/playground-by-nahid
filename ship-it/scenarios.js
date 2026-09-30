/* Ship It — the scenario pool.
 *
 * The pick screen deals five of these at random. Each one is a whole project:
 * its money, its clock, its people and the work. docs/scenario-schema.md is the
 * full contract; run `node tools/balance.mjs` after editing to check the numbers.
 *
 * Units: rates and budgets are dollars per week / in total. Work is in points —
 * one average person delivers 10 points in a normal week in their own trade.
 */
window.SHIPIT_SCENARIOS = [
  {
    id: "eid-sale", title: "Eid Flash Sale", kicker: "E-commerce launch", difficulty: 3,
    summary: "A 72-hour Eid sale on a fashion marketplace. Checkout must survive ten times normal traffic, and the campaign goes live whether the site is ready or not.",
    goal: "Launch the sale site, payments and campaign before Chand Raat.",
    weeks: 8, budget: 60000, overhead: 800, morale: 75,
    team: [
      { name: "Tania", role: "design", rate: 1300, speed: 10 },
      { name: "Rafi", role: "dev", rate: 1500, speed: 12 },
      { name: "Sadia", role: "dev", rate: 1400, speed: 10 },
      { name: "Imran", role: "qa", rate: 1000, speed: 9 },
      { name: "Nusrat", role: "marketing", rate: 1000, speed: 10 }
    ],
    workstreams: [
      { id: "ux", name: "Storefront design", role: "design", points: 40 },
      { id: "checkout", name: "Checkout & payments", role: "dev", points: 80 },
      { id: "inventory", name: "Inventory sync", role: "dev", points: 40 },
      { id: "load", name: "Load & payment testing", role: "qa", points: 60 },
      { id: "campaign", name: "Sale campaign", role: "marketing", points: 45 }
    ],
    features: [
      { id: "wishlist", name: "Wishlist", ws: "checkout", points: 15, value: 5 },
      { id: "tracking", name: "Live order tracking", ws: "inventory", points: 20, value: 7 },
      { id: "influencer", name: "Influencer videos", ws: "campaign", points: 15, value: 5 },
      { id: "dark", name: "Dark mode", ws: "ux", points: 10, value: 3 }
    ],
    ctx: { client: "The marketing director", vendor: "The payment gateway", bug: "Stock counts go negative when two people buy the last item at once.", shortcut: "an open-source cart module the team already knows" },
    creep: [
      { name: "bKash one-tap pay", ws: "checkout", points: 20, value: 8 },
      { name: "Countdown banner on every page", ws: "ux", points: 10, value: 4 }
    ],
    specials: [
      { id: "eid-competitor", title: "A rival announces the same dates", weight: 1,
        body: "The biggest competitor just announced its own Eid sale — two days before yours.",
        choices: [
          { label: "Move the launch up two days", detail: "Beat them to it. The deadline shrinks.", fx: { deadline: -1, sat: 10 } },
          { label: "Out-market them", detail: "Spend more on ads, keep the date.", fx: { burn: 0.6, work: { to: "role:marketing", n: 1 } } },
          { label: "Hold your nerve", detail: "Your customers aren't theirs.", fx: { sat: -5 } }
        ] }
    ]
  },

  {
    id: "bank-app", title: "Mobile Banking App v1", kicker: "Fintech product", difficulty: 4,
    summary: "A mid-size bank wants its first real mobile app. Money moves through it, so security testing and regulatory approval are not optional extras.",
    goal: "Ship a secure app with central-bank approval in hand.",
    weeks: 12, budget: 132000, overhead: 1500, morale: 70,
    team: [
      { name: "Mehedi", role: "design", rate: 1400, speed: 10 },
      { name: "Farhan", role: "dev", rate: 1800, speed: 12 },
      { name: "Lamia", role: "dev", rate: 1700, speed: 11 },
      { name: "Arif", role: "dev", rate: 1300, speed: 9 },
      { name: "Rumana", role: "qa", rate: 1200, speed: 10 },
      { name: "Kabir", role: "compliance", rate: 1600, speed: 8 }
    ],
    workstreams: [
      { id: "ux", name: "App UX", role: "design", points: 75 },
      { id: "core", name: "Core banking API", role: "dev", points: 165 },
      { id: "screens", name: "App screens", role: "dev", points: 135 },
      { id: "sec", name: "Security testing", role: "qa", points: 100 },
      { id: "approval", name: "Regulatory approval", role: "compliance", points: 75 }
    ],
    features: [
      { id: "bills", name: "Bill payments", ws: "screens", points: 35, value: 9 },
      { id: "finger", name: "Fingerprint login", ws: "screens", points: 15, value: 6 },
      { id: "a11y", name: "Accessibility audit", ws: "ux", points: 15, value: 4 }
    ],
    ctx: { client: "The bank's CTO", vendor: "The core-banking vendor", bug: "A penetration test found session tokens that never expire.", shortcut: "the bank's existing OTP service, already certified" },
    creep: [
      { name: "QR merchant payments", ws: "core", points: 30, value: 9 },
      { name: "Bangla language toggle", ws: "screens", points: 15, value: 6 }
    ],
    specials: [
      { id: "bank-regulator", title: "The regulator issues a new circular", weight: 1,
        body: "A fresh central-bank circular changes the KYC rules for app onboarding.",
        choices: [
          { label: "Comply fully now", detail: "More compliance work, zero risk.", fx: { work: { to: "role:compliance", n: 2 }, quality: 4 } },
          { label: "Ask for a waiver period", detail: "Less work, and the CTO has to make a call upstairs.", fx: { work: { to: "role:compliance", n: 0.6 }, sat: -8 } }
        ] }
    ]
  },

  {
    id: "hospital", title: "Hospital Records Migration", kicker: "Data migration", difficulty: 4,
    summary: "Twenty years of patient records move from a failing on-premise system to a new one. A wrong blood group is not a bug report — it is a patient at risk.",
    goal: "Migrate every record, prove it reconciles, and train the staff.",
    weeks: 10, budget: 78000, overhead: 900, morale: 72,
    team: [
      { name: "Shafiq", role: "data", rate: 1500, speed: 11 },
      { name: "Priya", role: "data", rate: 1300, speed: 9 },
      { name: "Tanvir", role: "dev", rate: 1400, speed: 10 },
      { name: "Mitu", role: "qa", rate: 1100, speed: 10 },
      { name: "Dr. Anwar", role: "training", rate: 1200, speed: 8 }
    ],
    workstreams: [
      { id: "mapping", name: "Data mapping", role: "data", points: 80 },
      { id: "scripts", name: "Migration scripts", role: "dev", points: 85 },
      { id: "recon", name: "Validation & reconciliation", role: "qa", points: 105 },
      { id: "training", name: "Staff training", role: "training", points: 65 }
    ],
    features: [
      { id: "xray", name: "Legacy X-ray archive", ws: "mapping", points: 25, value: 6 },
      { id: "portal", name: "Patient portal link", ws: "scripts", points: 15, value: 4 },
      { id: "night", name: "Night-shift training sessions", ws: "training", points: 10, value: 5 }
    ],
    ctx: { client: "The hospital director", vendor: "The new records-system vendor", bug: "3% of records have two different birth dates in the old system.", shortcut: "a reconciliation tool from the vendor's last migration" },
    creep: [
      { name: "Lab results history", ws: "mapping", points: 20, value: 7 },
      { name: "Doctor dashboard", ws: "scripts", points: 15, value: 5 }
    ],
    specials: [
      { id: "hosp-outage", title: "The old server is dying", weight: 1,
        body: "The legacy database server threw disk errors twice this week. It may not last until cutover.",
        choices: [
          { label: "Buy a replacement disk array", detail: "Money buys time.", fx: { burn: 0.5 } },
          { label: "Bring migration forward", detail: "Start moving data now, before it's ready.", fx: { quality: -10, save: { to: "role:data", n: 1 } } }
        ] }
    ]
  },

  {
    id: "mvp", title: "Startup MVP", kicker: "Zero to launch", difficulty: 2,
    summary: "Four people, six weeks, one seed cheque. Demo day is fixed; everything else is up for negotiation.",
    goal: "Get a working product in front of investors on demo day.",
    weeks: 6, budget: 25000, overhead: 400, morale: 85,
    team: [
      { name: "Nabila", role: "design", rate: 900, speed: 10 },
      { name: "Sami", role: "dev", rate: 1100, speed: 12 },
      { name: "Joy", role: "dev", rate: 800, speed: 9 },
      { name: "Rakib", role: "growth", rate: 700, speed: 9 }
    ],
    workstreams: [
      { id: "brand", name: "Brand & UI", role: "design", points: 35 },
      { id: "app", name: "Core app", role: "dev", points: 80 },
      { id: "landing", name: "Landing page & waitlist", role: "growth", points: 35 }
    ],
    features: [
      { id: "payments", name: "In-app payments", ws: "app", points: 15, value: 6 },
      { id: "admin", name: "Admin dashboard", ws: "app", points: 15, value: 3 },
      { id: "referral", name: "Referral programme", ws: "landing", points: 10, value: 5 }
    ],
    ctx: { client: "The lead investor", vendor: "The cloud provider", bug: "The signup flow silently drops every third user on Android.", shortcut: "a no-code tool that handles the whole admin side" },
    creep: [
      { name: "AI recommendations", ws: "app", points: 20, value: 8 },
      { name: "Pitch-deck animation", ws: "brand", points: 10, value: 4 }
    ],
    specials: [
      { id: "mvp-pivot", title: "The co-founder wants to pivot", weight: 1,
        body: "After three customer calls, one co-founder is convinced the product should target schools, not offices.",
        choices: [
          { label: "Pivot now", detail: "Big rework, but a sharper story for investors.", fx: { work: { to: "most", n: 2.5 }, sat: 12 } },
          { label: "Park it until after demo day", detail: "Ship what you planned.", fx: { morale: -5 } }
        ] }
    ]
  },

  {
    id: "wedding-expo", title: "Dhaka Wedding Expo", kicker: "Event management", difficulty: 3,
    summary: "A three-day expo with 120 vendor stalls, a fashion show and 15,000 visitors. The venue is booked; the date will not move.",
    goal: "Open the doors on day one with every stall filled and the stage ready.",
    weeks: 8, budget: 44000, overhead: 700, morale: 78,
    team: [
      { name: "Ayesha", role: "logistics", rate: 1000, speed: 11 },
      { name: "Babu", role: "logistics", rate: 800, speed: 9 },
      { name: "Sumon", role: "vendor", rate: 900, speed: 10 },
      { name: "Riya", role: "marketing", rate: 900, speed: 10 },
      { name: "Oishee", role: "design", rate: 850, speed: 9 }
    ],
    workstreams: [
      { id: "venue", name: "Venue & floor plan", role: "logistics", points: 65 },
      { id: "stalls", name: "Stalls & security", role: "logistics", points: 45 },
      { id: "vendors", name: "Vendor contracts", role: "vendor", points: 65 },
      { id: "tickets", name: "Ticketing & promotion", role: "marketing", points: 55 },
      { id: "stage", name: "Stage & décor", role: "design", points: 45 }
    ],
    features: [
      { id: "chef", name: "Celebrity chef show", ws: "vendors", points: 15, value: 7 },
      { id: "live", name: "Facebook live stream", ws: "tickets", points: 15, value: 5 },
      { id: "booth", name: "Photo booth", ws: "stage", points: 10, value: 3 }
    ],
    fixedDeadline: true,
    ctx: { client: "The organising committee", vendor: "The sound & lighting company", bug: "The fire marshal flagged the floor plan: two exits are blocked by stalls.", shortcut: "last year's vendor contracts, which only need new dates" },
    creep: [
      { name: "Bridal fashion show", ws: "stage", points: 15, value: 8 },
      { name: "VIP lounge", ws: "venue", points: 15, value: 5 }
    ],
    specials: [
      { id: "expo-hartal", title: "A strike is called for opening day", weight: 1,
        body: "A political strike has been announced for the expo's first day. Visitors may not come.",
        choices: [
          { label: "Add an online ticket refund promise", detail: "Protects sales, costs money.", fx: { burn: 0.5, sat: 6 } },
          { label: "Do nothing and hope it's called off", detail: "It sometimes is.", fx: { sat: -6 } }
        ] }
    ]
  },

  {
    id: "office-move", title: "Office Relocation", kicker: "Operations project", difficulty: 2,
    summary: "Two hundred staff move to a new building. The old lease ends on a fixed date, and every week of overlap costs rent on both.",
    goal: "Everyone at a working desk in the new office on Monday morning.",
    weeks: 6, budget: 38000, overhead: 1100, morale: 75,
    team: [
      { name: "Hasan", role: "facilities", rate: 1000, speed: 10 },
      { name: "Moni", role: "facilities", rate: 850, speed: 9 },
      { name: "Tushar", role: "it", rate: 1200, speed: 11 },
      { name: "Dipu", role: "it", rate: 950, speed: 9 },
      { name: "Lina", role: "comms", rate: 900, speed: 10 }
    ],
    workstreams: [
      { id: "layout", name: "Floor layout & furniture", role: "facilities", points: 55 },
      { id: "move", name: "Moving logistics", role: "facilities", points: 40 },
      { id: "network", name: "Network & servers", role: "it", points: 70 },
      { id: "comms", name: "Staff comms & seating plan", role: "comms", points: 35 }
    ],
    features: [
      { id: "crew", name: "Weekend move crew", ws: "move", points: 10, value: 4 },
      { id: "smart", name: "Smart meeting rooms", ws: "network", points: 15, value: 5 },
      { id: "welcome", name: "Welcome day", ws: "comms", points: 10, value: 4 }
    ],
    ctx: { client: "The COO", vendor: "The moving company", bug: "The new building's electrical riser can't power the server room.", shortcut: "the landlord's existing cabling, already certified" },
    creep: [
      { name: "Nursing room", ws: "layout", points: 10, value: 6 },
      { name: "Badge access for every floor", ws: "network", points: 15, value: 5 }
    ],
    specials: [
      { id: "office-landlord", title: "The landlord offers an early handover", weight: 1,
        body: "The new landlord can hand over the keys a week early — for an extra month's deposit.",
        choices: [
          { label: "Take the early keys", detail: "Costs money, gives the team a head start.", fx: { burn: 0.6, save: { to: "role:facilities", n: 1.5 } } },
          { label: "Stick to the schedule", detail: "No cost.", fx: {} }
        ] }
    ]
  },

  {
    id: "indie-game", title: "Indie Game Launch", kicker: "Game development", difficulty: 3,
    summary: "A small studio's first game has a Steam release date announced. There is no dedicated tester — someone will have to cover playtesting.",
    goal: "Release on Steam on the announced date with reviews worth reading.",
    weeks: 10, budget: 68000, overhead: 700, morale: 80,
    team: [
      { name: "Zara", role: "art", rate: 1100, speed: 10 },
      { name: "Nayeem", role: "art", rate: 900, speed: 8 },
      { name: "Omar", role: "dev", rate: 1400, speed: 12 },
      { name: "Tisha", role: "dev", rate: 1200, speed: 10 },
      { name: "Fahim", role: "audio", rate: 1000, speed: 9 }
    ],
    workstreams: [
      { id: "art", name: "Levels & art", role: "art", points: 120 },
      { id: "code", name: "Gameplay code", role: "dev", points: 140 },
      { id: "audio", name: "Soundtrack & SFX", role: "audio", points: 55 },
      { id: "play", name: "Playtesting & polish", role: "qa", points: 35 }
    ],
    features: [
      { id: "world", name: "Bonus world", ws: "art", points: 20, value: 6 },
      { id: "leader", name: "Online leaderboard", ws: "code", points: 20, value: 5 }
    ],
    ctx: { client: "The publisher", vendor: "The engine vendor", bug: "Save files corrupt if the game is closed during an autosave.", shortcut: "a physics plugin from the asset store that does exactly this" },
    creep: [
      { name: "Controller support", ws: "code", points: 15, value: 7 },
      { name: "Steam achievements", ws: "code", points: 15, value: 5 }
    ],
    specials: [
      { id: "game-streamer", title: "A big streamer wants an early build", weight: 1,
        body: "A streamer with two million followers wants to play a preview build next week.",
        choices: [
          { label: "Polish a demo build for them", detail: "Huge exposure, costs a week of focus.", fx: { weekMod: -0.3, sat: 14 } },
          { label: "Send the build as it is", detail: "Free exposure. Bugs and all, live on stream.", fx: { sat: 4, quality: -6 } },
          { label: "Politely decline", detail: "Stay focused.", fx: {} }
        ] }
    ]
  },

  {
    id: "tax-portal", title: "Government Tax Portal", kicker: "Public sector", difficulty: 5,
    summary: "The national e-filing portal must be live before tax season. Millions of citizens, an audit trail for every action, and a deadline written into law.",
    goal: "Launch e-filing that survives the last-day rush.",
    weeks: 14, budget: 175000, overhead: 1900, morale: 68,
    team: [
      { name: "Rashed", role: "design", rate: 1300, speed: 9 },
      { name: "Shila", role: "dev", rate: 1700, speed: 12 },
      { name: "Kamal", role: "dev", rate: 1500, speed: 10 },
      { name: "Pavel", role: "dev", rate: 1500, speed: 10 },
      { name: "Jui", role: "qa", rate: 1200, speed: 10 },
      { name: "Rony", role: "ops", rate: 1400, speed: 10 },
      { name: "Mr. Haque", role: "compliance", rate: 1500, speed: 7 }
    ],
    workstreams: [
      { id: "ux", name: "Citizen UX", role: "design", points: 90 },
      { id: "filing", name: "E-filing engine", role: "dev", points: 240 },
      { id: "pay", name: "Payment integration", role: "dev", points: 110 },
      { id: "load", name: "Load testing", role: "qa", points: 130 },
      { id: "infra", name: "Infrastructure & DR", role: "ops", points: 120 },
      { id: "audit", name: "Audit trail & legal", role: "compliance", points: 90 }
    ],
    features: [
      { id: "voice", name: "Bangla voice guide", ws: "ux", points: 15, value: 6 },
      { id: "wallet", name: "Mobile wallet payments", ws: "pay", points: 40, value: 8 }
    ],
    fixedDeadline: true,
    ctx: { client: "The Revenue Board chairman", vendor: "The data-centre contractor", bug: "The tax calculator rounds differently from the law in two income bands.", shortcut: "the national ID verification API another ministry already runs" },
    creep: [
      { name: "Pre-filled returns from employer data", ws: "filing", points: 40, value: 10 },
      { name: "SMS receipts", ws: "pay", points: 15, value: 5 }
    ],
    specials: [
      { id: "tax-minister", title: "The minister wants a launch ceremony", weight: 1,
        body: "The minister will inaugurate the portal live on TV — two weeks before your planned launch.",
        choices: [
          { label: "Build a ceremony-ready soft launch", detail: "Extra work, very happy chairman.", fx: { work: { to: "role:ops", n: 1.5 }, sat: 12 } },
          { label: "Explain the risk and decline", detail: "Correct, unpopular.", fx: { sat: -10 } }
        ] }
    ]
  },

  {
    id: "cloud", title: "Cloud Migration", kicker: "Infrastructure", difficulty: 3,
    summary: "A logistics company leaves its own data centre for the cloud. Until cutover you pay for both, so every week late is money burned twice.",
    goal: "Cut over every service to the cloud with zero data loss.",
    weeks: 9, budget: 76000, overhead: 1100, morale: 74,
    team: [
      { name: "Nafis", role: "ops", rate: 1600, speed: 12 },
      { name: "Rupa", role: "ops", rate: 1400, speed: 10 },
      { name: "Asif", role: "dev", rate: 1300, speed: 10 },
      { name: "Tuli", role: "qa", rate: 1100, speed: 9 },
      { name: "Sabbir", role: "security", rate: 1500, speed: 9 }
    ],
    workstreams: [
      { id: "zone", name: "Landing zone & network", role: "ops", points: 70 },
      { id: "services", name: "Service migration", role: "ops", points: 75 },
      { id: "refactor", name: "App refactoring", role: "dev", points: 65 },
      { id: "cutover", name: "Cutover rehearsal", role: "qa", points: 60 },
      { id: "harden", name: "Security hardening", role: "security", points: 55 }
    ],
    features: [
      { id: "k8s", name: "Move to Kubernetes", ws: "services", points: 25, value: 6 },
      { id: "serverless", name: "Serverless reports", ws: "refactor", points: 15, value: 4 },
      { id: "soc2", name: "SOC 2 evidence pack", ws: "harden", points: 15, value: 5 }
    ],
    ctx: { client: "The CIO", vendor: "The cloud provider", bug: "The order database replicates with an eight-minute lag under load.", shortcut: "a managed database service that replaces two self-run clusters" },
    creep: [
      { name: "Multi-region failover", ws: "zone", points: 25, value: 8 },
      { name: "Cost dashboard", ws: "refactor", points: 10, value: 4 }
    ],
    specials: [
      { id: "cloud-credits", title: "The provider offers migration credits", weight: 1,
        body: "The cloud provider will fund part of the migration — if you commit to a three-year contract.",
        choices: [
          { label: "Sign the commitment", detail: "Budget +10%, locked in.", fx: { budgetPct: 10, sat: -3 } },
          { label: "Stay flexible", detail: "No strings.", fx: {} }
        ] }
    ]
  },

  {
    id: "admissions", title: "University Admission Campaign", kicker: "Marketing campaign", difficulty: 2,
    summary: "A private university needs next year's intake. Applications open on a fixed date and the portal must take them from minute one.",
    goal: "Open applications with a campaign that fills the seats.",
    weeks: 7, budget: 37000, overhead: 800, morale: 76,
    team: [
      { name: "Maliha", role: "content", rate: 800, speed: 10 },
      { name: "Arnob", role: "design", rate: 900, speed: 10 },
      { name: "Sakib", role: "web", rate: 1000, speed: 11 },
      { name: "Puja", role: "marketing", rate: 850, speed: 10 },
      { name: "Rakin", role: "marketing", rate: 650, speed: 8 }
    ],
    workstreams: [
      { id: "pages", name: "Programme pages & copy", role: "content", points: 50 },
      { id: "visual", name: "Visual campaign", role: "design", points: 45 },
      { id: "portal", name: "Application portal", role: "web", points: 65 },
      { id: "ads", name: "Ads & school visits", role: "marketing", points: 85 }
    ],
    features: [
      { id: "alumni", name: "Alumni stories", ws: "pages", points: 15, value: 5 },
      { id: "video", name: "Campus video", ws: "visual", points: 15, value: 6 }
    ],
    ctx: { client: "The Vice-Chancellor", vendor: "The ad agency", bug: "The portal accepts applications without the required documents.", shortcut: "last year's programme copy, which only needs updating" },
    creep: [
      { name: "Scholarship calculator", ws: "portal", points: 15, value: 7 },
      { name: "Virtual campus tour", ws: "visual", points: 15, value: 6 }
    ],
    specials: [
      { id: "adm-ranking", title: "The university jumps in a ranking", weight: 1,
        body: "A national ranking just placed the university in the top ten. The VC wants it in every ad.",
        choices: [
          { label: "Redo the campaign around it", detail: "More work, stronger campaign.", fx: { work: { to: "role:design", n: 1.2 }, sat: 10 } },
          { label: "Add it to social posts only", detail: "Small tweak.", fx: { sat: 3 } }
        ] }
    ]
  }
];
