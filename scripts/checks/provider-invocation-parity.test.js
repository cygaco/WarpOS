"use strict";
/**
 * Tests for provider-invocation-parity.js (SP-20260723-005). Authentic teeth — the drift formats the
 * gauntlet (hunter F-1 + backend + qa) proved defeat the naive check:
 *  - REAL-DOCS 0-false-reject.
 *  - The ORIGINAL AGENTS.md drift (`agy [--model <model>]` with a "(prompt on stdin)" parenthetical) → RED.
 *  - trailing-parenthetical after the code span (hunter F-1) → RED. INCOMPLETE (missing marker) → RED.
 *    CONTRADICTORY (both markers) → RED. codex-with-`-p` → RED.
 *  - correct shapes → GREEN; prose mentioning a cli/flag → GREEN (no self-trip).
 *  - derive-from-code: codeShape reads usesStdin + the prompt-flag + tool-id from buildProviderArgv.
 */
const { test } = require("node:test");
const assert = require("node:assert");
const MOD = require("./provider-invocation-parity");

function fenced(cmd) {
  return "prose before the fence\n```\n" + cmd + "\n```\nprose after";
}
// A table row with the invocation in a backticked code span + trailing PROSE (the real AGENTS.md layout).
function cellWithProse(cmd, prose) {
  return `| \`x\` | \`y\` | \`${cmd}\` (${prose}) | auth |`;
}
function codes(text) {
  return MOD.computeFindings({ docs: [{ name: "FIXTURE.md", text }] }).findings.map((f) => f.code);
}

// ── REAL-DOCS 0-false-reject (the binding tooth) ────────────────────────────────
test("real provider docs match buildProviderArgv (0-false-reject)", () => {
  const res = MOD.computeFindings(); // reads the real AGENTS.md/CODEX.md/ANTIGRAVITY.md
  assert.strictEqual(res.ok, true, `real docs must be parity-clean; got: ${JSON.stringify(res.findings)}`);
  assert.ok(res.checkedCount >= 3, `must have checked the real invocation strings; checked ${res.checkedCount}`);
});

// ── derive-from-code (β + qa rider: nothing hardcoded) ──────────────────────────
test("codeShape derives usesStdin + prompt-flag + tool-id from buildProviderArgv", () => {
  const codex = MOD.codeShape("openai", "gpt-5.5");
  assert.strictEqual(codex.toolId, "codex");
  assert.strictEqual(codex.usesStdin, true, "codex prompt is on stdin");
  assert.ok(codex.hasStdinDash, "codex argv carries the trailing '-'");
  assert.strictEqual(codex.promptFlag, null, "a stdin provider has no prompt-flag");
  assert.ok(codex.longFlags.has("--sandbox") && !codex.longFlags.has("--ask-for-approval"));
  const agy = MOD.codeShape("antigravity", "gemini-3.1-pro-high");
  assert.strictEqual(agy.toolId, "agy");
  assert.strictEqual(agy.usesStdin, false, "agy prompt is on the -p argv value");
  assert.strictEqual(agy.promptFlag, "-p", "the prompt-flag is DERIVED from the argv (token before the prompt), not hardcoded");
});

// ── AUTHENTIC F1 drift — the real formats the gauntlet found ────────────────────
test("F1 ORIGINAL: the historical AGENTS.md agy drift `agy [--model <model>]` (prompt on stdin) → RED", () => {
  // The exact shape SP-005 corrected: no -p, delivery claimed in a trailing parenthetical.
  assert.deepStrictEqual(codes(cellWithProse("agy [--model <model>]", "prompt on stdin")), ["prompt_delivery_mismatch"]);
});
test("F1 hunter: agy with the stdin '-' + trailing parenthetical (prose after the code span) → RED", () => {
  assert.deepStrictEqual(codes(cellWithProse("agy --model <n> --print-timeout <d> -", "prompt on stdin")), ["prompt_delivery_mismatch"]);
});
test("F1: codex shown with -p (code is stdin) → RED", () => {
  assert.deepStrictEqual(codes(fenced("codex exec --sandbox workspace-write -m <model> -p '<prompt>'")), ["prompt_delivery_mismatch"]);
});
test("INCOMPLETE (qa): an agy invocation missing -p, or a codex invocation missing the trailing '-', → RED", () => {
  assert.deepStrictEqual(codes(fenced("agy --model <name> --print-timeout 90s")), ["prompt_delivery_mismatch"]);
  assert.deepStrictEqual(codes(fenced("codex exec --sandbox workspace-write -m <model>")), ["prompt_delivery_mismatch"]);
});
test("CONTRADICTORY (backend): an agy invocation showing BOTH -p and a bare stdin '-' → RED", () => {
  assert.deepStrictEqual(codes(fenced("agy --model <n> --print-timeout 90s -p prompt -")), ["prompt_delivery_mismatch"]);
});
test("CONTRADICTORY (backend/qa r2): a codex STDIN invocation ALSO showing an argv '-p' flag → RED (symmetric)", () => {
  // codex delivers on stdin (trailing '-'); a spurious '-p' is contradictory. The check derives the argv
  // prompt-flag set across providers, so this is caught without hardcoding '-p'.
  assert.deepStrictEqual(codes(fenced("codex exec --sandbox workspace-write -m <model> -p '<prompt>' -")), ["prompt_delivery_mismatch"]);
});

