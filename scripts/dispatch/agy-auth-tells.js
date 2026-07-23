"use strict";
/**
 * agy-auth-tells.js — SINGLE SOURCE of the agy (Antigravity) auth-fallback detection
 * (SP-20260723-002 / ADR-0037). Used by the dispatch-record detector (providers.js runProvider →
 * dispatch-agent) and cert-attest (which consumes NON_AUTH_SIGNAL + filterAgyLogToRunWindow + norm).
 *
 * WHY / SEQUENCE-AWARE + PID-SCOPED (r1 gauntlet + DoE re-consult fixes):
 *  - An UNauthenticated agy serve exits 0 with output but writes its tells to the cli.log NOT stdout,
 *    so a naive record stamped auth_fallback:false — a FALSE-GREEN (the seam that ADR-0037 closes).
 *  - The FIRST detector used a blunt denylist and got it BACKWARDS: a captured GENUINE authenticated
 *    serve (runtime/cert-attest/agy-log-1784445071686.log, real user) emits `Model resolved via default`
 *    + `local chrome mode / eval mode` + `You are not logged into Antigravity` + `not authenticated`
 *    DURING STARTUP (lines 1-53), THEN loads the keyring (expired=false) and authenticates
 *    (auth.go ChainedAuth / server_oauth OAuth-success / printmode silent-auth) and serves the real
 *    model — so those tells are NON-terminal; a blunt denylist FALSE-REDs genuine serves.
 *  - The DoE re-consult found the ordering-gated rebuild STILL fragile: `expired=true` as an
 *    unconditional veto false-REDs the NORMAL expire→refresh→success OAuth path; and a transient that
 *    recurs AFTER auth-success must NOT un-authenticate a serve. It also found the shared rotating
 *    cli.log needs PID attribution (under the concurrency cap another agy process's auth-success can
 *    land in this run's window → a false-GREEN), and that stdout must NOT be scanned for tells (a
 *    reviewer serve whose ANSWER quotes "unauthorized"/"eval mode" would content-collide false-RED).
 *
 * The reliable discriminator is POSITIVE-PROOF-ONLY, PID-SCOPED, LOG-SURFACE-ONLY:
 *   auth_fallback === false           ONLY when a code-site AUTH_SUCCESS appears in THIS serve's
 *                                     pid-scoped run window with no hard-revoking signal after it.
 *                                     Never inferred from the absence of a tell.
 *   auth_fallback === true            no usable auth-success AND a terminal/transient tell in this
 *                                     serve's lines (unauthenticated / eval-default / fell-back serve).
 *   auth_fallback === "indeterminate" no run window / unreadable log / no run pid / no lines
 *                                     attributable to this serve's pid / neither tell nor success.
 *                                     FAIL-CLOSED: the caller forces fallback:true (record-honesty /
 *                                     no-false-green outranks P-059 / no-false-RED).
 */

const fs = require("fs");

// ── The TERMINAL union — KEPT BYTE-UNCHANGED for cert-attest GATE-1 (ADR-0025/SP-719-L2). Do NOT move,
// demote, or add tokens here: cert-attest's evaluateAttestation GATE-1 keys on this exact literal, and
// its agy path fail-closes unconditionally anyway; narrowing it would silently weaken the NON-agy
// GATE-1. The agy-specific sets below are NEW and consumed ONLY by detectAgyAuthFallback. ────────────
const NON_AUTH_SIGNAL = /(resolved-via-default|resolved-via-fallback|local-chrome-mode|eval-mode|authentication-failed|unauthorized|expired=true)/;

// STARTUP_TRANSIENT — noise emitted DURING agy startup on a GENUINE serve, BEFORE the keyring auth
// completes (verified: agy-log-1784445071686.log lines 1-53). NEVER disqualifying once an AUTH_SUCCESS
// follows; only unauth-evidence when NO auth-success exists in this serve's window at all. Matched on
// the message text — the fail-CLOSED direction (a spurious tell only ever forces a false-RED, never a
// false-green), so loose matching is safe here, UNLIKE AUTH_SITES below (the trust-GRANTING direction).
const STARTUP_TRANSIENT = /(resolved-via-default|resolved-via-fallback|local-chrome-mode|eval-mode|not-logged-into-antigravity|not-authenticated)/;
// REVOKING — a HARD login failure/denial. Terminal wherever it lands (before OR after a success line).
const REVOKING = /(authentication-failed|unauthorized)/;
// EXPIRED — SOFT: an expired access token is the NORMAL pre-refresh state (DoE r1 finding #1). It
// disqualifies ONLY when no AUTH_SUCCESS follows it — i.e. treated like a transient for the sequence.
const EXPIRED = /expired=true/;

