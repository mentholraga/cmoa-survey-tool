/* =====================================================================
   CMO Alliance marketing benchmarking survey — embeddable widget
   ---------------------------------------------------------------------
   Adapted from CSC's widget.js; CSC's file is not touched. Drop this on a page:
       <div data-cmoa-benchmark data-module="full" data-src="landing-page"></div>
       <div data-cmoa-report hidden> …HubSpot embed code… </div>
       <script src="https://YOUR-HOST/widget.js" defer></script>

   Attributes on the mount div:
       data-module="full|skills|ai|strategy|team|channels"   (default full)
       data-src="newsletter"     stored as the response's source
       data-theme="light|dark"   force a theme (default follows the OS)
       data-survey="slug"        default marketing-benchmarking-survey
       data-hide-title           hide the title when the page has its own
       data-report-url="…"       HubSpot share link, a fallback for ad blockers

   Renders in a shadow root. Talks to the cmoa schema in Supabase. Answers
   are saved after every screen; reveals come back from the server. The
   report form's email goes to HubSpot only, never to the survey database.
   Requires db/01_schema.sql, 02_functions.sql and 03_survey.sql.
   ===================================================================== */
(function () {
  'use strict';
  var CSS = ":host{all:initial;display:block;font:16px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color-scheme:light dark}\n:host *{box-sizing:border-box}\n:host{\n  --plane:#f9f8f5;--surface-1:#ffffff;--ink:#09100f;--ink-2:#4a5150;--muted:#6d7371;\n  --grid:#e6e4df;--axis:#c9c6bf;--border:#e4e1da;--track:#ebe7df;--box:#c9c6bf;--bad:#c0392b;\n  --accent:var(--brand-2,#5036d5);--accent-hover:var(--brand-2-hover,#3f28b8);--accent-ink:#ffffff;\n  --context:#8a908e;--input-border:#cfcac0;\n  --brand-grad:linear-gradient(90deg,var(--brand-1,#ff4dd8) 0%,var(--brand-2,#5036d5) 100%);\n  --w-sans:var(--sans,'Poppins',system-ui,-apple-system,'Segoe UI',sans-serif);\n  --w-serif:var(--serif,'IvyJournal','Times New Roman',serif);\n}\n@media (prefers-color-scheme:dark){:host(:not([data-theme=light])){\n  --plane:#09100f;--surface-1:#121a19;--ink:#f9f8f5;--ink-2:#c2c7c5;--muted:#8d9391;\n  --grid:#1e2423;--axis:#2c3332;--border:rgba(249,248,245,.12);--track:#1e2423;--box:#2c3332;\n  --accent:#7d6cf5;--accent-hover:#9384ff;--input-border:#3a4241;--bad:#e66767;\n}}\n:host([data-theme=dark]){\n  --plane:#09100f;--surface-1:#121a19;--ink:#f9f8f5;--ink-2:#c2c7c5;--muted:#8d9391;\n  --grid:#1e2423;--axis:#2c3332;--border:rgba(249,248,245,.12);--track:#1e2423;--box:#2c3332;\n  --accent:#7d6cf5;--accent-hover:#9384ff;--input-border:#3a4241;--bad:#e66767;\n}\n.root{margin:0;background:var(--plane);color:var(--ink);font:16px/1.55 var(--w-sans);-webkit-font-smoothing:antialiased}\n.wrap{max-width:600px;margin:0 auto;padding:8px 0 48px}\n.title{font-family:var(--w-serif);font-style:italic;font-weight:400;font-size:clamp(30px,5vw,40px);line-height:1.08;letter-spacing:-.03em;margin:0 0 10px}\n.lede{font-size:16px;line-height:26px;font-weight:300;margin:0 0 22px}\n.card{background:var(--surface-1);border-radius:16px;box-shadow:inset 0 0 0 1px var(--border);padding:24px 22px;margin-bottom:12px}\n.card h2{font-size:19px;line-height:26px;font-weight:400;letter-spacing:-.01em;margin:0 0 4px}\n.basis{font-size:12.5px;color:var(--muted);margin:0 0 14px;line-height:1.5}\n.narr{font-size:15px;line-height:24px;font-weight:300;margin:12px 0 0;color:var(--ink-2)}\n.narr b{color:var(--ink);font-weight:500}\n.stagebar{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:12px;color:var(--muted)}\n.stagebar .pips{display:flex;gap:4px;flex:1}\n.stagebar .pips i{flex:1;height:4px;border-radius:2px;background:var(--track)}\n.stagebar .pips i.done{background:var(--context)}\n.stagebar .pips i.now{background-image:var(--brand-grad)}\n.prog{display:flex;gap:5px;margin-bottom:18px}\n.prog i{flex:1;height:3px;border-radius:2px;background:var(--track)}\n.prog i.on{background:var(--accent)}\n.q{margin-bottom:28px}\n.q:last-child{margin-bottom:6px}\n.qlab{display:block;font-size:16px;font-weight:500;margin-bottom:4px;line-height:1.35}\n.help{font-size:13px;color:var(--muted);margin-bottom:10px}\n.opts{display:grid;gap:7px}\n.opts.inline{grid-template-columns:repeat(auto-fit,minmax(90px,1fr))}\n.opt{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--border);border-radius:8px;padding:11px 12px;cursor:pointer;background:transparent;font:inherit;font-weight:300;text-align:left;color:var(--ink);width:100%;line-height:1.35}\n.opt:hover{border-color:var(--accent)}\n.opt.sel{border-color:var(--accent);background:color-mix(in oklab,var(--accent) 9%,transparent)}\n.opt .tick{flex:0 0 18px;height:18px;border:1.5px solid var(--axis);border-radius:50%;margin-top:1px}\n.opt.multi .tick{border-radius:5px}\n.opt.sel .tick{border-color:var(--accent);background:var(--accent);box-shadow:inset 0 0 0 3px var(--surface-1)}\ninput[type=text],input[type=number],select,textarea{width:100%;font:300 16px var(--w-sans);padding:13px 14px;border:1px solid var(--input-border);border-radius:6px;background:var(--surface-1);color:var(--ink)}\ntextarea{min-height:120px;resize:vertical;line-height:1.5}\ninput:focus,select:focus,textarea:focus,.opt:focus-visible,.scale button:focus-visible,.track:focus-visible,.btn:focus-visible,.more:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n.err{color:var(--bad);font-size:13px;margin-top:7px;display:none}\n.err.on{display:block}\n.nav{display:flex;gap:8px;margin-top:8px}\n.btn{flex:1;display:inline-flex;align-items:center;justify-content:center;min-height:52px;padding:0 24px;border-radius:6px;font:500 16px var(--w-sans);cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--ink);text-decoration:none}\n.btn.pri{background:var(--accent);color:var(--accent-ink);border-color:transparent}\n.btn.pri:hover:not(:disabled){background:var(--accent-hover)}\n.btn:disabled{opacity:.5;cursor:default}\n.btn.back{flex:0 0 auto}\n.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n.consent{font-size:12.5px;color:var(--muted);margin-top:16px;line-height:1.55;font-weight:300}\n.spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite;margin-right:8px}\n@keyframes sp{to{transform:rotate(360deg)}}\n\n/* capability cards: two ratings each */\n.cap{border-radius:14px;box-shadow:inset 0 0 0 1px var(--border);padding:18px 16px;margin-bottom:12px;background:var(--surface-1);transition:box-shadow .2s}\n.cap.done{box-shadow:inset 0 0 0 1px var(--accent)}\n.cap h3{font-size:17px;font-weight:500;margin:0 0 2px;line-height:1.3}\n.cap .desc{font-size:13.5px;color:var(--ink-2);font-weight:300;margin:0 0 14px}\n.scale-lab{font-size:12.5px;color:var(--muted);margin:10px 0 6px}\n.scale{display:grid;gap:5px}\n.scale.n4{grid-template-columns:repeat(4,1fr)}\n.scale.n5{grid-template-columns:repeat(5,1fr)}\n.scale button{font:400 13px/1.2 var(--w-sans);padding:10px 4px;min-height:44px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--ink);cursor:pointer}\n.scale button:hover{border-color:var(--accent)}\n.scale button.sel{background:var(--accent);color:var(--accent-ink);border-color:transparent}\n.intro-note{font-size:14px;color:var(--ink-2);font-weight:300;margin:0 0 14px;line-height:1.55}\n\n/* proficiency list and item rows */\n.rowq{padding:14px 0;border-top:1px solid var(--border)}\n.rowq:first-of-type{border-top:0;padding-top:4px}\n.rowq .rl{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:15px;font-weight:500;margin-bottom:8px}\n.more{background:none;border:0;color:var(--accent);font:400 12.5px var(--w-sans);cursor:pointer;padding:2px 0;white-space:nowrap}\n.rowq .desc{font-size:13px;color:var(--ink-2);font-weight:300;margin:-4px 0 8px}\n.pills{display:flex;flex-wrap:wrap;gap:6px}\n.pills button{font:300 13.5px/1.25 var(--w-sans);padding:9px 11px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--ink);cursor:pointer;text-align:left}\n.pills button.sel{background:var(--accent);color:var(--accent-ink);border-color:transparent;font-weight:400}\n.legend{font-size:13px;color:var(--ink-2);font-weight:300;margin:0 0 6px}\n.legend dt{font-weight:500;color:var(--ink);margin-top:6px}\n.legend dd{margin:0}\ndetails.lg{margin:0 0 14px}\ndetails.lg summary{font-size:13px;color:var(--accent);cursor:pointer}\n\n/* guess slider: empty until the first tap */\n.guess{padding:8px 0 4px}\n.track{position:relative;height:44px;cursor:pointer;touch-action:none;border-radius:8px}\n.track .rail{position:absolute;left:0;right:0;top:19px;height:6px;border-radius:3px;background:var(--track)}\n.track .fill{position:absolute;left:0;top:19px;height:6px;border-radius:3px;background:var(--accent)}\n.track .knob{position:absolute;top:9px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--surface-1)}\n.track .hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--muted);pointer-events:none}\n.guess .read{font-size:28px;font-weight:300;letter-spacing:-.02em;margin-top:6px;min-height:36px}\n.guess .ends{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}\n\n/* reveals */\n.hero{position:relative;overflow:hidden;border-radius:16px;box-shadow:inset 0 0 0 1px var(--border);padding:28px 22px 22px;background:var(--surface-1);margin-bottom:12px}\n.hero::before{content:\"\";position:absolute;left:0;right:0;top:0;height:4px;background-image:var(--brand-grad)}\n.fig{font-weight:300;font-size:clamp(52px,10vw,72px);line-height:1;letter-spacing:-.05em}\n.fig small{font-size:22px;letter-spacing:0;color:var(--ink-2)}\n.dbar{display:grid;grid-template-columns:1fr 44px;gap:10px;align-items:center;padding:7px 0}\n.dbar+.dbar{border-top:1px solid var(--border)}\n.dbar .lab{font-size:13.5px;line-height:1.3;font-weight:300}\n.dbar.you .lab{font-weight:500}\n.bar{height:7px;background:var(--track);border-radius:4px;overflow:hidden;margin-top:5px}\n.bar i{display:block;height:100%;background:var(--context);border-radius:4px}\n.dbar.you .bar i{background:var(--accent)}\n.dbar .pc{text-align:right;font-size:13px;font-weight:500;color:var(--ink-2);font-variant-numeric:tabular-nums}\n.dbar.you .pc{color:var(--accent)}\n.youtag{display:inline-block;font-size:10.5px;font-weight:600;color:var(--accent-ink);background:var(--accent);border-radius:4px;padding:1px 5px;margin-left:6px;vertical-align:1px}\n.seg{display:flex;gap:5px;margin:0 0 12px}\n.seg button{flex:1;font:400 13px var(--w-sans);padding:9px;border-radius:6px;cursor:pointer;border:1px solid var(--border);background:var(--surface-1);color:var(--ink-2)}\n.seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink);border-color:transparent;font-weight:500}\n.wait{font-size:13.5px;color:var(--ink-2);font-weight:300;border:1px dashed var(--border);border-radius:10px;padding:12px 13px;margin-top:12px}\n.chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}\n.chip{font-size:13px;font-weight:400;border-radius:999px;padding:5px 11px;background:color-mix(in oklab,var(--accent) 10%,transparent);color:var(--ink)}\n.shift{display:grid;gap:12px}\n.shift h4,.sub h4{font-size:12.5px;font-weight:500;color:var(--muted);margin:0}\n.sub{margin-top:18px}\n.list{margin:6px 0 0;padding:0;list-style:none}\n.list li{padding:9px 0;border-top:1px solid var(--border);font-size:14.5px;font-weight:300}\n.list li:first-child{border-top:0}\n.list li b{font-weight:500}\n.list li .peer{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}\nblockquote{margin:6px 0 0;font-family:var(--w-serif);font-style:italic;font-size:22px;line-height:1.35;letter-spacing:-.01em}\n.foot{color:var(--muted);font-size:12px;margin-top:14px;line-height:1.6;font-weight:300}\n.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}\n@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}\n.pills.grid4{display:grid;grid-template-columns:repeat(4,1fr)}\n.pills.grid4 button{text-align:center;padding:10px 4px}\n@media (max-width:480px){.pills.grid4{grid-template-columns:repeat(2,1fr)}}\n";

  function boot(mount) {
    if (mount.__cmoa) return;
    mount.__cmoa = true;
    var root = mount.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + CSS + '</style><div class="root"><div class="wrap" id="app" aria-live="polite"></div></div>';
    if (mount.dataset.theme) root.host.setAttribute('data-theme', mount.dataset.theme);
    start(root, mount);
  }

  function start(root, mount) {
    /* ---------------------------------------------------------------- config */
    var CONFIG = {
      url: 'https://spnbwiqpkitezdqofzmn.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbmJ3aXFwa2l0ZXpkcW9mem1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MzU2ODAsImV4cCI6MjEwMjExMTY4MH0.g2w_xFLdG2O8ltoAR8MS1d0JfUYYyGGtGwHYO7LDGWQ',
      schema: 'cmoa',
      slug: mount.dataset.survey || 'marketing-benchmarking-survey',
      reportFormUrl: mount.dataset.reportUrl || null
    };
    if (window.__CMOA_TEST_URL__) CONFIG.url = window.__CMOA_TEST_URL__;

    var $ = function (s) { return root.querySelector(s); };
    var app = $('#app');
    var esc = function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };
    function render(html) { app.innerHTML = html; }
    function toTop() {
      var top = mount.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 16 });
    }

    /* ---------------------------------------------- anonymous device token */
    var TOKEN = null, TOK_NAME = 'cmoa_bm_tok', DRAFT_KEY = 'cmoa_bm_draft';
    function deviceToken() {
      if (TOKEN) return TOKEN;
      var t = null;
      try { var m = document.cookie.match(new RegExp('(?:^|; )' + TOK_NAME + '=([^;]*)')); if (m) t = decodeURIComponent(m[1]); } catch (e) {}
      if (!t) { try { t = localStorage.getItem(TOK_NAME); } catch (e) {} }
      if (!t) {
        t = crypto.randomUUID ? crypto.randomUUID() : (String(Math.random()).slice(2) + Date.now() + String(Math.random()).slice(2));
        try { document.cookie = TOK_NAME + '=' + encodeURIComponent(t) + ';path=/;max-age=' + (60 * 60 * 24 * 730) + ';SameSite=Lax' + (location.protocol === 'https:' ? ';Secure' : ''); } catch (e) {}
        try { localStorage.setItem(TOK_NAME, t); } catch (e) {}
      }
      TOKEN = t;
      return t;
    }

    /* PostgREST reaches the cmoa schema only with these two headers. */
    function rpc(fn, args) {
      return fetch(CONFIG.url + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: CONFIG.key,
                   Authorization: 'Bearer ' + CONFIG.key,
                   'Content-Profile': CONFIG.schema, 'Accept-Profile': CONFIG.schema },
        body: JSON.stringify(args || {})
      }).then(function (r) {
        return r.text().then(function (text) {
          var body; try { body = JSON.parse(text); } catch (e) { body = text; }
          if (!r.ok) throw new Error((body && body.message) || ('HTTP ' + r.status));
          return body;
        });
      });
    }
    function logEvent(kind, extra) {
      try {
        var a = { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(), p_kind: kind, p_stage: STAGE };
        for (var k in (extra || {})) a[k] = extra[k];
        rpc('log_event', a).catch(function () {});
      } catch (e) {}
    }

    /* ------------------------------------------------------------- state */
    var DEF = null, QBY = {}, MODULE = 'full', SOURCE = 'organic';
    var ANS = {}, DONE_STAGES = [], DONE_SCREENS = [];
    var STAGE = 1, SCREENS = [], SI = 0, startedAt = Date.now();
    var GUESS = { placed: false, moved: false };

    var stageDef = function (n) { return (DEF.stages || []).filter(function (s) { return s.n === n; })[0] || {}; };
    var moduleDef = function () { return (DEF.modules || {})[MODULE] || DEF.modules.full; };
    var sections = function () { return moduleDef().sections; };
    var coreStage = function () { return (DEF.stages.filter(function (s) { return s.is_core; })[0] || {}).n || 1; };
    var isDone = function (n) { return DONE_STAGES.indexOf(n) >= 0; };
    function screensOf(n) {
      var seen = {}, out = [];
      DEF.questions.forEach(function (q) { if (q.stage === n && !seen[q.screen]) { seen[q.screen] = 1; out.push(q.screen); } });
      return out.sort(function (a, b) {
        var x = a.split('.').map(Number), y = b.split('.').map(Number);
        return x[0] - y[0] || x[1] - y[1];
      });
    }
    var qsOf = function (scr) { return DEF.questions.filter(function (q) { return q.screen === scr; }); };

    /* Same rules as the server's _shown. */
    function shown(q) {
      var c = q.show_if;
      if (!c) return true;
      var list = Array.isArray(c) ? c : [c];
      return list.every(function (x) {
        var v = ANS[x.key];
        if ('eq' in x) return v != null && String(v) === String(x.eq);
        if ('ne' in x) return v == null || String(v) !== String(x.ne);
        if ('in' in x) return v != null && x['in'].indexOf(v) >= 0;
        if ('gte' in x) return typeof v === 'number' && v >= x.gte;
        if ('lt' in x) return typeof v === 'number' && v < x.lt;
        return true;
      });
    }
    var visible = function (scr) { return qsOf(scr).filter(shown); };
    function nextStageN() {
      var s = sections(), i = s.indexOf(STAGE);
      var open = function (n) { return n !== STAGE && !isDone(n); };
      return s.slice(i + 1).filter(open)[0] || s.filter(open)[0];
    }

    /* ------------------------------------------------------------- draft */
    function saveDraft() {
      if (STAGE !== coreStage()) return;
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ slug: CONFIG.slug, si: SI, ans: ANS, at: Date.now() })); } catch (e) {}
    }
    function readDraft() {
      try {
        var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (!d || d.slug !== CONFIG.slug || Date.now() - (d.at || 0) > 30 * 864e5) return null;
        return Object.keys(d.ans || {}).length ? d : null;
      } catch (e) { return null; }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

    /* ------------------------------------------------------------- boot */
    render('<div class="card" style="text-align:center;color:var(--muted)">Loading…</div>');
    rpc('get_survey', { p_slug: CONFIG.slug }).then(function (def) {
      if (!def) throw new Error('The survey is closed');
      DEF = def;
      DEF.questions.forEach(function (q) { QBY[q.key] = q; });
      var p = new URLSearchParams(location.search);
      SOURCE = mount.dataset.src || p.get('src') || p.get('utm_source') || 'organic';
      MODULE = mount.dataset.module || p.get('module') || 'full';
      if (!DEF.modules[MODULE]) MODULE = 'full';
      CONFIG.reportFormUrl = CONFIG.reportFormUrl || DEF.report_form_url || null;
      return rpc('get_progress', { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken() })
        .catch(function () { return null; });
    }).then(function (pr) {
      if (!DEF) return;
      if (pr && pr.found) {
        clearDraft();
        ANS = pr.answers || {};
        DONE_STAGES = pr.stages_completed || [];
        DONE_SCREENS = pr.screens_completed || [];
        var todo = sections().filter(function (n) { return !isDone(n); });
        if (!todo.length) return drawEnd(true);
        STAGE = todo[0];
        enterStage(true);
        logEvent('resume');
        return;
      }
      var d = readDraft();
      if (d) { ANS = d.ans; return drawDraftResume(d); }
      STAGE = sections()[0];
      enterStage(false);
    }).catch(function (e) {
      render('<div class="card"><h2>The survey can\u2019t load right now</h2><p class="narr">' + esc(e.message) + '. Please try again shortly.</p></div>');
    });

    function drawDraftResume(d) {
      render('<div class="title">Pick up where you left off?</div>' +
        '<div class="card"><h2>Your answers are still here</h2><p class="narr">They\u2019re saved in this browser only. Nothing has been sent anywhere.</p>' +
        '<div class="nav" style="margin-top:16px"><button class="btn pri" id="go">Carry on</button><button class="btn" id="fresh">Start again</button></div></div>');
      $('#go').onclick = function () { STAGE = coreStage(); SCREENS = screensOf(STAGE); SI = Math.min(d.si || 0, SCREENS.length - 1); startedAt = Date.now(); drawScreen(); };
      $('#fresh').onclick = function () { clearDraft(); ANS = {}; STAGE = sections()[0]; enterStage(false); };
    }

    /* Start a section at its first screen still to answer. */
    function enterStage(resuming) {
      SCREENS = screensOf(STAGE);
      SI = 0;
      if (resuming) {
        var i = SCREENS.findIndex(function (s) { return DONE_SCREENS.indexOf(s) < 0 && visible(s).length; });
        SI = i < 0 ? 0 : i;
      }
      while (SI < SCREENS.length && !visible(SCREENS[SI]).length) SI++;
      if (SI >= SCREENS.length) return finishStage();
      startedAt = Date.now();
      logEvent('stage_view');
      drawScreen();
    }

    /* ------------------------------------------------------------- chrome */
    function stageBar() {
      var s = sections();
      if (s.length < 2) return '';
      var pos = s.indexOf(STAGE), pips = '';
      for (var i = 0; i < s.length; i++) pips += '<i class="' + (isDone(s[i]) && i !== pos ? 'done' : i === pos ? 'now' : '') + '"></i>';
      return '<div class="stagebar"><span>Section ' + (pos + 1) + ' of ' + s.length + '</span><span class="pips">' + pips + '</span></div>';
    }
    function screenProg() {
      var vis = SCREENS.filter(function (s) { return visible(s).length; });
      if (vis.length < 2) return '';
      var at = vis.indexOf(SCREENS[SI]);
      return '<div class="prog">' + vis.map(function (_, i) { return '<i class="' + (i <= at ? 'on' : '') + '"></i>'; }).join('') + '</div>';
    }

    /* ------------------------------------------------------------- fields */
    function optButtons(q, multi) {
      var v = ANS[q.key], sel = multi ? (v || []) : [v];
      return '<div class="opts' + (q.ui === 'yes_no' ? ' inline' : '') + '" role="group" aria-label="' + esc(q.label) + '">' +
        q.options.map(function (o) {
          var on = sel.indexOf(o.key) >= 0;
          return '<button type="button" class="opt' + (multi ? ' multi' : '') + (on ? ' sel' : '') + '" data-' + (multi ? 'qm' : 'q') + '="' + q.key +
            '" data-v="' + esc(o.key) + '" aria-pressed="' + on + '"><span class="tick"></span><span>' + o.label + '</span></button>';
        }).join('') + '</div>';
    }
    function fieldHTML(q) {
      var v = ANS[q.key], inner = '';
      if (q.type === 'single' && q.ui === 'searchable') {
        inner = '<select data-qs="' + q.key + '"><option value="">Select\u2026</option>' + q.options.map(function (o) {
          return '<option value="' + esc(o.key) + '"' + (v === o.key ? ' selected' : '') + '>' + esc(o.label) + '</option>'; }).join('') + '</select>';
      } else if (q.type === 'single') inner = optButtons(q, false);
      else if (q.type === 'multi') inner = optButtons(q, true);
      else if (q.type === 'number') inner = '<input type="number" inputmode="numeric" data-qn="' + q.key + '" min="' + (q.min || 0) + '" max="' + (q.max || 60) + '" value="' + (v == null ? '' : v) + '">';
      else if (q.type === 'slider') inner = guessHTML(q);
      else if (q.type === 'text') inner = '<textarea data-qt="' + q.key + '" maxlength="' + (q.max_length || 1000) + '">' + esc(v || '') + '</textarea>' +
        (q.note ? '<div class="help" style="margin-top:8px">' + q.note + '</div>' : '');
      return '<div class="q" data-wrap="' + q.key + '"><label class="qlab">' + q.label +
        (q.required === false ? ' <span style="font-weight:300;color:var(--muted)">(optional)</span>' : '') + '</label>' +
        (q.help ? '<div class="help">' + q.help + '</div>' : '') + inner + '<div class="err" data-err="' + q.key + '"></div></div>';
    }
    function guessHTML(q) {
      var v = ANS[q.key], placed = v != null;
      return '<div class="guess"><div class="track" role="slider" tabindex="0" data-qg="' + q.key + '" aria-valuemin="0" aria-valuemax="100"' +
        (placed ? ' aria-valuenow="' + v + '"' : '') + ' aria-label="Your guess, as a percentage">' +
        '<div class="rail"></div>' + (placed ? '<div class="fill" style="width:' + v + '%"></div><div class="knob" style="left:' + v + '%"></div>'
        : '<div class="hint">Tap to guess</div>') + '</div><div class="ends"><span>0%</span><span>100%</span></div>' +
        '<div class="read">' + (placed ? v + '%' : '') + '</div></div>';
    }

    /* Two ratings per capability card: importance today, direction. */
    function capCards(qs) {
      var caps = [], by = {};
      qs.forEach(function (q) { if (!by[q.capability]) { by[q.capability] = []; caps.push(q.capability); } by[q.capability].push(q); });
      var capInfo = function (k) { return DEF.capabilities.filter(function (c) { return c.key === k; })[0]; };
      var st = stageDef(STAGE);
      return (SCREENS[SI] === screensOf(STAGE)[0] && st.intro ? '<p class="intro-note">' + st.intro + '</p>' : '<p class="intro-note">For marketing as a whole.</p>') +
        caps.map(function (k) {
          var c = capInfo(k), both = by[k].every(function (q) { return ANS[q.key] != null; });
          return '<div class="cap' + (both ? ' done' : '') + '" data-cap="' + k + '"><h3>' + c.short + '</h3><p class="desc">' + c.description + '</p>' +
            by[k].map(function (q) {
              return '<div class="scale-lab">' + q.label + '</div><div class="scale n' + q.options.length + '" role="group" aria-label="' + esc(c.short + ': ' + q.label) + '">' +
                q.options.map(function (o) {
                  var on = ANS[q.key] === o.key;
                  return '<button type="button" data-q="' + q.key + '" data-v="' + o.key + '" title="' + esc(o.label) + '" aria-label="' + esc(o.label) + '" aria-pressed="' + on + '" class="' + (on ? 'sel' : '') + '">' + o.short + '</button>';
                }).join('') + '</div><div class="err" data-err="' + q.key + '"></div>';
            }).join('') + '</div>';
        }).join('');
    }
    /* One row per capability (proficiency), task (AI reach) or role. */
    function rowList(qs) {
      var first = qs[0], st = stageDef(STAGE), intro = '';
      if (first.ui === 'proficiency_row') {
        intro = '<p class="intro-note">' + (st.proficiency_intro || '') + '</p><details class="lg"><summary>What the four levels mean</summary><dl class="legend">' +
          first.options.map(function (o) { return '<dt>' + o.label + '</dt><dd>' + (o.help || '') + '</dd>'; }).join('') + '</dl></details>';
      } else if (first.group_label) intro = '<p class="qlab" style="margin-bottom:12px">' + first.group_label + '</p>';
      return intro + qs.map(function (q) {
        var cap = q.capability ? DEF.capabilities.filter(function (c) { return c.key === q.capability; })[0] : null;
        return '<div class="rowq" data-wrap="' + q.key + '"><div class="rl"><span>' + q.label + '</span>' +
          (cap ? '<button type="button" class="more" data-more="' + q.key + '" aria-expanded="false">What\u2019s this?</button>' : '') + '</div>' +
          (cap ? '<p class="desc" data-desc="' + q.key + '" hidden>' + cap.description + '</p>' : '') +
          '<div class="pills' + (q.ui === 'proficiency_row' ? ' grid4' : '') + '" role="group" aria-label="' + esc(q.label) + '">' + q.options.map(function (o) {
            var on = ANS[q.key] === o.key;
            return '<button type="button" data-q="' + q.key + '" data-v="' + o.key + '" aria-pressed="' + on + '" class="' + (on ? 'sel' : '') + '"' +
              (o.short ? ' title="' + esc(o.label) + '"' : '') + '>' + (o.short || o.label) + '</button>';
          }).join('') + '</div><div class="err" data-err="' + q.key + '"></div></div>';
      }).join('');
    }

    /* ------------------------------------------------------------- a screen */
    function drawScreen() {
      showReport(false);
      var scr = SCREENS[SI], qs = visible(scr), st = stageDef(STAGE);
      var firstVisible = SCREENS.findIndex(function (s) { return visible(s).length; }) === SI;
      var veryFirst = STAGE === sections()[0] && firstVisible && !DONE_STAGES.length;
      var ui = qs[0] && qs[0].ui, body;
      if (ui === 'card_importance' || ui === 'card_direction') body = capCards(qs);
      else if (ui === 'proficiency_row' || ui === 'task_row' || ui === 'role_row') body = '<div class="card">' + rowList(qs) + '</div>';
      else body = '<div class="card">' + qs.map(fieldHTML).join('') + '</div>';
      var md = moduleDef();
      render(
        (veryFirst && mount.dataset.hideTitle === undefined ? '<h1 class="title">' + (md.title || DEF.title) + '</h1>' : '') +
        (firstVisible ? (veryFirst ? '' : '<div class="title">' + st.title + '</div>') + '<p class="lede">' + (st.subtitle || '') + '</p>' : '') +
        stageBar() + screenProg() + body +
        '<div class="hp"><label>Leave this empty<input type="text" id="hp" tabindex="-1" autocomplete="off"></label></div>' +
        '<div class="nav">' + (SI > 0 && SCREENS.slice(0, SI).some(function (s) { return visible(s).length; }) ? '<button class="btn back" id="back">Back</button>' : '') +
        '<button class="btn pri" id="next">Continue</button></div>' +
        (veryFirst ? '<p class="consent">' + DEF.consent_text + '</p>' : '<p class="consent">Saved as you go. Come back in this browser any time.</p>'));
      wire();
      logEvent('screen_view', { p_screen: scr });
      toTop();
    }

    function setErr(k, msg) {
      var e = app.querySelector('[data-err="' + k + '"]');
      if (e) { e.textContent = msg || ''; e.classList.toggle('on', !!msg); }
    }
    function redrawKeepingScroll() { var y = window.scrollY; drawScreen(); window.scrollTo(0, y); }
    function revealsSomething(k) {
      return DEF.questions.some(function (q) {
        var c = q.show_if; if (!c) return false;
        return (Array.isArray(c) ? c : [c]).some(function (x) { return x.key === k; });
      });
    }

    function wire() {
      app.querySelectorAll('[data-q]').forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.q; ANS[k] = b.dataset.v; setErr(k); saveDraft();
          if (revealsSomething(k)) return redrawKeepingScroll();
          app.querySelectorAll('[data-q="' + k + '"]').forEach(function (x) {
            var on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on);
          });
          var card = b.closest('.cap');
          if (card) {
            var keys = Array.prototype.map.call(card.querySelectorAll('[data-q]'), function (x) { return x.dataset.q; });
            var both = keys.every(function (kk) { return ANS[kk] != null; });
            card.classList.toggle('done', both);
            if (both) {
              var nx = card.nextElementSibling;
              while (nx && !nx.classList.contains('cap')) nx = nx.nextElementSibling;
              if (nx && !nx.classList.contains('done')) nx.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        };
      });
      app.querySelectorAll('[data-qm]').forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.qm, q = QBY[k], v = b.dataset.v, cur = (ANS[k] || []).slice();
          var excl = q.options.filter(function (o) { return o.exclusive; }).map(function (o) { return o.key; });
          var i = cur.indexOf(v);
          if (i >= 0) cur.splice(i, 1);
          else if (excl.indexOf(v) >= 0) cur = [v];
          else {
            cur = cur.filter(function (x) { return excl.indexOf(x) < 0; });
            if (q.max_choices && cur.length >= q.max_choices) {
              return setErr(k, q.max_choices === q.min_choices ? 'Choose exactly ' + words(q.max_choices) + '. Untick one to change it.' : 'You can choose up to ' + words(q.max_choices) + '.');
            }
            cur.push(v);
          }
          ANS[k] = cur.length ? cur : undefined; setErr(k); saveDraft();
          app.querySelectorAll('[data-qm="' + k + '"]').forEach(function (x) {
            var on = cur.indexOf(x.dataset.v) >= 0; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', on);
          });
        };
      });
      app.querySelectorAll('[data-qs]').forEach(function (el) {
        el.onchange = function () { ANS[el.dataset.qs] = el.value || undefined; setErr(el.dataset.qs); saveDraft(); };
      });
      app.querySelectorAll('[data-qn]').forEach(function (el) {
        el.oninput = function () {
          var k = el.dataset.qn;
          ANS[k] = el.value === '' ? undefined : Number(el.value); setErr(k); saveDraft();
        };
      });
      app.querySelectorAll('[data-qt]').forEach(function (el) {
        el.oninput = function () { ANS[el.dataset.qt] = el.value.trim() ? el.value : undefined; };
      });
      app.querySelectorAll('[data-more]').forEach(function (b) {
        b.onclick = function () {
          var d = app.querySelector('[data-desc="' + b.dataset.more + '"]');
          d.hidden = !d.hidden; b.setAttribute('aria-expanded', !d.hidden);
          b.textContent = d.hidden ? 'What\u2019s this?' : 'Hide';
        };
      });
      app.querySelectorAll('[data-qg]').forEach(wireGuess);
      if ($('#back')) $('#back').onclick = function () {
        do { SI--; } while (SI > 0 && !visible(SCREENS[SI]).length);
        drawScreen();
      };
      $('#next').onclick = onNext;
      // A number field changes what the next screen asks (years in marketing), so
      // re-evaluate visibility when leaving it rather than on every keystroke.
    }

    /* The guess: no handle until the first tap, so nothing is pre-set. */
    function wireGuess(tr) {
      var k = tr.dataset.qg, dragging = false;
      function setFrom(clientX) {
        var r = tr.getBoundingClientRect();
        setVal(Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100));
      }
      function setVal(v) {
        if (GUESS.placed && v !== ANS[k]) GUESS.moved = true;
        GUESS.placed = true;
        ANS[k] = v; setErr(k);
        tr.setAttribute('aria-valuenow', v);
        tr.innerHTML = '<div class="rail"></div><div class="fill" style="width:' + v + '%"></div><div class="knob" style="left:' + v + '%"></div>';
        tr.parentNode.querySelector('.read').textContent = v + '%';
      }
      tr.addEventListener('pointerdown', function (e) { dragging = true; tr.setPointerCapture && tr.setPointerCapture(e.pointerId); setFrom(e.clientX); });
      tr.addEventListener('pointermove', function (e) { if (dragging) setFrom(e.clientX); });
      tr.addEventListener('pointerup', function () { dragging = false; });
      tr.addEventListener('keydown', function (e) {
        var v = ANS[k] == null ? 50 : ANS[k], d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key];
        if (d == null) return;
        e.preventDefault(); setVal(Math.max(0, Math.min(100, ANS[k] == null ? 50 : v + d)));
      });
    }

    function words(n) { return ['zero', 'one', 'two', 'three', 'four', 'five'][n] || String(n); }

    function validate(qs) {
      var ok = true;
      qs.forEach(function (q) {
        var v = ANS[q.key], empty = v == null || v === '' || (Array.isArray(v) && !v.length);
        var msg = null;
        if (empty) { if (q.required !== false) msg = q.type === 'slider' ? 'Tap the line to make your guess.' : 'Please answer this one.'; }
        else if (q.type === 'multi') {
          var excl = q.options.filter(function (o) { return o.exclusive; }).map(function (o) { return o.key; });
          var only = v.length === 1 && excl.indexOf(v[0]) >= 0;
          if (!only && q.min_choices && v.length < q.min_choices) msg = 'Choose ' + words(q.min_choices) + '.';
        } else if (q.type === 'number' && (v < (q.min || 0) || v > (q.max || 60) || v !== Math.floor(v))) {
          msg = 'Please enter a whole number between ' + (q.min || 0) + ' and ' + (q.max || 60) + '.';
        }
        if (msg) { setErr(q.key, msg); ok = false; }
      });
      if (!ok) { var e = app.querySelector('.err.on'); if (e) e.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return ok;
    }

    function payloadFor(scr) {
      var p = {};
      visible(scr).forEach(function (q) { if (ANS[q.key] != null) p[q.key] = ANS[q.key]; });
      return p;
    }

    function onNext() {
      var scr = SCREENS[SI], qs = visible(scr);
      if (!validate(qs)) return;
      var btn = $('#next');
      if (STAGE === coreStage()) {
        var nx = nextVisibleIndex(SI);
        if (nx >= 0) { SI = nx; saveDraft(); return drawScreen(); }
        return submitCore(btn);
      }
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Saving';
      var flags = scr === '4.1' || qs.some(function (q) { return q.type === 'slider'; }) ? { guess_moved: GUESS.moved } : null;
      rpc('submit_screen', { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(), p_screen: scr,
                             p_answers: payloadFor(scr), p_duration_ms: Date.now() - startedAt, p_flags: flags })
        .then(function (r) {
          if (!r || r.ok === false) return failed(r);
          DONE_STAGES = r.stages_completed || DONE_STAGES; DONE_SCREENS = r.screens_completed || DONE_SCREENS;
          logEvent('screen_complete', { p_screen: scr, p_ms: Date.now() - startedAt });
          startedAt = Date.now();
          if (r.reveal && r.reveal.cards && r.reveal.cards.length) return drawReveal(r.reveal, advance);
          advance();
        }).catch(function (e) { failed({ error: 'network', message: e.message }); });
    }
    function nextVisibleIndex(from) {
      for (var i = from + 1; i < SCREENS.length; i++) if (visible(SCREENS[i]).length) return i;
      return -1;
    }
    function advance() {
      var nx = nextVisibleIndex(SI);
      if (nx >= 0) { SI = nx; return drawScreen(); }
      finishStage();
    }
    function finishStage() {
      logEvent('stage_complete');
      if (DONE_STAGES.indexOf(STAGE) < 0) DONE_STAGES.push(STAGE);
      var n = nextStageN();
      if (n == null) return drawEnd(false);
      STAGE = n; enterStage(true);
    }

    function submitCore(btn) {
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Saving';
      var p = {};
      DEF.questions.filter(function (q) { return q.stage === coreStage() && shown(q) && ANS[q.key] != null; })
        .forEach(function (q) { p[q.key] = ANS[q.key]; });
      rpc('submit_core', { p_survey_slug: CONFIG.slug, p_anon_token: deviceToken(), p_answers: p, p_source: SOURCE,
                           p_module: MODULE, p_referrer: document.referrer || null,
                           p_duration_ms: Date.now() - startedAt, p_honeypot: ($('#hp') && $('#hp').value) || null })
        .then(function (r) {
          if (!r || r.ok === false) return failed(r);
          clearDraft();
          DONE_STAGES = r.stages_completed || [coreStage()]; DONE_SCREENS = r.screens_completed || [];
          startedAt = Date.now();
          if (r.reveal && r.reveal.cards && r.reveal.cards.length) return drawReveal(r.reveal, finishStage);
          finishStage();
        }).catch(function (e) { failed({ error: 'network', message: e.message }); });
    }

    function failed(r) {
      var btn = $('#next');
      if (btn) { btn.disabled = false; btn.textContent = 'Try again'; }
      var msg = {
        too_fast: 'Please take a moment over the questions, then try again.',
        rate_limited: 'A lot of people have just answered from your network. Please try again in an hour.',
        survey_not_open: 'This survey has closed.',
        no_core: 'Please answer the questions about you first.',
        network: 'The answers couldn\u2019t be saved: there\u2019s no connection to the server. Check your connection and try again.'
      }[r && r.error] || (r && r.message) || 'The answers couldn\u2019t be saved. Please try again.';
      if (r && r.question) { setErr(r.question, r.message === 'Please answer this one.' ? r.message : 'Please check this answer.'); }
      var box = app.querySelector('#fail');
      if (!box) { box = document.createElement('p'); box.id = 'fail'; box.className = 'err on'; var nav = app.querySelector('.nav'); nav.parentNode.insertBefore(box, nav); }
      box.textContent = msg;
    }

    /* =================================================================
       Reveals
       ================================================================= */
    var COPY = {
      years: 'Your years in marketing',
      attention_shift: 'Where your attention is going',
      outlook: 'Your outlook',
      gap_profile: 'Your skills gap',
      ai_guess: 'How close was your guess?',
      ai_efficiency: 'How much more efficient AI has made people',
      ai_reach_you: 'How much of your work you expect AI to take on',
      ai_concerns: 'Concerns you share with your peers',
      ai_reach: 'How far your peers expect AI to go',
      budget: 'Your budget against companies your size',
      challenges: 'You\u2019re not alone',
      prepared: 'How prepared your peers say they are',
      roles: 'Roles your peers have added',
      career: 'Staying or moving',
      advice: 'Advice from a peer',
      personalisation: 'Methods your peers use that you don\u2019t',
      attribution: 'Single-touch or beyond',
      privacy: 'How much privacy regulation affects your peers',
      formats: 'What works for your peers'
    };
    var SPEC = {};
    function specFor(screen, key) {
      return ((DEF.reveals || {})[screen] || []).filter(function (s) { return s.key === key; })[0] || {};
    }
    var label = function (qk, ok) {
      var q = QBY[qk]; if (!q) return ok;
      var o = (q.options || []).filter(function (x) { return x.key === ok; })[0];
      return o ? o.label : ok;
    };
    var capShort = function (k) { var c = DEF.capabilities.filter(function (x) { return x.key === k; })[0]; return c ? c.short : k; };

    function drawReveal(rv, onDone) {
      SPEC = {};
      var html = rv.cards.map(function (c, i) {
        SPEC[c.key] = specFor(rv.screen, c.key);
        return '<div data-card="' + i + '">' + cardHTML(c, null) + '</div>';
      }).join('');
      render(stageBar() + html + '<div class="nav"><button class="btn pri" id="go">Continue</button></div>');
      rv.cards.forEach(function (c, i) { wireCard(c, i); });
      $('#go').onclick = function () { logEvent('continue_click', { p_screen: rv.screen }); onDone(); };
      logEvent('reveal_view', { p_screen: rv.screen });
      toTop();
    }
    function wireCard(c, i) {
      var host = app.querySelector('[data-card="' + i + '"]');
      host.querySelectorAll('[data-grp]').forEach(function (b) {
        b.onclick = function () { host.innerHTML = cardHTML(c, b.dataset.grp); wireCard(c, i); };
      });
    }
    function pickGroup(c, want) {
      var av = (c.groups || []).filter(function (g) { return g.available; });
      var g = av.filter(function (x) { return x.group === want; })[0] || av.filter(function (x) { return x.group === c.default_group; })[0] || av[0];
      return { g: g || null, av: av };
    }
    function basisLine(c, g) {
      var spec = SPEC[c.key] || {}, who;
      if (g.group === 'everyone') who = 'marketers who\u2019ve taken the survey' + (spec.senior_skew_note && g.source === 'seed' ? ', most of them in senior roles' : '');
      else who = /^marketers/.test(g.label || '') ? g.label : 'marketers at ' + (g.label || 'companies like yours');
      return '<p class="basis">Compared with ' + who + '.' + (g.precision === 'rounded' ? ' Rounded to the nearest 5% until more people have answered.' : '') + '</p>';
    }
    function segHTML(c, g, av) {
      if (av.length < 2) return '';
      return '<div class="seg" role="group" aria-label="Compare with">' + av.map(function (x) {
        var t = x.group === 'everyone' ? 'Everyone' : x.group === 'company_size' ? 'Companies your size' : x.group === 'region' ? (x.value === 'us' ? 'United States' : 'Outside the US') : (x.label || x.group);
        return '<button type="button" data-grp="' + x.group + '" aria-pressed="' + (x === g) + '">' + t + '</button>';
      }).join('') + '</div>';
    }
    function waitHTML(c) {
      var n = Math.min.apply(null, (c.groups || []).map(function (g) { return g.needed || 99; }));
      return '<p class="wait">Peer comparisons appear here once enough people have answered' + (n < 99 ? ' (another ' + n + ' or so)' : '') + '. Come back to see them.</p>';
    }
    function bars(rows, you) {
      return rows.map(function (r) {
        return '<div class="dbar' + (r.is_you ? ' you' : '') + '"><div><div class="lab">' + r.label + (r.is_you ? '<span class="youtag">You</span>' : '') +
          '</div><div class="bar"><i style="width:' + Math.max(0, Math.min(100, r.share || 0)) + '%"></i></div></div><div class="pc">' + (r.share == null ? '\u2013' : r.share + '%') + '</div></div>';
      }).join('');
    }
    function position(g) {
      if (g.below == null) return '';
      if (g.precision === 'rounded') {
        var t = g.above >= 50 ? 'Most of your peers are above you.' : g.below >= 50 ? 'Most of your peers are below you.' : 'You\u2019re around the middle of your peers.';
        return '<p class="narr" style="margin:0 0 10px"><b>' + t + '</b></p>';
      }
      if (!g.below) return '<p class="narr">You\u2019re in the lowest group. <b>' + g.above + '%</b> of your peers are above you.</p>';
      if (!g.above) return '<p class="narr">You\u2019re in the highest group. <b>' + g.below + '%</b> of your peers are below you.</p>';
      return '<p class="narr"><b>' + g.below + '%</b> of your peers are below you, and <b>' + g.above + '%</b> above.</p>';
    }
    function head(c) { return '<h2>' + (COPY[c.key] || '') + '</h2>'; }

    function cardHTML(c, want) {
      var pg = pickGroup(c, want), g = pg.g, av = pg.av, you = c.you || {}, h = '';
      switch (c.type) {
        case 'dist': {
          var q = QBY[(SPEC[c.key] || {}).question];
          h = head(c);
          if (!g) {
            var yl = you.value == null ? null : (typeof you.value === 'number' ? you.value + (q && q.key === 'q02_years' ? ' years' : '') : label(q.key, you.value));
            return '<div class="card">' + h + (yl ? '<p class="narr">Your answer: <b>' + yl + '</b>.</p>' : '') + waitHTML(c) + '</div>';
          }
          var marked = g.rows.some(function (r) { return r.is_you; });
          return '<div class="card">' + h + basisLine(c, g) + segHTML(c, g, av) +
            (g.precision === 'rounded' ? position(g) : '') + bars(g.rows) +
            (g.precision !== 'rounded' ? position(g) : '') +
            (!marked && you.value != null ? '<p class="narr">Your answer isn\u2019t part of this comparison.</p>' : '') +
            (g.combined && g.source === 'seed' ? '<p class="foot">Shown in broader groups for now.</p>' : '') + '</div>';
        }
        case 'guess': {
          h = '<div class="hero"><div class="basis" style="margin:0 0 6px">' + COPY[c.key] + '</div>';
          if (!g) return h + '<div class="fig">' + you.guess + '%</div><p class="narr">That was your guess. The real figure appears once enough people have answered.</p></div>';
          return h + '<div class="fig">' + g.actual + '%</div><p class="narr">Among marketers who\u2019ve taken the survey, <b>' + g.actual +
            '%</b> have AI fully built into their workflows. You guessed <b>' + you.guess + '%</b>.</p></div>' +
            '<div class="card"><h2>Where your team sits</h2>' + basisLine(c, g) + bars(g.rows) + '</div>';
        }
        case 'shares': {
          var qk = (SPEC[c.key] || {}).question;
          h = head(c);
          var mine = Array.isArray(you.value) ? you.value : (you.value ? [you.value] : []);
          if (!g) return '<div class="card">' + h + (mine.length ? '<div class="chips">' + mine.map(function (k) { return '<span class="chip">' + label(qk, k) + '</span>'; }).join('') + '</div>' : '') + waitHTML(c) + '</div>';
          var rows = g.rows.slice().sort(function (a, b) { return (b.share || 0) - (a.share || 0); });
          return '<div class="card">' + h + basisLine(c, g) + segHTML(c, g, av) + bars(rows) +
            (g.new_options && g.new_options.length ? '<div class="sub"><h4>Options added this year</h4>' + bars(g.new_options) +
              (g.new_options_precision === 'rounded' ? '<p class="foot">Rounded to the nearest 5% until more people have answered.</p>' : '') + '</div>' : '') + '</div>';
        }
        case 'count_gap': {
          var qk2 = (SPEC[c.key] || {}).question, mine2 = (you.value || []).filter(function (x) { return !(QBY[qk2].options.filter(function (o) { return o.key === x && o.exclusive; })[0]); });
          h = head(c) + '<p class="narr">You use <b>' + words(mine2.length) + '</b> of these methods.</p>';
          if (!g) return '<div class="card">' + h + waitHTML(c) + '</div>';
          return '<div class="card">' + h + basisLine(c, g) + '<p class="narr">Most of your peers use between <b>' + g.p25 + '</b> and <b>' + g.p75 + '</b>, with a typical peer using <b>' + g.median + '</b>.</p>' +
            (g.gaps.length ? '<div class="sub"><h4>Used by your peers, not by you</h4>' + bars(g.gaps) + '</div>' : '<p class="narr">There\u2019s nothing your peers use that you don\u2019t.</p>') + '</div>';
        }
        case 'personal_shift': {
          var sp = SPEC[c.key] || {}, k3 = sp.keys || {};
          var col = function (t, arr, qk) { return arr && arr.length ? '<div><h4>' + t + '</h4><div class="chips">' + arr.filter(function (x) { return !QBY[qk].options.filter(function (o) { return o.key === x && o.exclusive; })[0]; }).map(function (x) { return '<span class="chip">' + label(qk, x) + '</span>'; }).join('') + '</div></div>' : ''; };
          h = head(c) + '<div class="shift">' + col('Three years ago', you.past, k3.past) + col('Today', you.today, k3.today) + col('In three years', you.future, k3.future) + '</div>';
          if (!g || !g.peers) return '<div class="card">' + h + waitHTML(c) + '</div>';
          var pp = g.peers;
          return '<div class="card">' + h + '<div class="sub">' + basisLine(c, g) +
            (pp[k3.today] ? '<h4>Where peers\u2019 attention goes today</h4>' + bars(pp[k3.today].map(mark(you.today))) : '') +
            (pp[k3.past] ? '<div class="sub"><h4>Three years ago</h4>' + bars(pp[k3.past].map(mark(you.past))) + '</div>' : '') + '</div></div>';
        }
        case 'outlook': {
          var item = function (x) { return '<li><b>' + capShort(x.key) + '</b><span class="peer">' + label('q13_' + x.key, String(x.direction)) + '</span></li>'; };
          return '<div class="card">' + head(c) + '<p class="basis">From your own ratings. Your peers\u2019 view comes after you\u2019ve rated yourself.</p>' +
            (you.rising.length ? '<div class="sub"><h4>Rising most</h4><ul class="list">' + you.rising.map(item).join('') + '</ul></div>' : '') +
            (you.fading.length ? '<div class="sub"><h4>Fading most</h4><ul class="list">' + you.fading.map(item).join('') + '</ul></div>' : '') +
            (!you.rising.length && !you.fading.length ? '<p class="narr">You expect the mix of skills to stay much as it is.</p>' : '') + '</div>';
        }
        case 'gap_profile': {
          var pc = {}; if (g && g.capabilities) g.capabilities.forEach(function (x) { pc[x.key] = x; });
          var peerLine = function (k) {
            var x = pc[k]; if (!x) return '';
            return '<span class="peer">' + x.grow + '% of peers expect it to grow' + (x.gap_among_growers != null ? '; ' + x.gap_among_growers + '% of them rate themselves at the first two levels' : '') + '.</span>';
          };
          var li = function (x) { return '<li><b>' + capShort(x.key) + '</b>' + peerLine(x.key) + '</li>'; };
          var gaps = you.gaps.length ? you.gaps : (you.fallback ? [you.fallback] : []);
          h = '<div class="card">' + head(c) + (g ? basisLine(c, g) + segHTML(c, g, av) : '<p class="basis">From your own ratings.</p>') +
            '<div class="sub"><h4>' + (you.gaps.length ? 'Your biggest gaps, in what\u2019s growing across marketing' : 'No big gaps. The growing capability where you rated yourself lowest') + '</h4>' +
            (gaps.length ? '<ul class="list">' + gaps.map(li).join('') + '</ul>' : '<p class="narr">You didn\u2019t rate any capability as growing.</p>') + '</div>' +
            (you.strengths.length ? '<div class="sub"><h4>Strengths in what\u2019s growing</h4><ul class="list">' + you.strengths.map(li).join('') + '</ul></div>' : '') +
            (you.fading_strengths.length ? '<div class="sub"><h4>Strengths you expect to matter less</h4><ul class="list">' + you.fading_strengths.map(li).join('') +
              '</ul><p class="foot">Based on your own forecast, not ours.</p></div>' : '') +
            (g && g.attention_future ? '<div class="sub"><h4>Where peers expect their attention to go in three years</h4>' + bars(g.attention_future.map(mark(ANS.q11_work_future))) + '</div>' : '') +
            (!g ? waitHTML(c) : '') + '</div>';
          return h;
        }
        case 'task_reach': {
          var aiv = (SPEC[c.key] || {}).ai_values || [];
          h = head(c);
          if (c.key === 'ai_reach_you' || !g) {
            h += '<p class="narr">You expect AI to perform <b>' + words(you.ai_count) + '</b> of the <b>' + words(you.done_count) + '</b> pieces of work you do, on its own or subject to your review.</p>' +
              '<ul class="list">' + you.tasks.filter(function (t) { return aiv.indexOf(t.value) >= 0; }).map(function (t) { return '<li><b>' + QBY[t.key].label + '</b><span class="peer">' + label(t.key, t.value) + '</span></li>'; }).join('') + '</ul>';
            return '<div class="card">' + h + (c.key === 'ai_reach_you' ? '' : waitHTML(c)) + '</div>';
          }
          return '<div class="card">' + h + basisLine(c, g) + '<p class="basis" style="margin-top:-8px">Share of peers who do this work and expect AI to perform it, on its own or subject to review.</p>' +
            bars(g.tasks.filter(function (t) { return t.ai != null; }).sort(function (a, b) { return b.ai - a.ai; }).map(function (t) {
              return { label: t.label, share: t.ai, is_you: aiv.indexOf(ANS[t.key]) >= 0 };
            })) + '<p class="foot">Marked: the work you expect AI to perform.</p></div>';
        }
        case 'roles': {
          var added = you.added || [];
          h = head(c);
          if (!g) return '<div class="card">' + h + (added.length ? '<p class="narr">Your team has added: <b>' + added.map(function (k) { return QBY[k].label; }).join(', ') + '</b>.</p>' : '') + waitHTML(c) + '</div>';
          return '<div class="card">' + h + basisLine(c, g) + '<p class="basis" style="margin-top:-8px">Share of peers\u2019 teams that added each role in the past three years.</p>' +
            bars(g.roles.filter(function (r) { return r.added != null; }).sort(function (a, b) { return b.added - a.added; }).map(function (r) {
              return { label: r.label, share: r.added, is_you: added.indexOf(r.key) >= 0 };
            })) + '<p class="foot">Marked: roles your team has added.</p></div>';
        }
        case 'quote':
          return c.quote ? '<div class="card">' + head(c) + '<blockquote>\u201c' + esc(c.quote) + '\u201d</blockquote><p class="basis" style="margin-top:12px">From a marketer who took the survey.</p></div>' : '';
      }
      return '';
    }
    function mark(mine) { mine = mine || []; return function (r) { return { label: r.label, share: r.share, is_you: mine.indexOf(r.key) >= 0 }; }; }

    /* ------------------------------------------------------------- the end */
    var reportForm = function () { return document.querySelector('[data-cmoa-report]'); };
    function showReport(on) { var f = reportForm(); if (f) f.hidden = !on; }

    function drawEnd(returning) {
      logEvent('results_view');
      var mods = DEF.modules, offers = MODULE === 'full' ? [] : Object.keys(mods).filter(function (k) {
        return k !== MODULE && k !== 'full' && mods[k].sections.slice(1).some(function (n) { return !isDone(n); });
      }).slice(0, 2);
      var form = reportForm(), url = CONFIG.reportFormUrl;
      render('<div class="title">' + (returning ? 'You\u2019ve answered everything' : 'That\u2019s everything. Thank you') + '</div>' +
        '<p class="lede">Your answers are part of the Future of Marketing report.</p>' +
        ((form || url) ? '<div class="card" id="asks"><h2>Get the report when it\u2019s published</h2><p class="narr">' +
          (form ? 'The form is just below. It\u2019s separate from the survey, so your answers stay anonymous.' : 'Ask for a copy using the link below. It\u2019s separate from the survey, so your answers stay anonymous.') +
          '</p><div class="nav" style="margin-top:14px">' + (form ? '<button class="btn pri" id="toReport">Go to the form</button>' : '') +
          (url ? '<a class="btn' + (form ? '' : ' pri') + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + (form ? 'Open it in a new tab' : 'Ask for the report') + '</a>' : '') + '</div></div>' : '') +
        (offers.length ? '<div class="card"><h2>One more comparison?</h2><p class="narr">You\u2019ve already answered the questions about you, so these are shorter.</p>' +
          offers.map(function (k) { return '<button class="btn" style="width:100%;margin-top:9px" data-mod="' + k + '">' + mods[k].title + '</button>'; }).join('') + '</div>' : '') +
        '<p class="foot">Know other marketers? The more people who take part, the sharper everyone\u2019s comparison gets.</p>');
      showReport(true);
      if ($('#toReport')) $('#toReport').onclick = function () { reportForm().scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      app.querySelectorAll('[data-mod]').forEach(function (b) {
        b.onclick = function () { MODULE = b.dataset.mod; var n = sections().filter(function (x) { return !isDone(x); })[0]; if (n == null) return; STAGE = n; enterStage(true); };
      });
      toTop();
    }
  }

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var nodes = document.querySelectorAll('[data-cmoa-benchmark]');
    for (var i = 0; i < nodes.length; i++) boot(nodes[i]);
  });
})();
