"use strict";
/**
 * agy-auth-tells.js — SINGLE SOURCE of the agy (Antigravity) auth-fallback tell detection
 * (SP-20260723-002 / ADR-0037). Extracted from scripts/checks/cert-attest.js so the dispatch-record
 * detector, cert-attest, and the ED-060 serve runbook all key on ONE terminal-tell set + ONE
 * run-window filter — no second copy that drifts (the refactor-hygiene bug class).
 *
 * WHY THIS EXISTS: an UNAUTHENTICATED agy serve (expired keyring) exits 0 with output, so
 * dispatch-agent stamps the completion record fallback:false — a FALSE-GREEN. agy writes the tells
 * that reveal the fallback to its cli.log, NOT to stdout (empirically confirmed: an unauth serve's
 * OUTPUT carried zero tells while the run-window LOG carried eval-mode + expired=true + resolved-via-
 * default). So the detector must scan the LOG (bound to this run's window), not just the output.
 *
 * TERMINAL tells (NON_AUTH_SIGNAL): UNAMBIGUOUS — they cannot appear in a valid-token serve of the
 * contracted model (eval-mode / local-chrome-mode / resolved-via-default|fallback / keyring
 * expired=true / auth-failed / unauthorized). Any match => the serve was unauthenticated / served a
 * default, regardless of a request-side backend-label echo (ADR-0025).
 *
 * DELIBERATELY EXCLUDED (ambiguous startup transients — DO NOT hard-fail): "not logged into
 * Antigravity" / "defaulting to CCPA". agy's async auth MAY emit these BEFORE auth completes on a
 * GENUINE serve, so hard-failing them would make a required lane permanently un-attestable
 * (ED-060-stuck-forever — the false-RED inverse). Today (keyring expired) every serve is genuinely
 * unauthenticated so the terminal set alone catches everything; the terminal-vs-transient partition
 * refinement (a positive same-pid valid-auth matcher) is login-gated — it needs a REAL authenticated-
 * serve sample to author against, and is tracked as ED-268 (β P-059 ceiling, ADR-0037).
 */

// The TERMINAL non-auth signal — the ONE source (was cert-attest.js NON_AUTH_SIGNAL, α/β narrowed
// ruling 2026-07-19). Matched against normalized text (norm() below) so "eval mode" == "eval-mode".
const NON_AUTH_SIGNAL = /(resolved-via-default|resolved-via-fallback|local-chrome-mode|eval-mode|authentication-failed|unauthorized|expired=true)/;

// Normalize for matching: lowercase + collapse runs of whitespace/underscore to a single dash, so the
// human log form ("local chrome mode … eval mode") matches the dashed signal tokens.
function norm(s) {
  return String(s || "").toLowerCase().replace(/[\s_]+/g, "-");
}

/**
 * filterAgyLogToRunWindow(agyLog, startedMs, marginMs) — keep ONLY run-attributable cli.log lines
 * whose agy-format timestamp falls in [startedMs - margin, now + 1s]. The ONE source (was
 * cert-attest.js). A line with no parseable timestamp is DROPPED (never leaks a stale serve marker
 * from a PRIOR run — the cli.log is shared, append-only, mutable state). Favors fail-closed: a
 * false-RED (dropping a genuine but clock-skewed line) is safe (re-probe); a false-GREEN (a stale
 * marker leaking in and being mistaken for this run) is the class this closes.
 */
function filterAgyLogToRunWindow(agyLog, startedMs, marginMs = 5000) {
  if (!agyLog) return "";
  const lo = startedMs - marginMs;
  const hi = Date.now() + 1000;
  const year = new Date().getFullYear();
  const kept = [];
  for (const line of agyLog.split("\n")) {
    const m = line.match(/^[IWEF](\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
    if (!m) continue;
    const [, mo, da, hh, mm, ss, frac] = m;
    const ms = frac ? Number(frac.slice(0, 3).padEnd(3, "0")) : 0;
    const t = new Date(year, Number(mo) - 1, Number(da), Number(hh), Number(mm), Number(ss), ms).getTime();
    if (t >= lo && t <= hi) kept.push(line);
  }
  return kept.join("\n");
}

/**
 * detectAgyAuthFallback({ stdout, stderr, agyLog, agyLogReadError, startedMs }) ->
 *   { auth_fallback, tells:[{sink,tell}], surface, reason? }
 *
 *   auth_fallback === true            — a TERMINAL tell found in the UNION of stdout + stderr + the
 *                                       run-window log-delta (agy may write to any sink).
 *   auth_fallback === "indeterminate" — the run window can't be bounded (no startedMs) OR the shared
 *                                       cli.log was expected but UNREADABLE (agyLogReadError). FAIL-
 *                                       CLOSED: the caller forces fallback:true — an un-verifiable
 *                                       serve is treated as un-attestable, never a silent clean pass.
 *   auth_fallback === false           — no terminal tell in the run window. This is NOT a claim that
 *                                       agy served authenticated (never-claim-live-from-transport) —
 *                                       only that no unauth TELL was observed for this run.
 *
 * Scans the UNION so a tell on ANY sink is caught (a log-only scan false-greens if agy routes the
 * tell to stderr; a stdout-only scan false-greens because agy writes tells to the log, not stdout).
 */
function detectAgyAuthFallback({ stdout = "", stderr = "", agyLog = null, agyLogReadError = false, startedMs } = {}) {
  if (typeof startedMs !== "number" || !Number.isFinite(startedMs)) {
    return { auth_fallback: "indeterminate", tells: [], surface: "no-run-window", reason: "no startedMs — cannot bound the shared cli.log to this run (fail-closed)" };
  }
  if (agyLogReadError) {
    return { auth_fallback: "indeterminate", tells: [], surface: "log-unreadable", reason: "agy cli.log expected but unreadable — cannot verify this run's auth state (fail-closed)" };
  }
  const logWindow = agyLog != null ? filterAgyLogToRunWindow(agyLog, startedMs) : "";
  const surfaces = { stdout, stderr, log: logWindow };
  const tells = [];
  for (const [sink, text] of Object.entries(surfaces)) {
    const m = norm(text).match(NON_AUTH_SIGNAL);
    if (m) tells.push({ sink, tell: m[1] });
  }
  if (tells.length) return { auth_fallback: true, tells, surface: "terminal-tell" };
  return { auth_fallback: false, tells: [], surface: "clean-window" };
}

module.exports = { NON_AUTH_SIGNAL, filterAgyLogToRunWindow, detectAgyAuthFallback, norm };