// AUTH_SITES — POSITIVE proof, STRUCTURALLY anchored to the EMITTER code-site AND the message together
// (gauntlet r2 backend #1 — the security-critical fix). AUTH_SUCCESS is the ONLY thing that GRANTS trust,
// so it must be forge-resistant: matching the success phrase anywhere in a line let an injected
// `log.go:398] reviewer text: ChainedAuth: authenticated via keyring` (a reviewer serve's OWN answer,
// logged) flip an unauthenticated serve to false. The emitter (`auth.go:132]`) is parsed POSITIONALLY (the
// FIRST file:line] after the pid), so a file:line] embedded in the MESSAGE cannot masquerade as the
// emitter, and only genuine agy auth code emits these three lines. Deliberately EXCLUDES the generic
// server.go:2568 "Auth succeeded" (it fires BEFORE the keyring load, interleaved with not-logged-in — a
// FALSE success), per DoE's calibration risk.
const AUTH_SITES = new Map([
  ["auth.go", /^chainedauth: authenticated via keyring\b/i],
  ["server_oauth.go", /^oauth: authenticated successfully as \S/i],
  ["printmode.go", /^print mode: silent auth succeeded\b/i],
]);

// Normalize for matching: lowercase + collapse whitespace/underscore runs to a single dash, so the
// human log form ("You are not logged into Antigravity") matches the dashed tokens.
function norm(s) {
  return String(s || "").toLowerCase().replace(/[\s_]+/g, "-");
}

/**
 * parseGlog(line) -> { pid, emitter, message } | null — structural parse of a glog line
 * `L MMDD HH:MM:SS.ffffff PID FILE:LINE] MESSAGE`. The emitter (FILE:LINE) is the FIRST file:line] after
 * the pid, parsed POSITIONALLY, so a file:line] embedded in the MESSAGE cannot masquerade as the emitter.
 * Returns null for a non-glog line.
 */
function parseGlog(line) {
  const m = String(line).match(/^[IWEF]\d{4}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\s+(\d+)\s+([A-Za-z0-9_.\-]+:\d+)\]\s?(.*)$/);
  if (!m) return null;
  return { pid: Number(m[1]), emitter: m[2], message: m[3] };
}

// glogPid(line) — the field-3 pid, or null on a non-glog line. Thin wrapper over parseGlog. (Real
// capture: every agy line carries agy's own process pid; "Starting language server process with pid N"
// shows N === the logging pid, so scoping to the spawned child.pid attributes lines to this serve.)
function glogPid(line) {
  const p = parseGlog(line);
  return p ? p.pid : null;
}

// isAuthSuccessLine(parsed) — true ONLY when the line's REAL (positional) emitter is one of the three
// auth code-sites AND its message is that site's success phrase (emitter+message together — backend r2 #1).
function isAuthSuccessLine(parsed) {
  if (!parsed) return false;
  const file = parsed.emitter.split(":")[0];
  const rx = AUTH_SITES.get(file);
  return !!rx && rx.test((parsed.message || "").trim());
}

/**
 * filterAgyLogToRunWindow(agyLog, startedMs, marginMs) — keep ONLY glog-timestamped cli.log lines whose
 * time falls in [startedMs - margin, now + 1s]. Single source (was cert-attest.js). Year is derived from
 * startedMs + ±1 neighbors so a Dec31→Jan1 straddle keeps the in-window tell. A line with no parseable
 * timestamp is DROPPED (it is not a glog log line).
 */
