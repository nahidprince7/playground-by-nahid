/* Subscribe nudge — shared by every page in the playground.
 *
 * This used to be the same 50 lines pasted into each index.html. It is one file now:
 * every page loads it with a single <script> tag, so the timing below is the timing
 * everywhere. Change it here and it changes for all of them.
 *
 * Shows at 3 minutes. If dismissed, shows once more 7 minutes later, then never again
 * this session. Subscribing retires it immediately.
 */
(function () {
  "use strict";

  var KEY = "pgYtSubDone";
  var FIRST = 180000;   // 3 min
  var REPEAT = 420000;  // 7 min after a dismissal
  var MAX_SHOWS = 2;

  // sessionStorage throws in some privacy modes; the nudge is not worth an exception.
  function done() { try { return !!sessionStorage.getItem(KEY); } catch (e) { return false; } }
  function markDone() { try { sessionStorage.setItem(KEY, "1"); } catch (e) {} }

  if (done()) return;

  var style = document.createElement("style");
  style.textContent = `\n.pg-yt-backdrop{position:fixed;inset:0;z-index:99998;background:rgba(4,8,14,.55);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .35s;}
  .pg-yt-backdrop.show{opacity:1;pointer-events:auto;}
  .pg-yt{position:fixed;left:50%;top:50%;z-index:99999;width:min(92vw,380px);
    display:flex;gap:12px;align-items:flex-start;padding:20px 36px 20px 18px;
    border-radius:16px;background:linear-gradient(180deg,#141a24,#0d1119);
    border:1px solid #2a2f3a;box-shadow:0 30px 80px -20px rgba(0,0,0,.85),0 0 0 1px rgba(255,0,0,.1),0 0 60px -20px rgba(255,0,0,.35);
    color:#eaf1fb;font-family:"Space Grotesk","Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    transform:translate(-50%,-50%) scale(.92);opacity:0;pointer-events:none;
    transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .35s;}
  .pg-yt.show{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:auto;}
  .pg-yt *{box-sizing:border-box;}
  .pg-yt-ico{flex:0 0 auto;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#ff0000;box-shadow:0 6px 16px -6px rgba(255,0,0,.6);}
  .pg-yt-ico svg{width:22px;height:22px;fill:#fff;}
  .pg-yt-body{flex:1;font-size:13px;line-height:1.45;color:#c7d2e0;}
  .pg-yt-body b{color:#fff;font-weight:700;}
  .pg-yt-actions{display:flex;gap:6px;align-items:center;margin-top:10px;}
  .pg-yt-sub{display:inline-flex;align-items:center;gap:6px;background:#ff0000;color:#fff;text-decoration:none;font-weight:700;font-size:12.5px;padding:8px 14px;border-radius:8px;transition:transform .15s,background .15s;}
  .pg-yt-sub:hover{background:#e60000;transform:translateY(-1px);}
  .pg-yt-later{background:none;border:none;color:#8ba0b8;font-size:12.5px;font-weight:600;cursor:pointer;padding:8px 6px;}
  .pg-yt-later:hover{color:#cfe3f5;}
  .pg-yt-x{position:absolute;top:8px;right:10px;background:none;border:none;color:#5b7189;font-size:15px;line-height:1;cursor:pointer;padding:2px 4px;}
  .pg-yt-x:hover{color:#fff;}
  @media (max-width:520px){ .pg-yt{width:min(92vw,360px);} }\n`;
  document.head.appendChild(style);

  var host = document.createElement("div");
  host.innerHTML = `\n<div class="pg-yt-backdrop" id="pgYtBg"></div>
<div class="pg-yt" id="pgYt" role="dialog" aria-label="Subscribe on YouTube">
  <button class="pg-yt-x" aria-label="Close" onclick="pgYtClose()">✕</button>
  <span class="pg-yt-ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.11-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.57A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.39-.57a3 3 0 0 0 2.11-2.13A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/></svg></span>
  <div class="pg-yt-body">
    Having fun? 🎮 If you're enjoying this, <b>don't forget to subscribe</b> on YouTube for more builds like this.
    <div class="pg-yt-actions">
      <a class="pg-yt-sub" href="https://www.youtube.com/@devAI070?sub_confirmation=1" target="_blank" rel="noopener" onclick="pgYtSubbed()"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.11-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.39.57A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.11 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.39-.57a3 3 0 0 0 2.11-2.13A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/></svg> Subscribe</a>
      <button class="pg-yt-later" onclick="pgYtClose()">Maybe later</button>
    </div>
  </div>
</div>\n`;
  while (host.firstChild) document.body.appendChild(host.firstChild);

  var el = document.getElementById("pgYt");
  var bg = document.getElementById("pgYtBg");
  if (!el) return;

  var shows = 0;

  function show() { if (!done()) { el.classList.add("show"); if (bg) bg.classList.add("show"); } }
  function hide() { el.classList.remove("show"); if (bg) bg.classList.remove("show"); }

  // Global because the markup wires these up with inline onclick attributes.
  window.pgYtClose = function () {
    hide();
    shows++;
    if (shows >= MAX_SHOWS) markDone(); else setTimeout(show, REPEAT);
  };
  window.pgYtSubbed = function () { markDone(); setTimeout(hide, 300); };

  setTimeout(show, FIRST);
})();
