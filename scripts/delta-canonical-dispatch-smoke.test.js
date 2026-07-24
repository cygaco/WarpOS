"use strict";
// ED-281 fix teeth. The served-content predicate claudeServeOk must go RED on a served refusal / error /
// silent model-fallback / non-json / non-exact reply / bad exit, and GREEN only on a real success envelope
// for the model we asked. The KEYSTONE case is the PLANTED REFUSAL: the exact served-text shape that
// false-greened the OLD loose `/OK/i.test(stdout) && exit0` canary (the model, handed a literal `$(cat tmp)`
// argv on Windows, refused — yet the fuller reply carried an incidental "ok" the substring matched). Pure
// fixtures, no CLI spawn — requiring the smoke module is side-effect-free thanks to its require.main guard.
const assert = require("assert");
const { claudeServeOk } = require("./delta-canonical-dispatch-smoke");

let passed = 0;
function check(name, got, wantOk) {
  assert.strictEqual(got.ok, wantOk, `${name}: expected ok=${wantOk}, got ${JSON.stringify(got)}`);
  passed++;
}

const M = "claude-opus-5";
const success = (reply, model = M) =>
  JSON.stringify({
    is_error: false,
    subtype: "success",
    type: "result",
    result: reply,
    modelUsage: { [model]: { canonicalModel: model } },
  });

// GREEN — real success envelope, asked model served, exact reply (case- + trailing-punct-tolerant).
check("success OK", claudeServeOk(0, success("OK"), M, "OK"), true);
check("success OK.", claudeServeOk(0, success("OK."), M, "OK"), true);
check("success lowercase ok", claudeServeOk(0, success("ok"), M, "OK"), true);

// RED — the PLANTED ED-281 REFUSAL. Its reply carries an incidental "ok" (in "isn't ok"), so the OLD loose
// check false-greened it; the strict predicate must FAIL. We assert BOTH: (a) the old /OK/ WOULD have passed
// (proving the regression shape), (b) the new predicate catches it.
const refusalReply =
  "I'm not going to run that. That prompt looks like a shell command substitution, which isn't ok to execute blindly.";
assert.ok(/OK/i.test(refusalReply), "fixture sanity: the old loose /OK/ WOULD have false-greened this refusal");
check("ED-281 planted refusal -> RED (old false-green now caught)", claudeServeOk(0, success(refusalReply), M, "OK"), false);
passed++; // the /OK/ sanity assertion

// RED — error / non-success / silent fallback / non-json / bad exit / empty / missing modelUsage.
check("is_error true -> RED", claudeServeOk(0, JSON.stringify({ is_error: true, subtype: "success", result: "OK", modelUsage: { [M]: { canonicalModel: M } } }), M, "OK"), false);
check("subtype error -> RED", claudeServeOk(0, JSON.stringify({ is_error: false, subtype: "error_max_turns", result: "OK", modelUsage: { [M]: { canonicalModel: M } } }), M, "OK"), false);
check("silent fallback to opus-4-8 -> RED", claudeServeOk(0, success("OK", "claude-opus-4-8"), M, "OK"), false);
check("non-json envelope -> RED", claudeServeOk(0, "I'm not going to run that.", M, "OK"), false);
check("non-zero exit -> RED", claudeServeOk(1, success("OK"), M, "OK"), false);
check("empty reply -> RED", claudeServeOk(0, success(""), M, "OK"), false);
check("missing modelUsage -> RED", claudeServeOk(0, JSON.stringify({ is_error: false, subtype: "success", result: "OK" }), M, "OK"), false);

// GREEN — the fallback lane asserts opus-4-8 when THAT is the asked model (not a silent fallback).
check("opus-4-8 asked + served -> GREEN", claudeServeOk(0, success("OK", "claude-opus-4-8"), "claude-opus-4-8", "OK"), true);

console.log(`OK   [delta-canonical-dispatch-smoke.test] ${passed} passed`);