function filterAgyLogToRunWindow(agyLog, startedMs, marginMs = 5000) {
  if (!agyLog) return "";
  const lo = startedMs - marginMs;
  const hi = Date.now() + 1000;
  const baseYear = new Date(startedMs).getFullYear();
  const kept = [];
  for (const line of agyLog.split("\n")) {
    const m = line.match(/^[IWEF](\d{2})(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
    if (!m) continue;
    const [, mo, da, hh, mm, ss, frac] = m;
    const ms = frac ? Number(frac.slice(0, 3).padEnd(3, "0")) : 0;
    let inWindow = false;
    for (const y of [baseYear, baseYear - 1, baseYear + 1]) {
      const t = new Date(y, Number(mo) - 1, Number(da), Number(hh), Number(mm), Number(ss), ms).getTime();
      if (t >= lo && t <= hi) { inWindow = true; break; }
    }
    if (inWindow) kept.push(line);
  }
  return kept.join("\n");
}

/**
 * snapshotAgyLog(logPath) -> { ok, size, prefixBuf } — the PRE-spawn snapshot. `size` and the first-256
 * `prefixBuf` are BYTES (fs.statSync().size is a byte count), so all offset math is byte-exact (backend
 * r2 #3: a UTF-8 STRING length ≠ byte size for multibyte content). ok:false (log absent pre-spawn) means
 * the whole post-read is this run's delta.
 */
function snapshotAgyLog(logPath) {
  try {
    const size = fs.statSync(logPath).size;
    const n = Math.min(256, size);
    const buf = Buffer.alloc(n);
    if (n > 0) {
      const fd = fs.openSync(logPath, "r");
      try { fs.readSync(fd, buf, 0, n, 0); } finally { fs.closeSync(fd); }
    }
    return { ok: true, size, prefixBuf: buf };
  } catch {
    return { ok: false };
  }
}

/**
 * readAgyLogDelta(logPath, pre) -> { ok, delta, rotated? } — the POST-spawn delta relative to the pre
 * snapshot, computed on BYTES (backend r2 #3). Content-based rotation detection: if the file SHRANK or
 * its first-256-BYTE prefix changed, the log ROTATED under us (concurrency) → the whole current file is
 * new-since-this-run. Otherwise slice from the pre-size BYTE offset, decoding AFTER the slice so a
 * multibyte boundary is never split mid-read. ok:false ⇒ the caller sets agyLogReadError.
 */
function readAgyLogDelta(logPath, pre) {
  let buf;
  try {
    buf = fs.readFileSync(logPath); // Buffer — NO encoding, so length/offsets are bytes
  } catch {
    return { ok: false };
  }
  if (!pre || !pre.ok) return { ok: true, delta: buf.toString("utf8") };
  const preBuf = pre.prefixBuf || Buffer.alloc(0);
  const cmpLen = Math.min(preBuf.length, buf.length);
  const rotated = buf.length < pre.size || !buf.subarray(0, cmpLen).equals(preBuf.subarray(0, cmpLen));
  if (rotated) return { ok: true, delta: buf.toString("utf8"), rotated: true };
  return { ok: true, delta: buf.subarray(pre.size).toString("utf8") };
}

/**
 * detectAgyAuthFallback({ agyLog, agyLogReadError, startedMs, runPid }) -> { auth_fallback, reason, surface }
 *
 * `agyLog` is the run's cli.log DELTA (from readAgyLogDelta); window-filtered here (defense in depth),
 * then PID-SCOPED to `runPid` (the spawned agy child.pid). Classification is over the pid-scoped log
 * lines ONLY — stdout/stderr are NOT scanned for tells (ADR-0037: tells land in the log; DoE C4: a
 * reviewer serve quoting a tell in its answer must not veto).
 */
function detectAgyAuthFallback({ agyLog = null, agyLogReadError = false, startedMs, runPid } = {}) {
  if (typeof startedMs !== "number" || !Number.isFinite(startedMs)) {
    return { auth_fallback: "indeterminate", reason: "no startedMs — cannot bound the shared cli.log to this run", surface: "no-run-window" };
  }
  if (agyLogReadError) {
    return { auth_fallback: "indeterminate", reason: "agy cli.log expected but unreadable", surface: "log-unreadable" };
  }
  if (!Number.isInteger(runPid) || runPid <= 0) {
    return { auth_fallback: "indeterminate", reason: "no run pid — cannot attribute shared cli.log lines to this serve", surface: "no-run-pid" };
  }

  const logWindow = agyLog != null ? filterAgyLogToRunWindow(agyLog, startedMs) : "";
  // Structural parse + PID-SCOPE: keep only this serve's glog lines. isAuthSuccessLine reads the REAL
  // (positional) emitter, so a success phrase quoted in another line's MESSAGE can't grant trust.
  const pidLines = logWindow.split("\n").map(parseGlog).filter((p) => p && p.pid === runPid);
  if (pidLines.length === 0) {
    return { auth_fallback: "indeterminate", reason: "no run-window cli.log lines attributable to this serve's pid", surface: "no-pid-lines" };
  }

  // Positive-proof pass: locate the last EMITTER-anchored auth-success, then check nothing hard-revoked after.
  let lastSuccessIdx = -1;
  for (let i = 0; i < pidLines.length; i++) {
    if (isAuthSuccessLine(pidLines[i])) lastSuccessIdx = i;
  }
  if (lastSuccessIdx >= 0) {
    let hardAfter = false;
    for (let i = lastSuccessIdx + 1; i < pidLines.length; i++) {
      const n = norm(pidLines[i].message);
      if (REVOKING.test(n) || EXPIRED.test(n)) { hardAfter = true; break; }
    }
    if (!hardAfter) {
      return { auth_fallback: false, reason: "authenticated — code-site auth-success with no hard-revoking signal after it", surface: "auth-success" };
    }
    // A hard signal after the last success (revocation / unrefreshed expiry) → fall through → unauth.
  }

  // No usable auth-success. Any terminal/transient tell in this serve's message lines ⇒ unauthenticated.
  const joined = norm(pidLines.map((p) => p.message).join("\n"));
  if (REVOKING.test(joined) || EXPIRED.test(joined) || STARTUP_TRANSIENT.test(joined)) {
    return { auth_fallback: true, reason: "no code-site auth-success and a terminal/transient tell present in this serve's log", surface: "no-success-with-tell" };
  }

  // Neither a tell nor an auth-success in this serve's window — cannot prove either way.
  return { auth_fallback: "indeterminate", reason: "no auth-success and no tell in this serve's run window — cannot verify", surface: "no-signal" };
}

module.exports = {
  NON_AUTH_SIGNAL,
  STARTUP_TRANSIENT,
  REVOKING,
  EXPIRED,
  AUTH_SITES,
  norm,
  parseGlog,
  glogPid,
  isAuthSuccessLine,
  filterAgyLogToRunWindow,
  snapshotAgyLog,
  readAgyLogDelta,
  detectAgyAuthFallback,
};
