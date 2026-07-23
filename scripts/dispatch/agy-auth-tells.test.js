#!/usr/bin/env node
"use strict";

/**
 * agy-auth-tells.test.js — teeth for the agy auth-fallback tell detector
 * (SP-20260723-002 / ADR-0037, sequence-aware + pid-scoped + EMITTER-ANCHORED after r1 + DoE + r2).
 *
 * The regression anchor is the GENUINE capture (fixtures/agy/authenticated-serve.log, byte-identical to
 * runtime/cert-attest/agy-log-1784445071686.log) — a real authenticated serve the r1 detector false-RED'd.
 * r2 backend #1 added the security-critical case: AUTH_SUCCESS must be anchored to the EMITTER code-site,
 * not the message text, so an injected `log.go:398] … ChainedAuth: authenticated via keyring` (a reviewer
 * serve's own answer, logged) can NOT flip an unauthenticated serve to false.
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  detectAgyAuthFallback,
  filterAgyLogToRunWindow,
  snapshotAgyLog,
  readAgyLogDelta,
  glogPid,
  parseGlog,
  isAuthSuccessLine,
  NON_AUTH_SIGNAL,
} = require("./agy-auth-tells.js");

let pass = 0;
let fail = 0;
function t(name, fn) {
  try {
    fn();
    pass++;
    console.log("  PASS  " + name);
  } catch (e) {
    fail++;
    console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e));
  }
}

const FIX_DIR = path.join(__dirname, "fixtures", "agy");
const AUTH_FIXTURE = fs.readFileSync(path.join(FIX_DIR, "authenticated-serve.log"), "utf8");
const UNAUTH_FIXTURE = fs.readFileSync(path.join(FIX_DIR, "unauthenticated-serve.log"), "utf8");
const FIXTURE_PID = 39296; // both fixtures are the same real serve pid (glog field 3)
const FIXTURE_STARTED = new Date(2026, 6, 19, 0, 11, 11).getTime();

// glog line builder: `L MMDD HH:MM:SS.ffffff PID EMITTER] MESSAGE`. EMITTER (file:line) and MESSAGE are
// SEPARATE — the r1 test baked the emitter into the message, which is the very ambiguity backend r2 #1
// exploited. Default emitter is a NON-auth site so a message is never accidentally trusted.
function line(pid, message, { emitter = "log.go:398", mo = "07", da = "19", hh = "00", mm = "11", ss = "12", us = "000000" } = {}) {
  return `I${mo}${da} ${hh}:${mm}:${ss}.${us} ${pid} ${emitter}] ${message}`;
}
// REAL code-site auth-success lines (correct emitter + message).
const authLine = (pid) => line(pid, "ChainedAuth: authenticated via keyring (effective: keyring)", { emitter: "auth.go:132" });
const oauthLine = (pid) => line(pid, "OAuth: authenticated successfully as vlad@example.com", { emitter: "server_oauth.go:221" });
const silentLine = (pid) => line(pid, "Print mode: silent auth succeeded", { emitter: "printmode.go:309" });
const expiredLine = (pid) => line(pid, "keyringAuth: loaded token, expiry=... expired=true", { emitter: "keyring.go:64" });
const transientLine = (pid) => line(pid, "You are not logged into Antigravity.", { emitter: "log.go:398" });

// ── The two REAL-fixture regression anchors ──────────────────────────────────────────────────────────

t("REAL authenticated serve (byte-identical capture) -> auth_fallback:false", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
  assert.strictEqual(r.surface, "auth-success", JSON.stringify(r));
});

t("derived unauthenticated serve (no auth-success, expired=true) -> auth_fallback:true", () => {
  const r = detectAgyAuthFallback({ agyLog: UNAUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// ── r2 backend #1: EMITTER-anchored auth-success (the security-critical false-green fix) ───────────────

t("INJECTED success on a non-auth emitter (log.go) -> STILL true (backend r2 #1 false-green closed)", () => {
  // The exact demonstrated flip: append a reviewer-quoted success to the unauthenticated fixture.
  const injected = UNAUTH_FIXTURE + "\n" + line(FIXTURE_PID, "reviewer text: ChainedAuth: authenticated via keyring", { emitter: "log.go:398" });
  const r = detectAgyAuthFallback({ agyLog: injected, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, "an injected success on a non-auth emitter must NOT grant trust: " + JSON.stringify(r));
});

t("NESTED emitter in the MESSAGE (log.go] auth.go]…) -> not trusted (positional emitter wins)", () => {
  const agyLog = [
    expiredLine(FIXTURE_PID),
    line(FIXTURE_PID, "auth.go:132] ChainedAuth: authenticated via keyring", { emitter: "log.go:398" }),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, "a file:line] embedded in the message must not masquerade as the emitter: " + JSON.stringify(r));
});

t("isAuthSuccessLine: real emitter+message true; wrong emitter false; right emitter wrong message false", () => {
  assert.strictEqual(isAuthSuccessLine(parseGlog(authLine(FIXTURE_PID))), true);
  assert.strictEqual(isAuthSuccessLine(parseGlog(oauthLine(FIXTURE_PID))), true);
  assert.strictEqual(isAuthSuccessLine(parseGlog(silentLine(FIXTURE_PID))), true);
  assert.strictEqual(isAuthSuccessLine(parseGlog(line(FIXTURE_PID, "ChainedAuth: authenticated via keyring", { emitter: "log.go:398" }))), false);
  assert.strictEqual(isAuthSuccessLine(parseGlog(line(FIXTURE_PID, "applyAuthResult: email=x", { emitter: "server_oauth.go:216" }))), false);
});

// ── Sequence cases (r1 taxonomy fixes) ────────────────────────────────────────────────────────────────

t("expired=true then auth-success (refresh path) -> auth_fallback:false", () => {
  const agyLog = [expiredLine(FIXTURE_PID), authLine(FIXTURE_PID), oauthLine(FIXTURE_PID)].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

t("auth-success then late transient -> auth_fallback:false (transient can't un-auth)", () => {
  const agyLog = [
    authLine(FIXTURE_PID),
    line(FIXTURE_PID, "Model resolved via default", { emitter: "model_resolver.go:111" }),
    line(FIXTURE_PID, "Entering local chrome mode! ... eval mode", { emitter: "launchmanager.go:69" }),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

t("transient with no auth-success -> auth_fallback:true", () => {
  const agyLog = [transientLine(FIXTURE_PID), line(FIXTURE_PID, "Entering local chrome mode! ... eval mode", { emitter: "launchmanager.go:69" })].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

t("hard revoking (unauthorized) no success -> auth_fallback:true", () => {
  const agyLog = line(FIXTURE_PID, "request rejected: unauthorized", { emitter: "log.go:398" });
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

t("auth-success then revoking -> auth_fallback:true (revoked after auth)", () => {
  const agyLog = [authLine(FIXTURE_PID), line(FIXTURE_PID, "authentication failed", { emitter: "log.go:398" })].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// ── Concurrency / pid-scope (the false-GREEN this sprint exists to close) ──────────────────────────────

t("interleaved pids: this-pid unauth + other-pid auth-success -> true (false-green CLOSED)", () => {
  const OTHER = 40001;
  const agyLog = [expiredLine(FIXTURE_PID), transientLine(FIXTURE_PID), authLine(OTHER), oauthLine(OTHER)].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

t("interleaved pids: this-pid auth-success + other-pid transient -> false", () => {
  const OTHER = 40002;
  const agyLog = [authLine(FIXTURE_PID), line(OTHER, "Entering local chrome mode! ... eval mode", { emitter: "launchmanager.go:69" })].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

t("stdout quoting a tell + clean authenticated log -> false (stdout not scanned)", () => {
  const r = detectAgyAuthFallback({
    stdout: "The code returns 'unauthorized' and enters eval mode when expired=true.",
    agyLog: AUTH_FIXTURE,
    startedMs: FIXTURE_STARTED,
    runPid: FIXTURE_PID,
  });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// ── Fail-closed / indeterminate ───────────────────────────────────────────────────────────────────────

t("no runPid -> indeterminate", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-run-pid", JSON.stringify(r));
});

t("no startedMs -> indeterminate", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

t("agyLogReadError -> indeterminate", () => {
  const r = detectAgyAuthFallback({ agyLogReadError: true, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

t("runPid attributes no lines -> indeterminate", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: 99999 });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-pid-lines", JSON.stringify(r));
});

t("this-pid lines with no tell and no auth-success -> indeterminate (NOT false)", () => {
  const agyLog = [
    line(FIXTURE_PID, "Propagating selected model override to backend", { emitter: "model_config_manager.go:213" }),
    line(FIXTURE_PID, "URL: https://.../streamGenerateContent", { emitter: "http_helpers.go:228" }),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-signal", JSON.stringify(r));
});

// ── Window / rotation / extraction primitives ─────────────────────────────────────────────────────────

t("filterAgyLogToRunWindow keeps a Dec31 line for a Jan1 startedMs (rollover)", () => {
  const jan1 = new Date(2026, 0, 1, 0, 0, 2).getTime();
  const dec31 = "I1231 23:59:59.000000 39296 launchmanager.go:69] Entering ... eval mode";
  assert.ok(/eval mode/.test(filterAgyLogToRunWindow(dec31, jan1)), "Dec31 line must survive the Jan1 window");
});

t("filterAgyLogToRunWindow drops a day-old out-of-window tell", () => {
  const stale = "I0718 00:11:12.000000 39296 launchmanager.go:69] Entering ... eval mode";
  const win = filterAgyLogToRunWindow([stale, authLine(FIXTURE_PID)].join("\n"), FIXTURE_STARTED);
  assert.ok(!/eval mode/.test(win), "the day-old line must be dropped: " + win);
});

t("snapshotAgyLog + readAgyLogDelta: append delta and rotation detection (ASCII)", () => {
  const tmp = path.join(os.tmpdir(), "agy-delta-ascii-" + process.pid + ".log");
  try {
    fs.writeFileSync(tmp, "AAAA-prefix-line-1\n");
    const pre = snapshotAgyLog(tmp);
    assert.strictEqual(pre.ok, true);
    fs.appendFileSync(tmp, "APPENDED-2\n");
    const d1 = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d1.rotated, undefined, JSON.stringify(d1));
    assert.strictEqual(d1.delta, "APPENDED-2\n", JSON.stringify(d1));
    fs.writeFileSync(tmp, "ZZZZ\n");
    const d2 = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d2.rotated, true, JSON.stringify(d2));
    assert.strictEqual(d2.delta, "ZZZZ\n", JSON.stringify(d2));
    const d3 = readAgyLogDelta(tmp, { ok: false });
    assert.strictEqual(d3.delta, "ZZZZ\n", JSON.stringify(d3));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

t("readAgyLogDelta is BYTE-correct for multibyte content (backend r2 #3)", () => {
  const tmp = path.join(os.tmpdir(), "agy-delta-mb-" + process.pid + ".log");
  try {
    // "café-π-1\n" — 'é' (2 bytes) + 'π' (2 bytes) so byte length > char length.
    fs.writeFileSync(tmp, "café-π-prefix-1\n");
    const pre = snapshotAgyLog(tmp);
    fs.appendFileSync(tmp, "wörld-λ-2\n");
    const d = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d.rotated, undefined, "append must not be misread as rotation: " + JSON.stringify(d));
    assert.strictEqual(d.delta, "wörld-λ-2\n", "delta must be the exact appended bytes, not char-sliced: " + JSON.stringify(d));
    // multibyte prefix change -> rotation
    fs.writeFileSync(tmp, "δ\n");
    const d2 = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d2.rotated, true, JSON.stringify(d2));
    assert.strictEqual(d2.delta, "δ\n", JSON.stringify(d2));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

t("glogPid + parseGlog: field-3 pid + emitter/message; null on non-glog lines", () => {
  assert.strictEqual(glogPid("I0719 00:11:11.752399 39296 resolver.go:85] x"), 39296);
  const p = parseGlog("I0719 00:11:11.752399 39296 auth.go:132] ChainedAuth: authenticated via keyring");
  assert.deepStrictEqual({ pid: p.pid, emitter: p.emitter, message: p.message }, { pid: 39296, emitter: "auth.go:132", message: "ChainedAuth: authenticated via keyring" });
  assert.strictEqual(glogPid("not a glog line unauthorized eval mode"), null);
  assert.strictEqual(parseGlog(""), null);
});

t("NON_AUTH_SIGNAL source is byte-identical (cert-attest GATE-1 pure-move)", () => {
  assert.strictEqual(
    NON_AUTH_SIGNAL.source,
    "(resolved-via-default|resolved-via-fallback|local-chrome-mode|eval-mode|authentication-failed|unauthorized|expired=true)",
    "NON_AUTH_SIGNAL drifted — cert-attest GATE-1 depends on this exact literal",
  );
});

t("providers.js wires the delta lib + runPid and drops the whole-file read", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "hooks", "lib", "providers.js"), "utf8");
  assert.ok(/snapshotAgyLog/.test(src), "providers.js must snapshot pre-spawn");
  assert.ok(/readAgyLogDelta/.test(src), "providers.js must read the delta post-spawn");
  assert.ok(/runPid:\s*spawned\.pid/.test(src), "providers.js must pass the spawned child.pid as runPid");
  assert.ok(!/readFileSync\(agyLogPath/.test(src), "providers.js must NOT reintroduce the whole-file cli.log read");
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
