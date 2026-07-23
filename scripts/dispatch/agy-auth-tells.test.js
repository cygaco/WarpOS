#!/usr/bin/env node
"use strict";

/**
 * agy-auth-tells.test.js — teeth for the agy auth-fallback tell detector
 * (SP-20260723-002 / ADR-0037, sequence-aware + pid-scoped rebuild after the r1 gauntlet + DoE re-consult).
 *
 * The regression anchor is the GENUINE capture (fixtures/agy/authenticated-serve.log, byte-identical to
 * runtime/cert-attest/agy-log-1784445071686.log) — a real authenticated serve that the FIRST detector
 * false-RED'd. DoE: "A single-fixture test proving only (unauth→true) is precisely what let the taxonomy
 * error survive — the genuine sample MUST be a committed regression fixture." Both directions are proven
 * on the real fixtures; the sequence + pid-scope + fail-closed edge cases are constructed and labeled.
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
// The fixtures are dated 2026-07-19 00:11:11; bind startedMs to that so the run window admits them
// (window = [startedMs - 5s, now + 1s]; the fixture time is in the past relative to any real `now`).
const FIXTURE_STARTED = new Date(2026, 6, 19, 0, 11, 11).getTime();

// glog line builder with an EXPLICIT pid (the concurrency dimension) + fixture-window timestamp.
function line(pid, tell, { mo = "07", da = "19", hh = "00", mm = "11", ss = "12", us = "000000", file = "log.go:398" } = {}) {
  return `I${mo}${da} ${hh}:${mm}:${ss}.${us} ${pid} ${file}] ${tell}`;
}
const AUTH_LINE = "auth.go:132] ChainedAuth: authenticated via keyring (effective: keyring)";
const OAUTH_LINE = "server_oauth.go:221] OAuth: authenticated successfully as vlad@example.com";

// ── The two REAL-fixture regression anchors ──────────────────────────────────────────────────────────

// 1. THE GENUINE authenticated serve (real capture) -> false. The exact serve the r1 detector false-RED'd.
t("REAL authenticated serve (byte-identical capture) -> auth_fallback:false", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
  assert.strictEqual(r.surface, "auth-success", JSON.stringify(r));
});

// 2. The derived UNauthenticated serve (auth-success lines removed, expired=true) -> true.
t("derived unauthenticated serve (no auth-success, expired=true) -> auth_fallback:true", () => {
  const r = detectAgyAuthFallback({ agyLog: UNAUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// ── DoE must-ship sequence cases (the r1 taxonomy fixes) ──────────────────────────────────────────────

// 3. expired=true BEFORE a code-site success -> false (the NORMAL expire→refresh→success OAuth path;
//    the r1 unconditional-veto bug would have false-RED'd this).
t("expired=true then auth-success (refresh path) -> auth_fallback:false", () => {
  const agyLog = [
    line(FIXTURE_PID, "keyring.go:64] keyringAuth: loaded token, expiry=... expired=true"),
    line(FIXTURE_PID, AUTH_LINE),
    line(FIXTURE_PID, OAUTH_LINE),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// 4. A startup transient AFTER auth-success -> false (a transient can NOT un-authenticate a serve;
//    the r1 ordering-gated rule would have false-RED'd a late "resolved via default").
t("auth-success then late transient -> auth_fallback:false (transient can't un-auth)", () => {
  const agyLog = [
    line(FIXTURE_PID, AUTH_LINE),
    line(FIXTURE_PID, "model_resolver.go:111] Model resolved via default"),
    line(FIXTURE_PID, "launchmanager.go:69] Entering local chrome mode! ... eval mode"),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// 5. A transient with NO subsequent auth-success -> true (the unauth / eval-default serve).
t("transient with no auth-success -> auth_fallback:true", () => {
  const agyLog = [
    line(FIXTURE_PID, "log.go:398] You are not logged into Antigravity."),
    line(FIXTURE_PID, "launchmanager.go:69] Entering local chrome mode! ... eval mode"),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// 6. A HARD revoking signal (unauthorized) with no success -> true.
t("hard revoking (unauthorized) no success -> auth_fallback:true", () => {
  const agyLog = line(FIXTURE_PID, "log.go:398] request rejected: unauthorized");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// 7. A revoking signal AFTER an earlier success -> true (revoked mid-serve; fail-closed).
t("auth-success then revoking -> auth_fallback:true (revoked after auth)", () => {
  const agyLog = [
    line(FIXTURE_PID, AUTH_LINE),
    line(FIXTURE_PID, "log.go:398] authentication failed"),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// ── DoE must-ship concurrency / pid-scope cases (the false-GREEN this sprint exists to close) ──────────

// 8. THE concurrency false-green: this-pid is unauth, ANOTHER pid's auth-success lands in the window ->
//    true (pid-scoping excludes the other process's success — the exact false-green the sprint closes).
t("interleaved pids: this-pid unauth + other-pid auth-success -> auth_fallback:true (false-green CLOSED)", () => {
  const OTHER = 40001;
  const agyLog = [
    line(FIXTURE_PID, "keyring.go:64] keyringAuth: loaded token expired=true"),
    line(FIXTURE_PID, "log.go:398] You are not logged into Antigravity."),
    line(OTHER, AUTH_LINE), // a concurrent agy -i login — MUST NOT clean this run
    line(OTHER, OAUTH_LINE),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// 9. The other direction: this-pid authenticated, another pid's transient in-window -> false (a foreign
//    transient must not false-RED this run).
t("interleaved pids: this-pid auth-success + other-pid transient -> auth_fallback:false", () => {
  const OTHER = 40002;
  const agyLog = [
    line(FIXTURE_PID, AUTH_LINE),
    line(OTHER, "launchmanager.go:69] Entering local chrome mode! ... eval mode"),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// 10. C4 (stdout collision): the real authenticated log + a stdout that QUOTES a tell -> false. stdout is
//     NOT a tell surface (a reviewer serve whose ANSWER quotes "unauthorized" must not veto).
t("stdout quoting a tell + clean authenticated log -> auth_fallback:false (stdout not scanned)", () => {
  const r = detectAgyAuthFallback({
    stdout: "The code path returns 'unauthorized' and enters eval mode when expired=true.",
    agyLog: AUTH_FIXTURE,
    startedMs: FIXTURE_STARTED,
    runPid: FIXTURE_PID,
  });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// ── Fail-closed / indeterminate cases (record-honesty > P-059) ────────────────────────────────────────

// 11. No runPid -> indeterminate (cannot attribute the shared log to this serve).
t("no runPid -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-run-pid", JSON.stringify(r));
});

// 12. No startedMs -> indeterminate.
t("no startedMs -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

// 13. Log unreadable -> indeterminate.
t("agyLogReadError -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ agyLogReadError: true, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

// 14. runPid matches NO in-window line (launcher-pid / all-foreign window) -> indeterminate.
t("runPid attributes no lines -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ agyLog: AUTH_FIXTURE, startedMs: FIXTURE_STARTED, runPid: 99999 });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-pid-lines", JSON.stringify(r));
});

// 15. THE SEMANTIC FLIP: a readable window with lines for this pid but NEITHER a tell NOR an auth-success
//     -> indeterminate (NOT false). The old blunt detector scored this "clean/false" — a false-green vector.
t("this-pid lines with no tell and no auth-success -> indeterminate (NOT false)", () => {
  const agyLog = [
    line(FIXTURE_PID, "model_config_manager.go:213] Propagating selected model override to backend"),
    line(FIXTURE_PID, "http_helpers.go:228] URL: https://.../streamGenerateContent"),
  ].join("\n");
  const r = detectAgyAuthFallback({ agyLog, startedMs: FIXTURE_STARTED, runPid: FIXTURE_PID });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
  assert.strictEqual(r.surface, "no-signal", JSON.stringify(r));
});

// ── Window / rotation / extraction primitives ─────────────────────────────────────────────────────────

// 16. Year rollover: a Dec-31 line with a Jan-1 startedMs is kept (attributed to the prior year).
t("filterAgyLogToRunWindow keeps a Dec31 line for a Jan1 startedMs (rollover)", () => {
  const jan1 = new Date(2026, 0, 1, 0, 0, 2).getTime();
  const dec31 = "I1231 23:59:59.000000 39296 log.go:398] Entering ... eval mode";
  const win = filterAgyLogToRunWindow(dec31, jan1);
  assert.ok(/eval mode/.test(win), "the Dec31 line must survive the Jan1 window: " + JSON.stringify(win));
});

// 17. A stale out-of-window tell (a day before the window) is dropped.
t("filterAgyLogToRunWindow drops a day-old out-of-window tell", () => {
  const stale = "I0718 00:11:12.000000 39296 log.go:398] Entering ... eval mode";
  const win = filterAgyLogToRunWindow([stale, line(FIXTURE_PID, AUTH_LINE)].join("\n"), FIXTURE_STARTED);
  assert.ok(!/eval mode/.test(win), "the day-old line must be dropped: " + win);
});

// 18. snapshot/delta: append -> delta is the appended bytes; shrink/prefix-change -> rotated + whole file.
t("snapshotAgyLog + readAgyLogDelta: append delta and rotation detection", () => {
  const tmp = path.join(os.tmpdir(), "agy-delta-test-" + process.pid + ".log");
  try {
    fs.writeFileSync(tmp, "AAAA-prefix-line-1\n");
    const pre = snapshotAgyLog(tmp);
    assert.strictEqual(pre.ok, true);
    fs.appendFileSync(tmp, "APPENDED-2\n");
    const d1 = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d1.rotated, undefined, "append is not a rotation: " + JSON.stringify(d1));
    assert.strictEqual(d1.delta, "APPENDED-2\n", JSON.stringify(d1));
    // rotation: rewrite smaller with a different prefix -> whole file returned, rotated:true.
    fs.writeFileSync(tmp, "ZZZZ\n");
    const d2 = readAgyLogDelta(tmp, pre);
    assert.strictEqual(d2.rotated, true, "shrink+prefix-change must be flagged rotated: " + JSON.stringify(d2));
    assert.strictEqual(d2.delta, "ZZZZ\n", JSON.stringify(d2));
    // absent-pre -> whole file is the delta.
    const d3 = readAgyLogDelta(tmp, { ok: false });
    assert.strictEqual(d3.delta, "ZZZZ\n", JSON.stringify(d3));
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
});

// 19. glogPid extracts field 3, null on a non-glog line.
t("glogPid extracts the field-3 pid; null on non-glog lines", () => {
  assert.strictEqual(glogPid("I0719 00:11:11.752399 39296 resolver.go:85] x"), 39296);
  assert.strictEqual(glogPid("not a glog line unauthorized eval mode"), null);
  assert.strictEqual(glogPid(""), null);
});

// 20. PURE-MOVE GUARD (β condition): NON_AUTH_SIGNAL is byte-identical to cert-attest's GATE-1 literal.
//     Any drift here silently changes the NON-agy cert-attest GATE-1 — this test freezes the contract.
t("NON_AUTH_SIGNAL source is byte-identical (cert-attest GATE-1 pure-move)", () => {
  assert.strictEqual(
    NON_AUTH_SIGNAL.source,
    "(resolved-via-default|resolved-via-fallback|local-chrome-mode|eval-mode|authentication-failed|unauthorized|expired=true)",
    "NON_AUTH_SIGNAL drifted — cert-attest GATE-1 depends on this exact literal",
  );
});

// 21. LIB-BYPASS GUARD (CLAUDE.md refactor-hygiene rule 3 / DoE Q3a): providers.js must use the snapshot+
//     delta lib, pass runPid, and NOT reintroduce the whole-file readFileSync(agyLogPath) bypass.
t("providers.js wires the delta lib + runPid and drops the whole-file read", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "hooks", "lib", "providers.js"), "utf8");
  assert.ok(/snapshotAgyLog/.test(src), "providers.js must snapshot pre-spawn");
  assert.ok(/readAgyLogDelta/.test(src), "providers.js must read the delta post-spawn");
  assert.ok(/runPid:\s*spawned\.pid/.test(src), "providers.js must pass the spawned child.pid as runPid");
  assert.ok(!/readFileSync\(agyLogPath/.test(src), "providers.js must NOT reintroduce the whole-file cli.log read");
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
