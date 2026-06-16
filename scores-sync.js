(function () {
  "use strict";

  const RESULTS_KEY = "wc2026.results.v1";
  const DISMISSED_KEY = "wc2026.dismissed.v1";
  const META_KEY = "wc2026.sync.meta.v1";
  const FEED_URL =
    "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
  const POLL_INTERVAL_MS = 5 * 60 * 1000;

  const PLACEHOLDER = /^(?:[12][A-L]|3[A-L](?:\/[A-L])+|W\d+|L\d+)$/;

  function stageFromRound(round) {
    switch (round) {
      case "Round of 32":
        return "R32";
      case "Round of 16":
        return "R16";
      case "Quarter-final":
        return "QF";
      case "Semi-final":
        return "SF";
      case "Match for third place":
        return "3rd";
      case "Final":
        return "final";
      default:
        return "group";
    }
  }

  function assignMatchId(match, groupCounter) {
    const stage = stageFromRound(match.round);
    if (stage === "group") {
      const id = `M${String(groupCounter.value).padStart(2, "0")}`;
      groupCounter.value += 1;
      return id;
    }
    if (match.num != null) {
      return `M${String(match.num).padStart(2, "0")}`;
    }
    return null;
  }

  function isPlaceholderTeam(name) {
    return PLACEHOLDER.test(String(name).trim());
  }

  function readResults() {
    try {
      const raw = localStorage.getItem(RESULTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function readDismissed() {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function writeResults(results) {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  }

  function readMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function writeMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function scoreFromMatch(match) {
    const ft = match.score && match.score.ft;
    if (!ft || ft.length < 2) return null;

    const result = { home: ft[0], away: ft[1] };

    const et = match.score.et;
    if (et && et.length >= 2) {
      result.et = { home: et[0], away: et[1] };
    }

    const pens = match.score.pens || match.score.pen;
    if (pens && pens.length >= 2) {
      result.pens = { home: pens[0], away: pens[1] };
    }

    return result;
  }

  function resultsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function mergeRemoteScores(matches) {
    const existing = readResults();
    const dismissed = new Set(readDismissed());
    const next = { ...existing };
    let changed = 0;
    const groupCounter = { value: 1 };

    for (const match of matches) {
      if (isPlaceholderTeam(match.team1) || isPlaceholderTeam(match.team2)) {
        if (stageFromRound(match.round) === "group") {
          groupCounter.value += 1;
        }
        continue;
      }

      const id = assignMatchId(match, groupCounter);
      if (!id) continue;

      const incoming = scoreFromMatch(match);
      if (!incoming) continue;

      if (dismissed.has(id)) continue;

      if (existing[id] != null) continue;

      next[id] = incoming;
      changed += 1;
    }

    return { next, changed };
  }

  async function syncScores(options) {
    const reload = options && options.reload !== false;
    const ui = window.__wcScoreSync;

    if (ui) ui.setStatus("Syncing…");

    try {
      const response = await fetch(FEED_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const matches = Array.isArray(data.matches) ? data.matches : [];
      const { next, changed } = mergeRemoteScores(matches);

      if (changed > 0) {
        writeResults(next);
        writeMeta({
          lastSync: new Date().toISOString(),
          lastAdded: changed,
        });
        if (ui) ui.setStatus(`Added ${changed} score${changed === 1 ? "" : "s"}`);
        if (reload) {
          window.location.reload();
          return { changed, reloaded: true };
        }
      } else {
        writeMeta({
          ...readMeta(),
          lastSync: new Date().toISOString(),
          lastAdded: 0,
        });
        if (ui) ui.setStatus("Up to date");
      }

      return { changed, reloaded: false };
    } catch (err) {
      if (ui) ui.setStatus("Sync failed");
      console.warn("[wc-score-sync]", err);
      return { changed: 0, reloaded: false, error: err };
    }
  }

  function formatLastSync(iso) {
    if (!iso) return "Never synced";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Never synced";
    return `Last synced ${date.toLocaleString()}`;
  }

  function updateSyncBtnLabel() {
    const btn = document.getElementById("wc-score-sync-btn");
    if (!btn) return;
    btn.textContent = window.matchMedia("(max-width: 640px)").matches
      ? "Sync"
      : "Sync scores";
  }

  function injectUi() {
    if (document.getElementById("wc-score-sync")) return true;

    const nav = document.querySelector(".app-nav");
    if (!nav) return false;

    const wrap = document.createElement("div");
    wrap.id = "wc-score-sync";
    wrap.innerHTML =
      '<button type="button" id="wc-score-sync-btn">Sync scores</button>' +
      '<span id="wc-score-sync-status"></span>';

    const style = document.createElement("style");
    style.textContent =
      "#wc-score-sync{display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:4px;font-family:Inter,system-ui,sans-serif}" +
      "#wc-score-sync-btn{padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:#fff;background:linear-gradient(180deg,#E11D2E,#B0101F);border:0;border-radius:999px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35);white-space:nowrap}" +
      "#wc-score-sync-btn:hover{transform:translateY(-1px)}" +
      "#wc-score-sync-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}" +
      "#wc-score-sync-status{font-size:10px;color:#8089BC;white-space:nowrap;display:none}" +
      "@media (min-width:641px){#wc-score-sync{flex-direction:column;align-items:flex-end;gap:6px;margin-left:12px}#wc-score-sync-status{display:block;background:#0E1233db;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(8px)}}" +
      "@media (max-width:640px){#wc-score-sync-btn{padding:8px 12px;font-size:11px}}";

    document.head.appendChild(style);
    nav.appendChild(wrap);

    const btn = document.getElementById("wc-score-sync-btn");
    const status = document.getElementById("wc-score-sync-status");

    window.__wcScoreSync = {
      setStatus(text) {
        status.textContent = text;
      },
    };

    status.textContent = formatLastSync(readMeta().lastSync);

    btn.addEventListener("click", function () {
      btn.disabled = true;
      syncScores({ reload: true }).finally(function () {
        btn.disabled = false;
        status.textContent = formatLastSync(readMeta().lastSync);
      });
    });

    updateSyncBtnLabel();
    window.addEventListener("resize", updateSyncBtnLabel);

    return true;
  }

  function ensureUi(callback) {
    if (injectUi()) {
      callback();
      return;
    }

    const root = document.getElementById("root") || document.body;
    const observer = new MutationObserver(function () {
      if (injectUi()) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  let pollTimer = null;

  function startPolling() {
    if (pollTimer) return;
    pollTimer = window.setInterval(function () {
      if (document.visibilityState === "visible") {
        syncScores({ reload: true });
      }
    }, POLL_INTERVAL_MS);
  }

  function init() {
    ensureUi(function () {
      syncScores({ reload: true }).finally(function () {
        const status = document.getElementById("wc-score-sync-status");
        if (status) status.textContent = formatLastSync(readMeta().lastSync);
        startPolling();
      });

      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") {
          syncScores({ reload: true });
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
