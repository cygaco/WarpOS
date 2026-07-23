#!/usr/bin/env node
"use strict";

/**
 * agy-auth-tells.test.js — teeth for the agy auth-fallback tell detector (SP-20260723-002 / ADR-0037).
 * Proves BOTH directions on the UNION surface with window-attribution + fail-closed on ambiguity, and
 * the P-059 terminal-vs-transient exclusion (a genuine serve's startup transient must not false-RED).
 */

const assert = require("assert");
const { detectAgyAuthFallback, filterAgyLogToRunWindow, NON_AUTH_SIGNAL } = require("./agy-auth-tells.js");

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

// Build an agy-format cli.log line at a given Date carrying `tell`.
function agyLogLine(date, tell) {
  const p2 = (n) => String(n).padStart(2, "0");
  const mo = p2(date.getMonth() + 1);
  const da = p2(date.getDate());
  const hh = p2(date.getHours());
  const mm = p2(date.getMinutes());
  const ss = p2(date.getSeconds());
  return `I${mo}${da} ${hh}:${mm}:${ss}.000000 40936 log.go:398] ${tell}`;
}
const NOW = () => Date.now();

// 1. A TERMINAL tell in the run-window LOG -> auth_fallback:true (the core: agy writes to log, not stdout).
t("terminal tell in the run-window log -> auth_fallback:true", () => {
  const started = NOW() - 2000;
  const agyLog = [agyLogLine(new Date(), "resolved via default"), agyLogLine(new Date(), "eval mode")].join("\n");
  const r = detectAgyAuthFallback({ stdout: "a real-looking refusal response", stderr: "", agyLog, startedMs: started });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
  assert.ok(r.tells.some((x) => x.sink === "log"), "tell attributed to the log sink: " + JSON.stringify(r));
});

// 1b. The REAL serve shape (eval-mode + expired=true + local-chrome + resolved-via-default in-window) -> true.
t("real unauth serve shape (eval-mode + expired=true) -> auth_fallback:true", () => {
  const started = NOW() - 3000;
  const agyLog = [
    agyLogLine(new Date(), "local chrome mode ... eval mode"),
    agyLogLine(new Date(), "keyring expired=true"),
    agyLogLine(new Date(), "Model resolved via default; defaulting to CCPA"),
  ].join("\n");
  const r = detectAgyAuthFallback({ stdout: "Sorry, I cannot fulfill your request.", agyLog, startedMs: started });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// 2. A terminal tell in STDERR -> caught (union scan — agy may route to stderr).
t("terminal tell in stderr -> auth_fallback:true (union)", () => {
  const r = detectAgyAuthFallback({ stdout: "", stderr: "warn: unauthorized", agyLog: "", startedMs: NOW() - 1000 });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
  assert.ok(r.tells.some((x) => x.sink === "stderr"), JSON.stringify(r));
});

// 3. A terminal tell in STDOUT -> caught (union).
t("terminal tell in stdout -> auth_fallback:true (union)", () => {
  const r = detectAgyAuthFallback({ stdout: "authentication-failed", startedMs: NOW() - 1000 });
  assert.strictEqual(r.auth_fallback, true, JSON.stringify(r));
});

// 4. A CLEAN run window -> auth_fallback:false. (Proves NO false-RED. NOT a claim agy served authed.)
t("clean run window -> auth_fallback:false (no false-RED; not a live-claim)", () => {
  const started = NOW() - 2000;
  const agyLog = [agyLogLine(new Date(), "Propagating request; backend: label=Gemini 3.1 Pro (High)")].join("\n");
  const r = detectAgyAuthFallback({ stdout: "A substantive review with no tell.", agyLog, startedMs: started });
  assert.strictEqual(r.auth_fallback, false, JSON.stringify(r));
});

// 5. A STALE terminal tell OUT-of-window (a PAST serve) -> NOT flagged (window-attribution).
t("stale out-of-window tell -> NOT flagged (window-attribution)", () => {
  const started = NOW() - 2000;
  const staleLine = agyLogLine(new Date(NOW() - 3600 * 1000), "eval mode"); // 1h ago, before the window
  const freshClean = agyLogLine(new Date(), "backend: label=Gemini 3.1 Pro (High)");
  const r = detectAgyAuthFallback({ stdout: "clean this run", agyLog: [staleLine, freshClean].join("\n"), startedMs: started });
  assert.strictEqual(r.auth_fallback, false, "a stale prior-serve tell must not false-RED this run: " + JSON.stringify(r));
});

// 6. The AMBIGUOUS startup transient in-window -> NOT flagged (P-059: a genuine serve emits it before auth).
t("ambiguous transient (not-logged-in / defaulting) -> NOT flagged (P-059)", () => {
  const started = NOW() - 2000;
  const agyLog = [
    agyLogLine(new Date(), "You are not logged into Antigravity."),
    agyLogLine(new Date(), "defaulting to CCPA"),
  ].join("\n");
  const r = detectAgyAuthFallback({ stdout: "a response", agyLog, startedMs: started });
  assert.strictEqual(r.auth_fallback, false, "the excluded transients must not hard-fail (ED-060-stuck-forever inverse): " + JSON.stringify(r));
});

// 7. No startedMs -> indeterminate (fail-closed; can't bound the shared log to this run).
t("no run window (no startedMs) -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ stdout: "x", agyLog: "whatever" });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

// 8. Log expected but unreadable -> indeterminate (fail-closed).
t("agyLogReadError -> indeterminate (fail-closed)", () => {
  const r = detectAgyAuthFallback({ stdout: "x", agyLogReadError: true, startedMs: NOW() - 1000 });
  assert.strictEqual(r.auth_fallback, "indeterminate", JSON.stringify(r));
});

// 9. filterAgyLogToRunWindow drops non-parsing lines (never leaks a stale unattributable marker).
t("filterAgyLogToRunWindow drops non-timestamped lines", () => {
  const started = NOW() - 2000;
  const win = filterAgyLogToRunWindow(["no-timestamp eval mode leak", agyLogLine(new Date(), "clean")].join("\n"), started);
  assert.ok(!/eval mode leak/.test(win), "an untimestamped line must be dropped: " + win);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
