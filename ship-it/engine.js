/* Ship It — the simulation itself.
 *
 * Pure logic, no DOM. game.js drives it from the page, and tools/balance.mjs runs
 * it headless under node to check that every scenario is winnable but tight.
 * Everything that moves a number lives here, so the rules are in one place.
 */
(function (root) {
  "use strict";

  var BASE = 10;                 // points one average person delivers in a week
  var MAX_CONTRACTORS = 2;
  var CONTRACTOR_NAMES = ["Alex (contract)", "Mira (contract)", "Dev (contract)", "Sana (contract)"];

  var PACES = {
    // rework: the share of a tired week's output that turns out wrong and has to be redone
    steady: { label: "Sustainable", mult: 1,    morale: 4,   quality: 0,  rework: 0,    note: "Normal hours. Morale recovers." },
    push:   { label: "Push",        mult: 1.2,  morale: -7,  quality: -2, rework: 0.04, note: "Late evenings. +20% output." },
    crunch: { label: "Crunch",      mult: 1.45, morale: -16, quality: -6, rework: 0.12, note: "Weekends too. +45% output, some of it wrong." }
  };

  // ---------- small helpers ----------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rng(s) {                                  // mulberry32, state kept on the game
    s.rngState = (s.rngState + 0x6D2B79F5) | 0;
    var t = s.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(s, arr) { return arr[Math.floor(rng(s) * arr.length)]; }
  function wsById(s, id) { for (var i = 0; i < s.ws.length; i++) if (s.ws[i].id === id) return s.ws[i]; return null; }
  function remaining(w) { return Math.max(0, w.total - w.done); }
  function totalRemaining(s) { return s.ws.reduce(function (a, w) { return a + remaining(w); }, 0); }
  function active(s) { return s.team.filter(function (m) { return !m.gone; }); }
  function moraleFactor(m) { return 0.6 + 0.4 * (m / 100); }
  function payroll(s) { return active(s).reduce(function (a, m) { return a + m.rate; }, 0); }
  function burn(s) { return payroll(s) + s.sc.overhead; }
  function newbies(s) { return active(s).filter(function (m) { return m.worked < 2; }).length; }
  function mostRemaining(s) {
    return s.ws.slice().sort(function (a, b) { return remaining(b) - remaining(a); })[0];
  }
  function wsForRole(s, role) {
    var open = s.ws.filter(function (w) { return w.role === role && remaining(w) > 0; });
    return open[0] || s.ws.filter(function (w) { return w.role === role; })[0] || null;
  }
  function log(s, kind, text) { s.log.push({ week: s.week, kind: kind, text: text }); }

  // ---------- setup ----------
  function createGame(sc, opts) {
    opts = opts || {};
    var seed = opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0;
    var s = {
      sc: sc, seed: seed, rngState: seed,
      week: 1, deadline: sc.weeks, budget: sc.budget, spent: 0,
      morale: sc.morale || 75, quality: 75, sat: 70,
      weekMod: 0,
      ws: sc.workstreams.map(function (w) {
        return { id: w.id, name: w.name, role: w.role, total: w.points, done: 0 };
      }),
      features: sc.features.map(function (f) {
        return { id: f.id, name: f.name, ws: f.ws, points: f.points, value: f.value, status: "in" };
      }),
      team: sc.team.map(function (m, i) {
        return { id: "m" + i, name: m.name, role: m.role, rate: m.rate, speed: m.speed || BASE,
                 out: 0, worked: 99, contractor: false, gone: false };
      }),
      assign: {}, history: [], log: [], used: {}, usedCreep: {},
      flags: { spin: false, extended: false, funded: false, crunchWeeks: 0, pushWeeks: 0,
               lateHires: 0, hires: 0, kickoffCuts: 0, lateCuts: 0, demos: 0 },
      pending: null, over: null, started: false
    };
    s.features.forEach(function (f) { wsById(s, f.ws).total += f.points; });
    s.planned = s.ws.reduce(function (a, w) { return a + w.total; }, 0);
    autoAssign(s);
    return s;
  }

  // Everyone onto an unfinished stream of their own trade; if theirs is done, onto the biggest pile.
  function autoAssign(s) {
    active(s).forEach(function (m) {
      var cur = wsById(s, s.assign[m.id]);
      if (cur && remaining(cur) > 0 && cur.role === m.role) return;
      var own = wsForRole(s, m.role);
      s.assign[m.id] = (own && remaining(own) > 0 ? own : mostRemaining(s)).id;
    });
    return s.assign;
  }

  // Kickoff is the cheap time to cut: stakeholders expect negotiation before work starts.
  function cutFeature(s, fid, silent) {
    var f = s.features.filter(function (x) { return x.id === fid && x.status !== "cut"; })[0];
    if (!f) return false;
    var w = wsById(s, f.ws);
    w.total -= f.points;
    if (w.done > w.total) w.done = w.total;   // work already spent on it is simply lost
    var cost = s.started ? f.value * 2 : f.value;
    f.status = "cut";
    if (!silent) {
      s.sat = clamp(s.sat - cost, 0, 100);
      if (s.started) s.flags.lateCuts++; else s.flags.kickoffCuts++;
      log(s, "cut", "Cut “" + f.name + "” from scope (stakeholders −" + cost + ").");
    }
    return true;
  }
  function restoreFeature(s, fid) {           // only before kickoff
    var f = s.features.filter(function (x) { return x.id === fid && x.status === "cut"; })[0];
    if (!f || s.started) return false;
    wsById(s, f.ws).total += f.points;
    f.status = "in";
    return true;
  }
  function kickoff(s) {
    var cuts = s.features.filter(function (f) { return f.status === "cut"; });
    cuts.forEach(function (f) { s.sat = clamp(s.sat - f.value, 0, 100); s.flags.kickoffCuts++; });
    s.started = true;
    s.history.push({ week: 0, remaining: totalRemaining(s), spent: 0 });
    log(s, "start", "Kickoff. " + (cuts.length ? "Descoped " + cuts.map(function (f) { return "“" + f.name + "”"; }).join(", ") + " up front." : "Full scope accepted."));
    autoAssign(s);
  }

  // ---------- moves ----------
  function contractorRate(s, role) {
    var same = s.team.filter(function (m) { return m.role === role && !m.contractor; });
    var pool = same.length ? same : s.team;
    var avg = pool.reduce(function (a, m) { return a + m.rate; }, 0) / pool.length;
    return Math.round(avg * 1.5 / 50) * 50;
  }
  function moveOptions(s) {
    var contractors = active(s).filter(function (m) { return m.contractor; });
    var roles = [];
    s.ws.forEach(function (w) { if (roles.indexOf(w.role) < 0) roles.push(w.role); });
    return {
      none: { ok: true },
      hire: { ok: contractors.length < MAX_CONTRACTORS, roles: roles.map(function (r) { return { role: r, rate: contractorRate(s, r) }; }) },
      release: { ok: contractors.length > 0, who: contractors },
      teambuild: { ok: true, cost: Math.round(s.sc.overhead * 1.5 / 50) * 50 },
      demo: { ok: true },
      quality: { ok: true },
      cut: { ok: s.features.some(function (f) { return f.status === "in"; }),
             features: s.features.filter(function (f) { return f.status === "in"; }) },
      extend: { ok: !s.flags.extended && !s.sc.fixedDeadline },
      fund: { ok: !s.flags.funded, amount: Math.round(s.budget * 0.15 / 500) * 500 }
    };
  }
  function moveMult(move) {
    return { teambuild: 0.9, demo: 0.85, quality: 0.75 }[move && move.type] || 1;
  }

  // ---------- one week ----------
  function memberOutput(s, m, pace, mult) {
    if (m.gone || m.out > 0) return 0;
    var w = wsById(s, s.assign[m.id]);
    if (!w) return 0;
    var match = w.role === m.role ? 1 : 0.5;
    var ramp = m.worked === 0 ? 0.35 : m.worked === 1 ? 0.7 : 1;
    // Brooks's law: every newcomer still learning the ropes slows the people teaching them.
    var drag = m.worked < 2 ? 1 : Math.max(0.7, 1 - 0.08 * newbies(s));
    return m.speed * match * moraleFactor(s.morale) * PACES[pace].mult * ramp * drag * (1 + s.weekMod) * mult;
  }

  // What this plan would deliver, without changing anything. The page shows it live.
  function project(s, plan) {
    var saved = s.assign; s.assign = plan.assign || s.assign;
    var mult = moveMult(plan.move);
    var raw = {}, per = {};
    active(s).forEach(function (m) {
      var out = memberOutput(s, m, plan.pace || "steady", mult);
      per[m.id] = out;
      var id = s.assign[m.id];
      raw[id] = (raw[id] || 0) + out;
    });
    s.assign = saved;
    var keep = 1 - PACES[plan.pace || "steady"].rework;
    var byWs = {}, waste = 0, total = 0;
    s.ws.forEach(function (w) {
      var r = (raw[w.id] || 0) * keep, got = Math.min(r, remaining(w));
      byWs[w.id] = got; waste += r - got; total += got;
    });
    return { byWs: byWs, perMember: per, waste: waste, total: total };
  }

  function applyMove(s, move) {
    if (!move || move.type === "none") return 0;
    var o = moveOptions(s)[move.type];
    if (!o || !o.ok) return 0;
    var cost = 0;
    switch (move.type) {
      case "hire": {
        var rate = contractorRate(s, move.role);
        var name = CONTRACTOR_NAMES[s.flags.hires % CONTRACTOR_NAMES.length];
        var m = { id: "c" + s.flags.hires, name: name, role: move.role, rate: rate, speed: BASE,
                  out: 0, worked: 0, contractor: true, gone: false };
        s.team.push(m);
        s.assign[m.id] = (wsForRole(s, move.role) || mostRemaining(s)).id;
        s.flags.hires++;
        if (s.week > s.deadline * 0.6) s.flags.lateHires++;
        cost = rate;   // agency signing fee
        log(s, "move", "Hired " + name + " (" + move.role + ", $" + rate + "/wk + fee).");
        break;
      }
      case "release": {
        var c = s.team.filter(function (x) { return x.id === move.who; })[0];
        if (c) { c.gone = true; log(s, "move", "Released " + c.name + "."); }
        break;
      }
      case "teambuild":
        cost = o.cost; s.morale = clamp(s.morale + 15, 0, 100);
        log(s, "move", "Team day out (+15 morale).");
        break;
      case "demo":
        s.sat = clamp(s.sat + 10, 0, 100); s.flags.demos++;
        if (s.flags.spin) { s.flags.spin = false; s.sat = clamp(s.sat - 8, 0, 100); log(s, "move", "Honest demo — walked back the earlier spin (net +2 stakeholders)."); }
        else log(s, "move", "Stakeholder demo (+10 stakeholders).");
        break;
      case "quality":
        s.quality = clamp(s.quality + 10, 0, 100);
        log(s, "move", "Quality sprint: reviews and tests (+10 quality).");
        break;
      case "cut":
        cutFeature(s, move.feature);
        break;
      case "extend":
        s.deadline += 2; s.flags.extended = true; s.sat = clamp(s.sat - 15, 0, 100);
        log(s, "move", "Renegotiated the deadline: +2 weeks (stakeholders −15).");
        break;
      case "fund":
        s.budget += o.amount; s.flags.funded = true; s.sat = clamp(s.sat - 12, 0, 100);
        log(s, "move", "Asked for more budget: +$" + o.amount.toLocaleString() + " (stakeholders −12).");
        break;
    }
    return cost;
  }

  function runWeek(s, plan) {
    if (s.over || s.pending) return null;
    s.assign = plan.assign || s.assign;
    var pace = PACES[plan.pace] ? plan.pace : "steady";
    var moveCost = applyMove(s, plan.move);
    var proj = project(s, { assign: s.assign, pace: pace, move: plan.move });
    s.ws.forEach(function (w) { w.done = Math.min(w.total, w.done + proj.byWs[w.id]); });

    var cost = burn(s) + moveCost;
    s.spent += cost;
    s.morale = clamp(s.morale + PACES[pace].morale, 0, 100);
    s.quality = clamp(s.quality + PACES[pace].quality, 0, 100);
    if (pace === "crunch") s.flags.crunchWeeks++;
    if (pace === "push") s.flags.pushWeeks++;
    active(s).forEach(function (m) { if (m.out > 0) m.out--; else m.worked++; });
    s.weekMod = 0;

    var f = forecast(s);
    if (s.week > s.deadline) s.sat = clamp(s.sat - 6, 0, 100);
    else if (f.eta > s.deadline) s.sat = clamp(s.sat - 1, 0, 100);

    var report = { week: s.week, delivered: proj.total, byWs: proj.byWs, waste: proj.waste, cost: cost, pace: pace };
    s.history.push({ week: s.week, remaining: totalRemaining(s), spent: s.spent, delivered: proj.total });
    log(s, "week", "Week " + s.week + ": delivered " + Math.round(proj.total) + " pts, spent $" + Math.round(cost).toLocaleString() + " (" + PACES[pace].label.toLowerCase() + ").");
    s.week++;

    checkOver(s);
    if (!s.over) s.pending = drawEvent(s);
    report.event = s.pending;
    return report;
  }

  function checkOver(s) {
    var used = s.week - 1;
    if (totalRemaining(s) <= 0.001) return finish(s, "shipped");
    if (s.sat <= 0) return finish(s, "replaced");
    if (s.spent > s.budget * 1.25) return finish(s, "budget");
    if (used >= Math.ceil(s.deadline * 1.5)) return finish(s, "timeline");
    return null;
  }
  function canShipEarly(s) { return progress(s) >= 0.7 && !s.over && !s.pending; }
  function shipNow(s) { if (canShipEarly(s)) finish(s, "early"); return s.over; }
  function finish(s, reason) {
    s.over = { reason: reason, week: s.week - 1 };
    s.score = score(s);
    return s.over;
  }

  // ---------- reading the state ----------
  function progress(s) {
    var tot = s.ws.reduce(function (a, w) { return a + w.total; }, 0);
    var done = s.ws.reduce(function (a, w) { return a + Math.min(w.done, w.total); }, 0);
    return tot ? done / tot : 1;
  }
  function forecast(s) {
    var h = s.history.filter(function (x) { return x.week > 0; }).slice(-2);
    var velocity = h.length ? h.reduce(function (a, x) { return a + x.delivered; }, 0) / h.length
                            : project(s, { assign: s.assign, pace: "steady" }).total;
    var rem = totalRemaining(s);
    var need = rem <= 0 ? 0 : velocity > 0 ? Math.ceil(rem / velocity) : 99;
    var used = s.week - 1;
    return {
      velocity: velocity, remaining: rem, weeksNeeded: need, eta: used + need,
      eac: s.spent + need * burn(s), burn: burn(s),
      onTime: used + need <= s.deadline, onBudget: s.spent + need * burn(s) <= s.budget
    };
  }

  // ---------- events ----------
  // fx grammar (all optional):
  //   burn: n        cost n × one week's burn        morale / quality / sat: ±n
  //   work: {to, n}  add n person-weeks of work       save: {to, n} remove n person-weeks
  //                  to = "most" | "role:<role>" | "creep" | "member" (the named person's stream)
  //   out: n         the named person is away n weeks  quit: true   they leave for good
  //   raise: r       the named person's rate × (1+r)   replace: true  a new hire takes their seat
  //   weekMod: ±r    next week's output               deadline: ±n   budgetPct: ±n
  //   addCreep: true accept the requested feature      spin: true     demo painted rosier than truth
  var EVENTS = [
    { id: "creep", title: "“Can we just add…”", weight: 3,
      can: function (s, ev) { return !!ev.creep; },
      body: "{client} wants {creepName} added before launch. It is roughly {creepWeeks} person-weeks of work.",
      choices: [
        { label: "Accept it", detail: "Stakeholders love it. The plan grows.", fx: { addCreep: true, sat: 8 } },
        { label: "Trade it for something else", detail: "Swap it for a smaller feature still in scope.", fx: { addCreep: true, cutSmallest: true, sat: 2 }, can: "hasFeature" },
        { label: "Say no, politely", detail: "Protect the plan. They won't enjoy hearing it.", fx: { sat: -9 } }
      ] },
    { id: "sick", title: "{member} is out sick", weight: 2,
      body: "{member} has dengue. The doctor says two weeks, minimum.",
      choices: [
        { label: "Let them recover", detail: "Two weeks without {member}.", fx: { out: 2, morale: 2 } },
        { label: "Bring in a temp for their work", detail: "Costs money, keeps the stream moving.", fx: { out: 2, burn: 0.35, save: { to: "member", n: 1.2 } } },
        { label: "Ask them to work from bed", detail: "One week out, and everyone notices how you asked.", fx: { out: 1, morale: -8 } }
      ] },
    { id: "bug", title: "A nasty problem surfaces", weight: 2,
      body: "{bug} Nobody saw it coming, and it is not small.",
      choices: [
        { label: "Fix it properly", detail: "Adds work, protects quality.", fx: { work: { to: "most", n: 1.5 }, quality: 3 } },
        { label: "Patch around it", detail: "Cheap now. Quality takes the hit.", fx: { work: { to: "most", n: 0.4 }, quality: -12 } },
        { label: "Weekend fix with the team", detail: "Solved fast, and they remember the weekend.", fx: { work: { to: "most", n: 0.7 }, morale: -10 } }
      ] },
    { id: "vendor", title: "{vendor} raises prices", weight: 1,
      body: "{vendor} has increased its rate mid-contract.",
      choices: [
        { label: "Pay the difference", detail: "Money solves this one.", fx: { burn: 0.45 } },
        { label: "Switch to an alternative", detail: "No new cost, but somebody has to redo the integration.", fx: { work: { to: "most", n: 1.2 }, quality: -3 } }
      ] },
    { id: "status", title: "The sponsor asks for a status update", weight: 2,
      body: "{client} wants a status update in tomorrow's leadership meeting. You are {etaText}.",
      choices: [
        { label: "Share the real numbers", detail: "Trust now, even if it stings.", fx: { satIfOnTime: 6, satIfLate: -4 } },
        { label: "Show only the good parts", detail: "Everyone leaves happy. For now.", fx: { sat: 8, spin: true } }
      ] },
    { id: "conflict", title: "Friction on the team", weight: 1,
      can: function (s) { return active(s).length >= 3; },
      body: "{member} and a teammate have stopped talking to each other in stand-ups.",
      choices: [
        { label: "Sit them down together", detail: "Costs a slow week, clears the air.", fx: { weekMod: -0.15, morale: 8 } },
        { label: "Let it sort itself out", detail: "It usually doesn't.", fx: { morale: -12 } }
      ] },
    { id: "cut", title: "Finance wants a cut", weight: 1,
      body: "The finance team is trimming every project's remaining budget.",
      choices: [
        { label: "Accept the cut", detail: "Budget −8%.", fx: { budgetPct: -8 } },
        { label: "Push back hard", detail: "Keep most of it; spend political capital.", fx: { budgetPct: -3, sat: -8 } }
      ] },
    { id: "resign", title: "{member} hands in their notice", weight: 1,
      can: function (s) { return s.morale < 55; },
      body: "{member} got an offer elsewhere. Long hours were mentioned.",
      choices: [
        { label: "Counter-offer", detail: "They stay at a 30% raise.", fx: { raise: 0.3, morale: 3 } },
        { label: "Hire a replacement", detail: "New person, same seat. They need time to ramp up.", fx: { replace: true, burn: 0.3 } },
        { label: "Let them go", detail: "The team absorbs the work.", fx: { quit: true, morale: -6 } }
      ] },
    { id: "ambiguity", title: "Two people read the spec two ways", weight: 1,
      body: "The team and {client} disagree about what one core requirement actually means.",
      choices: [
        { label: "Run a clarification workshop", detail: "Loses a little time, everyone aligned.", fx: { weekMod: -0.15, quality: 5, sat: 4 } },
        { label: "Go with the team's reading", detail: "Keep moving. Some of it will be rework.", fx: { work: { to: "most", n: 1.3 } } }
      ] },
    { id: "reuse", title: "Someone found a shortcut", weight: 1,
      body: "{member} found {shortcut}. It would save real work.",
      choices: [
        { label: "Adopt it", detail: "Costs a little, saves a lot.", fx: { burn: 0.25, save: { to: "member", n: 2 } } },
        { label: "Stay the course", detail: "Unknowns are risk too.", fx: {} }
      ] },
    { id: "holiday", title: "Eid is next week", weight: 1,
      body: "Half the team has bus tickets home already.",
      choices: [
        { label: "Give everyone the week", detail: "Half a week of output, a much happier team.", fx: { weekMod: -0.5, morale: 15 } },
        { label: "Keep a skeleton crew", detail: "A quarter lost, and some resentment.", fx: { weekMod: -0.25, morale: -4 } },
        { label: "Business as usual", detail: "Full output. Nobody forgets this.", fx: { morale: -16 } }
      ] },
    { id: "poach", title: "Leadership wants to borrow {member}", weight: 1,
      body: "Another project is on fire and its director wants {member} for two weeks.",
      choices: [
        { label: "Lend them", detail: "Goodwill upstairs, two weeks without them.", fx: { out: 2, sat: 8 } },
        { label: "Refuse", detail: "Keep your team, lose a little favour.", fx: { sat: -7 } }
      ] }
  ];

  function allEvents(s) { return EVENTS.concat(s.sc.specials || []); }

  function drawEvent(s) {
    if (s.week <= 2) return null;
    var forced = s.morale < 30 && !s.used.resign && rng(s) < 0.6;
    if (!forced && rng(s) > 0.55) return null;
    var ev = instantiate(s);
    var pool = allEvents(s).filter(function (e) {
      return !s.used[e.id] && (!e.can || e.can(s, ev)) && (!forced || e.id === "resign");
    });
    if (!pool.length) return null;
    var tot = pool.reduce(function (a, e) { return a + (e.weight || 1); }, 0), r = rng(s) * tot, def = pool[0];
    for (var i = 0; i < pool.length; i++) { r -= pool[i].weight || 1; if (r <= 0) { def = pool[i]; break; } }
    s.used[def.id] = true;
    ev.id = def.id;
    ev.title = fill(def.title, ev);
    ev.body = fill(def.body, ev);
    ev.choices = def.choices.map(function (c) {
      return { label: fill(c.label, ev), detail: fill(c.detail, ev), fx: c.fx,
               ok: c.can !== "hasFeature" || s.features.some(function (f) { return f.status === "in"; }) };
    });
    return ev;
  }
  function instantiate(s) {
    var staff = active(s).filter(function (m) { return !m.contractor && m.out === 0; });
    var member = staff.length ? pick(s, staff) : active(s)[0];
    var creeps = (s.sc.creep || []).filter(function (c) { return !s.usedCreep[c.name]; });
    var creep = creeps.length ? pick(s, creeps) : null;
    var f = forecast(s);
    var ctx = s.sc.ctx || {};
    return {
      member: member && member.id, memberName: member ? member.name : "Someone",
      creep: creep, client: ctx.client || "The sponsor", vendor: ctx.vendor || "A key vendor",
      bug: ctx.bug || "A serious defect turned up in testing.", shortcut: ctx.shortcut || "an existing component that does most of the job",
      etaText: f.eta <= s.deadline ? "on track for week " + f.eta + " of " + s.deadline : "forecasting week " + f.eta + " against a week " + s.deadline + " deadline"
    };
  }
  function fill(t, ev) {
    return String(t || "")
      .replace(/\{member\}/g, ev.memberName).replace(/\{client\}/g, ev.client).replace(/\{vendor\}/g, ev.vendor)
      .replace(/\{bug\}/g, ev.bug).replace(/\{shortcut\}/g, ev.shortcut).replace(/\{etaText\}/g, ev.etaText)
      .replace(/\{creepName\}/g, ev.creep ? "“" + ev.creep.name + "”" : "")
      .replace(/\{creepWeeks\}/g, ev.creep ? Math.round(ev.creep.points / BASE * 10) / 10 : "");
  }
  function target(s, to, ev) {
    if (to === "creep" && ev.creep) return wsById(s, ev.creep.ws);
    if (to === "member") { var w = wsById(s, s.assign[ev.member]); if (w && remaining(w) > 0) return w; }
    if (to && to.indexOf("role:") === 0) { var r = wsForRole(s, to.slice(5)); if (r) return r; }
    return mostRemaining(s);
  }

  function resolve(s, idx) {
    var ev = s.pending;
    if (!ev) return;
    var c = ev.choices[idx];
    if (!c || c.ok === false) return;
    var fx = c.fx || {};
    var m = s.team.filter(function (x) { return x.id === ev.member; })[0];
    var before = { sat: s.sat, morale: s.morale, quality: s.quality };
    if (fx.burn) s.spent += Math.round(fx.burn * burn(s));
    if (fx.morale) s.morale = clamp(s.morale + fx.morale, 0, 100);
    if (fx.quality) s.quality = clamp(s.quality + fx.quality, 0, 100);
    if (fx.sat) s.sat = clamp(s.sat + fx.sat, 0, 100);
    if (fx.satIfOnTime || fx.satIfLate) s.sat = clamp(s.sat + (forecast(s).onTime ? fx.satIfOnTime : fx.satIfLate), 0, 100);
    if (fx.work) { var w = target(s, fx.work.to, ev); w.total += fx.work.n * BASE; }
    if (fx.save) { var t = target(s, fx.save.to, ev); t.done = Math.min(t.total, t.done + fx.save.n * BASE); }
    if (fx.weekMod) s.weekMod += fx.weekMod;
    if (fx.deadline) s.deadline += fx.deadline;
    if (fx.budgetPct) s.budget = Math.round(s.budget * (1 + fx.budgetPct / 100));
    if (fx.spin) s.flags.spin = true;
    if (fx.cutSmallest) {
      var inScope = s.features.filter(function (x) { return x.status === "in"; }).sort(function (a, b) { return a.points - b.points; });
      if (inScope[0]) {
        cutFeature(s, inScope[0].id, true);
        log(s, "cut", "Traded away “" + inScope[0].name + "”.");
      }
    }
    if (fx.addCreep && ev.creep) {
      s.usedCreep[ev.creep.name] = true;
      s.features.push({ id: "creep" + s.features.length, name: ev.creep.name, ws: ev.creep.ws, points: ev.creep.points, value: ev.creep.value || 5, status: "added" });
      wsById(s, ev.creep.ws).total += ev.creep.points;
    }
    if (m) {
      if (fx.out) m.out = Math.max(m.out, fx.out);
      if (fx.raise) m.rate = Math.round(m.rate * (1 + fx.raise));
      if (fx.quit || fx.replace) m.gone = true;
      if (fx.replace) {
        var n = { id: m.id + "r", name: "New " + m.role + " hire", role: m.role, rate: Math.round(m.rate * 1.1),
                  speed: BASE, out: 0, worked: 0, contractor: false, gone: false };
        s.team.push(n); s.assign[n.id] = s.assign[m.id];
      }
    }
    log(s, "event", ev.title + " → " + c.label + ".");
    s.pending = null;
    ev.resolved = { choice: c.label, dSat: s.sat - before.sat, dMorale: s.morale - before.morale, dQuality: s.quality - before.quality };
    checkOver(s);
    return ev;
  }

  // ---------- the verdict ----------
  function score(s) {
    var used = s.over ? s.over.week : s.week - 1;
    var late = Math.max(0, used - s.deadline);
    var overPct = Math.max(0, (s.spent - s.budget) / s.budget * 100);
    var delivered = s.ws.reduce(function (a, w) { return a + Math.min(w.done, w.total); }, 0);
    var shippedIncomplete = totalRemaining(s) > 0.001;

    // Shipping day settles accounts with the sponsor.
    var sat = s.sat;
    if (s.flags.spin && late > 0) sat -= 15;                     // the rosy demo comes due
    if (s.quality < 50) sat -= 10;
    if (shippedIncomplete && s.over && s.over.reason === "early") sat -= Math.round(totalRemaining(s) / s.planned * 40);
    sat = clamp(sat, 0, 100);

    var parts = {
      schedule: clamp(100 - late * 20, 0, 100),
      budget: clamp(Math.round(100 - overPct * 5), 0, 100),
      scope: clamp(Math.round(delivered / s.planned * 100), 0, 100),
      quality: Math.round(s.quality),
      stakeholders: Math.round(sat)
    };
    var total = Math.round((parts.schedule + parts.budget + parts.scope + parts.quality + parts.stakeholders) / 5);
    var failed = s.over && ["replaced", "budget", "timeline"].indexOf(s.over.reason) >= 0;
    if (failed) total = Math.min(total, 30);
    var grade = failed ? "F" : total >= 90 ? "S" : total >= 80 ? "A" : total >= 66 ? "B" : total >= 50 ? "C" : "F";
    return { parts: parts, total: total, grade: grade, late: late, overPct: overPct, used: used,
             spent: s.spent, delivered: delivered, failed: failed };
  }

  // One or two lessons, tied to what actually happened in this run.
  function lessons(s) {
    var sc = s.score || score(s), out = [];
    var p = sc.parts;
    if (s.flags.lateHires && sc.late > 0) out.push({ t: "Brooks's law", d: "You added people late and still slipped. New hires need onboarding, and the people teaching them slow down too — adding manpower to a late project makes it later." });
    if (s.flags.crunchWeeks >= 3) out.push({ t: "Crunch is a loan", d: "You crunched " + s.flags.crunchWeeks + " weeks. The output was real, but so were the morale and quality it borrowed from. Sustainable pace is a delivery strategy, not a kindness." });
    if (s.flags.spin && sc.late > 0) out.push({ t: "Watermelon status", d: "Green on the outside, red inside. The rosy update bought a good meeting and cost you the sponsor's trust when the truth landed." });
    if (s.flags.lateCuts > s.flags.kickoffCuts && s.flags.lateCuts > 0) out.push({ t: "Cut early, cut cheap", d: "Descoping mid-project cost twice what it would have at kickoff, and any work already done on those features was thrown away." });
    var worst = Object.keys(p).sort(function (a, b) { return p[a] - p[b]; })[0];
    var byDim = {
      schedule: { t: "Watch the burndown, not the calendar", d: "The forecast told you the finish date weeks before it arrived. The time to act on a slipping schedule is when velocity first drops, not in the final week." },
      budget: { t: "Burn rate is a decision", d: "Every week the team exists costs the same whether it delivers or not. Contractors and overruns compound — track estimate-at-completion, not just money spent." },
      scope: { t: "Scope is the release valve", d: "Of the iron triangle — scope, time, cost — scope is usually the cheapest to flex, if you negotiate it early and openly." },
      quality: { t: "Quality is the hidden fourth corner", d: "Patches and crunch hit a number the sponsor can't see on day one. They see it after launch, and so do your users." },
      stakeholders: { t: "Manage the people, not just the plan", d: "Stakeholders forgive bad news delivered early far more readily than surprises delivered late. Demos and honest status are cheap insurance." }
    };
    if (out.length < 2) out.push(byDim[worst]);
    return out.slice(0, 3);
  }

  root.ShipIt = {
    BASE: BASE, PACES: PACES,
    createGame: createGame, autoAssign: autoAssign, cutFeature: cutFeature, restoreFeature: restoreFeature, kickoff: kickoff,
    moveOptions: moveOptions, project: project, runWeek: runWeek, resolve: resolve,
    forecast: forecast, progress: progress, canShipEarly: canShipEarly, shipNow: shipNow,
    score: score, lessons: lessons, remaining: remaining, burn: burn, active: active
  };
})(typeof window !== "undefined" ? window : globalThis);