// ── correct shapes are GREEN ────────────────────────────────────────────────────
test("correct shapes are GREEN: agy -p argv, codex trailing '-' stdin (fenced + table)", () => {
  assert.deepStrictEqual(codes(fenced("agy --model <name> --print-timeout 90s -p '<prompt>'")), []);
  assert.deepStrictEqual(codes(fenced("codex exec --sandbox workspace-write -m <model> -")), []);
  assert.deepStrictEqual(codes(cellWithProse("agy --model <name> --print-timeout <dur> -p '<prompt>'", "prompt on the -p argv value, NOT stdin")), []);
});

// ── F2 stale flag ───────────────────────────────────────────────────────────────
test("F2: codex invocation carrying --ask-for-approval (not in the real argv) → stale_flag", () => {
  assert.ok(codes(fenced("codex exec --sandbox workspace-write --ask-for-approval never -m <model> -")).includes("stale_flag"));
});
test("a bracketed-optional [-c …] flag is NOT asserted mandatory (no false stale_flag)", () => {
  assert.deepStrictEqual(codes(fenced("codex exec --sandbox workspace-write [-c model_reasoning_effort=high] -m <model> -")), []);
});

// ── PROSE must not self-trip ────────────────────────────────────────────────────
test("prose mentioning `agy --allowedTools` outside a fence/table is NOT flagged", () => {
  const prose = "agy has NO per-tool permission mechanism — no --allowedTools, no --dangerously-skip-permissions.";
  assert.deepStrictEqual(codes(prose), []);
});
test("a trailing parenthetical after a CORRECT code span does not cause a false RED", () => {
  // The real AGENTS.md:80 shape — code span then explanatory prose (which even contains the string '-p').
  assert.deepStrictEqual(codes(cellWithProse("agy --model <name> --print-timeout <dur> -p '<prompt>'", "prompt on the `-p` argv value, NOT stdin — agy has no stdin -")), []);
});

// ── unit teeth ──────────────────────────────────────────────────────────────────
test("extractInvocations takes the backticked code span only (drops trailing prose)", () => {
  const invs = MOD.extractInvocations(cellWithProse("agy --model x -p y", "prompt on the -p value"), "agy");
  assert.strictEqual(invs.length, 1);
  assert.strictEqual(invs[0].cmd, "agy --model x -p y", "the extracted cmd must NOT include the trailing parenthetical prose");
});
test("hasBareStdinDash detects a whitespace-bounded '-' anywhere, not just at end", () => {
  assert.strictEqual(MOD.hasBareStdinDash("codex exec -m m -"), true);
  assert.strictEqual(MOD.hasBareStdinDash("agy --model x - (prompt on stdin)"), true, "mid-string bare '-' before prose");
  assert.strictEqual(MOD.hasBareStdinDash("agy --model x -p y"), false, "'-p' is not a bare '-'");
});
test("docMandatoryLongFlags excludes bracketed-optional segments", () => {
  const flags = MOD.docMandatoryLongFlags("codex exec --sandbox [-c x --extra] -m <m> -");
  assert.ok(flags.has("--sandbox"));
  assert.ok(!flags.has("--extra"), "flags inside [ … ] are optional, not asserted");
});
