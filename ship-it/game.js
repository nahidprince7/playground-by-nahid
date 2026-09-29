/* Ship It — the page. Reads and renders; every rule lives in engine.js. */
(function () {
  "use strict";

  var E = window.ShipIt;
  var ALL = window.SHIPIT_SCENARIOS || [];
  var DEAL = 5;

  var dealt = [];
  var game = null;          // engine state
  var plan = null;          // this week's choices: { assign, pace, move }

  var $ = function (id) { return document.getElementById(id); };
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) {
    var a = Math.abs(n), sign = n < 0 ? "−" : "";
    return sign + "$" + (a >= 10000 ? (a / 1000).toFixed(a >= 100000 ? 0 : 1) + "k" : Math.round(a).toLocaleString());
  }
  function initials(name) { return name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(); }
  function diffDots(n) { var h = ""; for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= n ? "on" : "") + '"></i>'; return '<span class="diff" title="Difficulty ' + n + ' of 5">' + h + "</span>"; }
  function tone(v) { return v >= 65 ? "var(--good)" : v >= 40 ? "var(--warn)" : "var(--bad)"; }
  function show(name) {
    document.querySelectorAll(".screen").forEach(function (s) { s.hidden = s.dataset.screen !== name; });
    window.scrollTo(0, 0);
  }
  function toast(text) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2700);
  }

  // ---------------- 1. pick ----------------
  function deal() {
    var pool = ALL.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    dealt = pool.slice(0, DEAL);
    renderPick();
  }
  function renderPick() {
    $("deal-status").textContent = dealt.length + " projects need a manager";
    $("scn-grid").innerHTML = dealt.map(function (sc) {
      return '<button class="scn" data-id="' + esc(sc.id) + '">' +
        '<div class="scn-top"><span class="scn-kicker">' + esc(sc.kicker) + "</span>" + diffDots(sc.difficulty) + "</div>" +
        "<h2>" + esc(sc.title) + "</h2><p>" + esc(sc.summary) + "</p>" +
        '<div class="scn-stats">' +
          '<div class="scn-stat"><span class="label">Budget</span><b>' + money(sc.budget) + "</b></div>" +
          '<div class="scn-stat"><span class="label">Deadline</span><b>' + sc.weeks + " wk</b></div>" +
          '<div class="scn-stat"><span class="label">Team</span><b>' + sc.team.length + "</b></div>" +
        "</div></button>";
    }).join("");
    show("pick");
  }

  // ---------------- 2. charter ----------------
  function openCharter(sc) {
    game = E.createGame(sc);
    renderCharter();
    show("charter");
  }
  function renderCharter() {
    var s = game, sc = s.sc;
    var burn = E.burn(s);
    // Capacity per trade over the whole project, so under-staffed streams are visible up front.
    var cap = {};
    s.team.forEach(function (m) { cap[m.role] = (cap[m.role] || 0) + m.speed * sc.weeks; });
    var need = {};
    s.ws.forEach(function (w) { need[w.role] = (need[w.role] || 0) + w.total; });
    var cuts = s.features.filter(function (f) { return f.status === "cut"; });
    var satCost = cuts.reduce(function (a, f) { return a + f.value; }, 0);

    $("charter").innerHTML =
      '<p class="eyebrow">Project charter · ' + esc(sc.kicker) + "</p>" +
      "<h1>" + esc(sc.title) + "</h1>" +
      '<p class="hero-copy">' + esc(sc.summary) + "</p>" +
      '<p class="goal"><b>Definition of done:</b> ' + esc(sc.goal) + "</p>" +
      '<div class="stat-row">' +
        '<div class="stat"><span class="label">Budget</span><b>' + money(sc.budget) + "</b><small>overrun past 125% cancels the project</small></div>" +
        '<div class="stat"><span class="label">Deadline</span><b>' + sc.weeks + " weeks</b><small>" + (sc.fixedDeadline ? "fixed — cannot be renegotiated" : "can be renegotiated once") + "</small></div>" +
        '<div class="stat"><span class="label">Weekly burn</span><b>' + money(burn) + "</b><small>payroll + " + money(sc.overhead) + " overhead</small></div>" +
        '<div class="stat"><span class="label">Planned scope</span><b>' + Math.round(s.ws.reduce(function (a, w) { return a + w.total; }, 0)) + " pts</b><small>1 person ≈ 10 pts/week in their trade</small></div>" +
      "</div>" +
      '<div class="cols">' +
        "<div>" +
          '<h2 class="section-title">The team</h2><div class="list">' +
          s.team.map(function (m) {
            return '<div class="row"><div style="display:flex;align-items:center;gap:10px;min-width:0"><span class="avatar">' + esc(initials(m.name)) + "</span><div><div>" + esc(m.name) + '</div><div class="sub">' + m.speed + " pts/wk · " + money(m.rate) + '/wk</div></div></div><span class="role">' + esc(m.role) + "</span></div>";
          }).join("") + "</div>" +
          '<h2 class="section-title" style="margin-top:18px">Workstreams</h2><div class="list">' +
          s.ws.map(function (w) {
            var short = (cap[w.role] || 0) < need[w.role];
            var nobody = !cap[w.role];
            return '<div class="row"><div><div>' + esc(w.name) + '</div><div class="sub">' + Math.round(w.total) + " pts</div></div>" +
              (nobody ? '<span class="warnflag">NO ' + esc(w.role).toUpperCase() + " ON TEAM</span>" : short ? '<span class="warnflag">UNDERSTAFFED</span>' : "") +
              '<span class="role">' + esc(w.role) + "</span></div>";
          }).join("") + "</div>" +
        "</div>" +
        "<div>" +
          '<h2 class="section-title">Optional features</h2>' +
          '<p class="sub" style="margin:-4px 0 10px;color:#71829a;font-size:12px">Tap to cut. Cutting now costs the stakeholder value shown; cutting mid-project costs double.</p>' +
          '<div class="list">' +
          s.features.map(function (f) {
            var cut = f.status === "cut";
            return '<button class="row feat' + (cut ? " cut" : "") + '" data-feature="' + esc(f.id) + '"><div><div class="fname">' + esc(f.name) + '</div><div class="sub">' + f.points + " pts · " + esc((s.ws.filter(function (w) { return w.id === f.ws; })[0] || {}).name) + " · stakeholder value " + f.value + '</div></div><span class="toggle">' + (cut ? "CUT" : "IN SCOPE") + "</span></button>";
          }).join("") + "</div>" +
          '<div class="tip"><b>How a week works.</b> Assign each person to a workstream — people do full speed in their own trade and half speed outside it. Pick a pace, optionally make one management move, then run the week. Events will interrupt. The forecast bar tells you where you are heading; believe it early.</div>' +
          (cuts.length ? '<div class="tip">Cutting ' + cuts.length + " feature" + (cuts.length > 1 ? "s" : "") + " at kickoff costs <b>" + satCost + "</b> stakeholder points.</div>" : "") +
        "</div>" +
      "</div>" +
      '<div class="action-row"><button class="action secondary" id="charter-back">Back to projects</button><button class="action primary" id="kickoff">Kick off the project →</button></div>';

    $("charter").querySelectorAll("[data-feature]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = game.features.filter(function (x) { return x.id === b.dataset.feature; })[0];
        if (f.status === "cut") E.restoreFeature(game, f.id); else E.cutFeature(game, f.id, true);
        renderCharter();
      });
    });
    $("charter-back").addEventListener("click", renderPick);
    $("kickoff").addEventListener("click", function () {
      E.kickoff(game);
      freshPlan();
      renderPlay();
      show("play");
    });
  }

  // ---------------- 3. play ----------------
  function freshPlan() {
    var keepPace = plan ? plan.pace : "steady";
    plan = { assign: Object.assign({}, E.autoAssign(game)), pace: keepPace, move: { type: "none" } };
  }

  function renderPlay() {
    renderHud();
    renderWorkstreams();
    renderBurndown();
    renderLog();
    renderTeam();
    renderPace();
    renderMoves();
    renderSummary();
  }

  function renderHud() {
    var s = game, used = s.week - 1;
    var budgetPct = s.spent / s.budget * 100;
    var prog = E.progress(s) * 100;
    function meter(label, val, sub, pct, color) {
      return '<div class="meter"><span class="label">' + label + '</span><div class="val">' + val + "<small>" + sub + '</small></div><div class="bar"><i style="width:' + Math.max(0, Math.min(100, pct)) + "%;background:" + color + '"></i></div></div>';
    }
    $("hud").innerHTML =
      meter("Week", '<span>' + s.week + '<span style="color:#64748b"> / ' + s.deadline + "</span></span>", used > s.deadline ? "late" : (s.deadline - used) + " left", used / s.deadline * 100, used > s.deadline ? "var(--bad)" : "var(--info)") +
      meter("Budget spent", money(s.spent), "of " + money(s.budget), budgetPct, budgetPct > 100 ? "var(--bad)" : budgetPct > 85 ? "var(--warn)" : "var(--good)") +
      meter("Scope done", Math.round(prog) + "%", Math.round(E.forecast(s).remaining) + " pts left", prog, "linear-gradient(90deg,#f59e0b,#fbbf24)") +
      meter("Team morale", Math.round(s.morale), "/100", s.morale, tone(s.morale)) +
      meter("Quality", Math.round(s.quality), "/100", s.quality, tone(s.quality)) +
      meter("Stakeholders", Math.round(s.sat), "/100", s.sat, tone(s.sat));

    var f = E.forecast(s);
    var timeCls = f.onTime ? "ok" : f.eta <= s.deadline + 1 ? "risk" : "bad";
    var moneyCls = f.onBudget ? "ok" : f.eac <= s.budget * 1.1 ? "risk" : "bad";
    $("forecast").innerHTML =
      '<span class="label">Forecast</span>' +
      '<span class="pill ' + timeCls + '">' + (f.weeksNeeded >= 99 ? "no progress" : "finish ≈ week " + f.eta) + "</span>" +
      '<span class="pill ' + moneyCls + '">cost at completion ≈ ' + money(f.eac) + "</span>" +
      "<span>velocity " + Math.round(f.velocity) + " pts/wk · burn " + money(f.burn) + "/wk</span>";
  }

  function renderWorkstreams() {
    var s = game, proj = E.project(s, plan);
    var who = {};
    E.active(s).forEach(function (m) { var id = plan.assign[m.id]; (who[id] = who[id] || []).push(m.name.split(" ")[0]); });
    $("ws-total").textContent = Math.round(proj.total) + " pts planned this week";
    $("ws-list").innerHTML = s.ws.map(function (w) {
      var tot = Math.max(1, w.total), done = Math.min(w.done, w.total);
      var gain = proj.byWs[w.id] || 0;
      var complete = E.remaining(w) <= 0.001;
      var names = who[w.id] || [];
      return '<div class="ws' + (complete ? " complete" : "") + '">' +
        '<div class="ws-top"><span class="n">' + esc(w.name) + '</span><span class="p">' + Math.round(done) + " / " + Math.round(w.total) + "</span></div>" +
        '<div class="ws-bar"><span class="done" style="width:' + (done / tot * 100) + '%"></span><span class="next" style="left:' + (done / tot * 100) + "%;width:" + (gain / tot * 100) + '%"></span></div>' +
        '<div class="ws-meta"><span class="role">' + esc(w.role) + "</span>" +
        (complete ? '<span class="gain">✓ done</span>' : gain > 0 ? '<span class="gain">+' + Math.round(gain) + " this week · " + esc(names.join(", ")) + "</span>" : '<span class="idle">nobody assigned</span>') +
        "</div></div>";
    }).join("") + (proj.waste > 0.5 ? '<p class="ws-meta" style="margin-top:10px"><span class="idle">⚠ ' + Math.round(proj.waste) + " pts of effort would be wasted on finished work — reassign someone.</span></p>" : "");
  }

  function burndownSvg(s, opts) {
    opts = opts || {};
    var W = 340, H = opts.h || 150, pl = 30, pr = 8, pt = 10, pb = 20;
    var hist = s.history;
    var start = hist[0].remaining;
    var maxWeek = Math.max(s.deadline, hist[hist.length - 1].week, opts.until || 0);
    var maxY = Math.max(start, Math.max.apply(null, hist.map(function (h) { return h.remaining; })));
    function x(w) { return pl + (W - pl - pr) * w / maxWeek; }
    function y(v) { return pt + (H - pt - pb) * (1 - v / maxY); }
    var ideal = '<line x1="' + x(0) + '" y1="' + y(start) + '" x2="' + x(s.deadline) + '" y2="' + y(0) + '" stroke="#475569" stroke-dasharray="4 4" stroke-width="1.5"/>';
    var dl = '<line x1="' + x(s.deadline) + '" y1="' + pt + '" x2="' + x(s.deadline) + '" y2="' + (H - pb) + '" stroke="#fb718555" stroke-width="1"/><text x="' + (x(s.deadline) - 3) + '" y="' + (pt + 8) + '" text-anchor="end">deadline</text>';
    var pts = hist.map(function (h) { return x(h.week).toFixed(1) + "," + y(h.remaining).toFixed(1); }).join(" ");
    var actual = '<polyline points="' + pts + '" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linejoin="round"/>' +
      hist.map(function (h) { return '<circle cx="' + x(h.week) + '" cy="' + y(h.remaining) + '" r="2.4" fill="#fbbf24"/>'; }).join("");
    var axis = '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (W - pr) + '" y2="' + (H - pb) + '" stroke="#223149"/>' +
      '<text x="' + (pl - 4) + '" y="' + (y(maxY) + 3) + '" text-anchor="end">' + Math.round(maxY) + "</text>" +
      '<text x="' + (pl - 4) + '" y="' + (H - pb + 3) + '" text-anchor="end">0</text>';
    var ticks = "";
    for (var w = 0; w <= maxWeek; w += maxWeek > 12 ? 2 : 1) ticks += '<text x="' + x(w) + '" y="' + (H - 6) + '" text-anchor="middle">' + w + "</text>";
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Burndown: points remaining per week">' + axis + ticks + dl + ideal + actual + "</svg>" +
      '<div class="legend"><span><i style="background:#fbbf24"></i>actual</span><span><i style="background:#475569"></i>ideal pace to deadline</span></div>';
  }
  function renderBurndown() { $("burndown").innerHTML = burndownSvg(game); }

  function renderLog() {
    $("log").innerHTML = game.log.slice().reverse().map(function (l) {
      return '<li class="log-' + esc(l.kind) + '"><span>W' + l.week + "</span>" + esc(l.text) + "</li>";
    }).join("");
  }

  function renderTeam() {
    var s = game, proj = E.project(s, plan);
    $("plan-title").textContent = "Plan week " + s.week;
    $("team").innerHTML = E.active(s).map(function (m) {
      var status = m.out > 0 ? '<span class="member-out">away ' + m.out + " wk</span>"
        : m.worked < 2 ? '<span class="member-ramp">ramping up</span>'
        : '<span class="member-pts">+' + Math.round(proj.perMember[m.id] || 0) + "</span>";
      var w = s.ws.filter(function (x) { return x.id === plan.assign[m.id]; })[0];
      var off = w && w.role !== m.role;
      return '<div class="member"><div class="member-head"><span class="avatar' + (m.contractor ? " contract" : "") + '">' + esc(initials(m.name)) + '</span><div style="min-width:0"><div class="member-name">' + esc(m.name) + '</div><div class="member-sub">' + esc(m.role) + " · " + money(m.rate) + "/wk</div></div>" + status + "</div>" +
        '<select class="sel' + (off ? " off" : "") + '" data-member="' + m.id + '"' + (m.out > 0 ? " disabled" : "") + ">" +
        s.ws.map(function (x) {
          var r = E.remaining(x);
          return '<option value="' + x.id + '"' + (x.id === plan.assign[m.id] ? " selected" : "") + ">" + esc(x.name) + (r <= 0.001 ? " ✓" : x.role !== m.role ? " (½ speed)" : "") + "</option>";
        }).join("") + "</select></div>";
    }).join("");
    $("team").querySelectorAll("select").forEach(function (sel) {
      sel.addEventListener("change", function () { plan.assign[sel.dataset.member] = sel.value; renderTeam(); renderWorkstreams(); renderSummary(); });
    });
  }

  function renderPace() {
    $("pace").innerHTML = Object.keys(E.PACES).map(function (k) {
      var p = E.PACES[k];
      return '<button data-pace="' + k + '" class="' + (plan.pace === k ? "on" : "") + '">' + p.label + "<small>" + (p.mult === 1 ? "×1.0" : "×" + p.mult) + " · morale " + (p.morale > 0 ? "+" : "") + p.morale + "</small></button>";
    }).join("");
    $("pace").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { plan.pace = b.dataset.pace; renderPace(); renderTeam(); renderWorkstreams(); renderSummary(); });
    });
  }

  var MOVE_TEXT = {
    none: ["Hold course", "No move this week."],
    hire: ["Hire contractor", "Pricey, and slow to ramp up."],
    release: ["Release contractor", "Stop paying them."],
    teambuild: ["Team day out", "+15 morale, −10% output."],
    demo: ["Stakeholder demo", "+10 stakeholders, −15% output."],
    quality: ["Quality sprint", "+10 quality, −25% output."],
    cut: ["Cut a feature", "Shrinks scope. Costs 2× value."],
    extend: ["Extend deadline", "+2 weeks. −15 stakeholders."],
    fund: ["Request budget", "+15% budget. −12 stakeholders."]
  };
  function renderMoves() {
    var o = E.moveOptions(game);
    $("moves").innerHTML = Object.keys(MOVE_TEXT).map(function (k) {
      var t = MOVE_TEXT[k], sub = t[1];
      if (k === "teambuild") sub = "+15 morale, " + money(o.teambuild.cost) + ".";
      if (k === "fund") sub = "+" + money(o.fund.amount) + ". −12 stakeholders.";
      if (k === "extend" && game.sc.fixedDeadline) sub = "This deadline is fixed.";
      return '<button class="move' + (plan.move.type === k ? " on" : "") + '" data-move="' + k + '"' + (o[k].ok ? "" : " disabled") + "><strong>" + t[0] + "</strong>" + sub + "</button>";
    }).join("");
    $("moves").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.move, mv = { type: k };
        if (k === "hire") mv.role = o.hire.roles[0].role;
        if (k === "release") mv.who = o.release.who[0].id;
        if (k === "cut") mv.feature = o.cut.features[0].id;
        plan.move = mv;
        renderMoves(); renderTeam(); renderWorkstreams(); renderSummary();
      });
    });
    renderMoveArg(o);
  }
  function renderMoveArg(o) {
    var mv = plan.move, box = $("move-arg"), h = "";
    if (mv.type === "hire") h = '<select class="sel" id="arg">' + o.hire.roles.map(function (r) { return '<option value="' + esc(r.role) + '"' + (r.role === mv.role ? " selected" : "") + ">" + esc(r.role) + " contractor · " + money(r.rate) + "/wk + " + money(r.rate) + " fee</option>"; }).join("") + "</select>";
    if (mv.type === "release") h = '<select class="sel" id="arg">' + o.release.who.map(function (m) { return '<option value="' + m.id + '"' + (m.id === mv.who ? " selected" : "") + ">" + esc(m.name) + "</option>"; }).join("") + "</select>";
    if (mv.type === "cut") h = '<select class="sel" id="arg">' + o.cut.features.map(function (f) { return '<option value="' + esc(f.id) + '"' + (f.id === mv.feature ? " selected" : "") + ">" + esc(f.name) + " · −" + f.points + " pts · −" + f.value * 2 + " stakeholders</option>"; }).join("") + "</select>";
    box.innerHTML = h;
    var a = $("arg");
    if (a) a.addEventListener("change", function () {
      if (mv.type === "hire") mv.role = a.value;
      if (mv.type === "release") mv.who = a.value;
      if (mv.type === "cut") mv.feature = a.value;
      renderSummary();
    });
  }

  function renderSummary() {
    var s = game, proj = E.project(s, plan), o = E.moveOptions(s);
    var cost = E.burn(s);
    if (plan.move.type === "hire") { var r = o.hire.roles.filter(function (x) { return x.role === plan.move.role; })[0]; cost += r ? r.rate * 2 : 0; }
    if (plan.move.type === "teambuild") cost += o.teambuild.cost;
    $("plan-sum").innerHTML = "<span>This week: <b>+" + Math.round(proj.total) + " pts</b></span><span>Cost: <b>" + money(cost) + "</b></span><span>Pace: <b>" + E.PACES[plan.pace].label + "</b></span>";
    var sh = $("ship-now");
    sh.hidden = !E.canShipEarly(s) || E.progress(s) >= 0.999;
    sh.textContent = "Ship at " + Math.round(E.progress(s) * 100) + "%";
  }

  function runWeek() {
    var report = E.runWeek(game, plan);
    if (!report) return;
    toast("Week " + report.week + ": +" + Math.round(report.delivered) + " pts · " + money(report.cost) + " spent");
    if (game.over) return renderVerdict();
    freshPlan();
    renderPlay();
    if (game.pending) openEvent(game.pending);
  }

  // ---------------- events ----------------
  function openEvent(ev) {
    $("event-week").textContent = "Week " + game.week + " · something came up";
    $("event-title").textContent = ev.title;
    $("event-body").textContent = ev.body;
    $("event-choices").innerHTML = ev.choices.map(function (c, i) {
      return '<button class="choice" data-i="' + i + '"' + (c.ok === false ? " disabled" : "") + "><strong>" + esc(c.label) + "</strong><span>" + esc(c.detail) + "</span></button>";
    }).join("");
    $("event-overlay").hidden = false;
    $("event-choices").querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        E.resolve(game, +b.dataset.i);
        $("event-overlay").hidden = true;
        if (game.over) return renderVerdict();
        freshPlan();
        renderPlay();
      });
    });
    var first = $("event-choices").querySelector("button:not([disabled])");
    if (first) first.focus();
  }

  // ---------------- 4. verdict ----------------
  var ENDINGS = {
    shipped: null, early: null,
    replaced: ["You've been replaced.", "The sponsor lost faith and handed the project to someone else. Nobody is angry. That is somehow worse."],
    budget: ["Funding pulled.", "The project blew through its budget and finance shut it down. The work done so far goes on a shelf."],
    timeline: ["Project cancelled.", "It ran so far past the deadline that the business moved on without it."]
  };
  var TITLES = {
    S: ["Textbook delivery.", "On time, on budget, and the team would work with you again. Frame this one."],
    A: ["Shipped and celebrated.", "A few bruises, but the sponsor is happy and the project is live."],
    B: ["Shipped, with scars.", "It's out the door. The retrospective is going to be a long meeting."],
    C: ["A challenged project.", "It technically shipped. Nobody is putting it on their CV."],
    F: ["It shipped. Barely.", "Late, over budget or broken — probably more than one. There's a lot to learn from this one."]
  };
  function renderVerdict() {
    var s = game, sc = s.score, p = sc.parts;
    var end = ENDINGS[s.over.reason] || TITLES[sc.grade];
    if (s.over.reason === "early" && !sc.failed) end = [TITLES[sc.grade][0], "You shipped at " + Math.round(E.progress(s) * 100) + "% of scope. " + TITLES[sc.grade][1]];
    var notes = {
      schedule: sc.late ? sc.late + " week" + (sc.late > 1 ? "s" : "") + " late (week " + sc.used + " of " + s.deadline + ")" : "done in week " + sc.used + " of " + s.deadline,
      budget: money(sc.spent) + " of " + money(s.budget) + (sc.overPct > 0 ? " — " + Math.round(sc.overPct) + "% over" : " — under budget"),
      scope: Math.round(sc.delivered) + " pts delivered against " + Math.round(s.planned) + " planned" + (sc.delivered > s.planned ? " (accepted requests count as a bonus)" : ""),
      quality: s.flags.crunchWeeks ? s.flags.crunchWeeks + " crunch week" + (s.flags.crunchWeeks > 1 ? "s" : "") : "what users will feel after launch",
      stakeholders: s.flags.spin && sc.late ? "the rosy status update came due" : "how the sponsor feels on launch day"
    };
    var labels = { schedule: "Schedule", budget: "Budget", scope: "Scope", quality: "Quality", stakeholders: "Stakeholders" };
    var lessons = E.lessons(s);
    $("verdict").innerHTML =
      '<div class="grade ' + sc.grade + '">' + sc.grade + "</div>" +
      '<p class="eyebrow">' + esc(s.sc.title) + " · project closed</p>" +
      "<h1>" + esc(end[0]) + '</h1><p class="copy">' + esc(end[1]) + "</p>" +
      '<div class="total"><b>' + sc.total + '</b><span class="label">/ 100 project score</span></div>' +
      '<div class="scores">' + Object.keys(labels).map(function (k) {
        return '<div class="score-row"><span>' + labels[k] + '</span><div class="bar" style="margin:0"><i style="width:' + p[k] + "%;background:" + tone(p[k]) + '"></i></div><span class="v">' + p[k] + '</span><span class="note">' + esc(notes[k]) + "</span></div>";
      }).join("") + "</div>" +
      '<div class="debrief">' +
        '<div class="panel"><h2>Burndown</h2>' + burndownSvg(s, { h: 160 }) + "</div>" +
        '<div class="panel"><h2>Budget burn</h2>' + budgetSvg(s) + "</div>" +
        '<div class="panel wide"><h2>What this project teaches</h2>' + lessons.map(function (l) { return '<div class="lesson"><b>' + esc(l.t) + "</b><p>" + esc(l.d) + "</p></div>"; }).join("") + "</div>" +
        '<div class="panel wide"><details><summary>Full project log (' + s.log.length + " entries)</summary><ul class=\"log\" style=\"max-height:none;margin-top:10px\">" +
          s.log.map(function (l) { return '<li class="log-' + esc(l.kind) + '"><span>W' + l.week + "</span>" + esc(l.text) + "</li>"; }).join("") +
        "</ul></details></div>" +
      "</div>" +
      '<div class="verdict-actions"><button class="action primary" id="replay">Replay this project</button><button class="action secondary" id="another">Choose another project</button></div>';
    $("replay").addEventListener("click", function () { plan = null; openCharter(s.sc); });
    $("another").addEventListener("click", function () { plan = null; deal(); });
    show("verdict");
  }
  function budgetSvg(s) {
    var W = 340, H = 160, pl = 38, pr = 8, pt = 10, pb = 20;
    var hist = s.history, maxWeek = Math.max(s.deadline, hist[hist.length - 1].week);
    var maxY = Math.max(s.budget * 1.05, s.spent);
    function x(w) { return pl + (W - pl - pr) * w / maxWeek; }
    function y(v) { return pt + (H - pt - pb) * (1 - v / maxY); }
    var pts = hist.map(function (h) { return x(h.week).toFixed(1) + "," + y(h.spent).toFixed(1); }).join(" ");
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Money spent per week against the budget">' +
      '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (W - pr) + '" y2="' + (H - pb) + '" stroke="#223149"/>' +
      '<line x1="' + pl + '" y1="' + y(s.budget) + '" x2="' + (W - pr) + '" y2="' + y(s.budget) + '" stroke="#fb7185" stroke-dasharray="4 4"/>' +
      '<text x="' + (pl - 4) + '" y="' + (y(s.budget) + 3) + '" text-anchor="end">' + money(s.budget) + "</text>" +
      '<text x="' + (pl - 4) + '" y="' + (H - pb + 3) + '" text-anchor="end">$0</text>' +
      '<polyline points="' + pts + '" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<text x="' + x(0) + '" y="' + (H - 6) + '" text-anchor="middle">0</text><text x="' + x(maxWeek) + '" y="' + (H - 6) + '" text-anchor="end">week ' + maxWeek + "</text>" +
      "</svg>" + '<div class="legend"><span><i style="background:#34d399"></i>spent</span><span><i style="background:#fb7185"></i>budget</span></div>';
  }

  // ---------------- wiring ----------------
  $("deal-button").addEventListener("click", deal);
  $("scn-grid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-id]");
    if (!b) return;
    var sc = ALL.filter(function (x) { return x.id === b.dataset.id; })[0];
    if (sc) openCharter(sc);
  });
  $("run-week").addEventListener("click", runWeek);
  $("ship-now").addEventListener("click", function () {
    if (confirm("Ship now with " + Math.round(E.progress(game) * 100) + "% of scope done? Stakeholders will notice what's missing.")) {
      E.shipNow(game);
      renderVerdict();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !$("event-overlay").hidden) return;
    if (e.key === "Enter" && e.target === document.body && !document.querySelector('[data-screen="play"]').hidden) runWeek();
  });

  deal();
})();
