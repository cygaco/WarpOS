#!/usr/bin/env node
"use strict";
// One-off: assemble the cross-provider security-review prompt for the dispatch
// safety kernel + keystone. Output is a per-run artifact under runtime/.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const files = [
  "scripts/dispatch/safe-spawn.js",
  "scripts/dispatch/auth-resolver.js",
  "scripts/dispatch/dispatch-contract.js",
];
let p = "";
p += "You are an INDEPENDENT cross-provider security reviewer (a different model family from the Claude author — no self-grading). Adversarially review these three NEW WarpOS dispatch-safety modules for a Windows-first Node.js agent OS. Focus ONLY on real, exploitable defects, ranked by severity.\n\n";
p += "THREAT MODEL + required controls (from o3 deep-research, already adopted in design):\n";
p += "- CVE-2024-27980: Node can auto-shell .cmd/.bat past shell:false on Windows. safe-spawn invokes .cmd shims via `cmd.exe /c`.\n";
p += "- PATH/PATHEXT hijack: a planted claude.cmd earlier in PATH. resolveTool rejects repo-local + temp-dir resolutions and never lets the model supply the exe path.\n";
p += "- safe-spawn != safe ARGUMENTS: assertArgs must allowlist subcommands/flags per tool, not merely refuse shell metacharacters.\n";
p += "- env injection: dotenv must be parsed IN-CODE (never `export $(grep .env|xargs)`); a `$()`/backtick value must be returned inert AND flagged.\n";
p += "- secrets: never logged; auth-resolver returns source LABELS not values by default.\n\n";
p += "QUESTIONS: (1) Any BYPASS of assertArgs — an arg shape that reaches the tool carrying a dangerous flag/metachar? (2) Any resolveTool bypass — a hijack path that passes the repo/temp/approved-roots checks? (3) Any way dotenvParse executes or leaks a value? (4) Is the build_chain<->in-process-agent invariant in dispatch-contract actually enforced, or can a build-chain role be dispatched in-process? (5) Anything Windows-specific wrong (PATHEXT, slash-flags, cmd.exe quoting)? (6) Any concrete missed control or off-by-one.\n\n";
p += 'Respond as JSON ONLY: {"verdict":"PASS|CONCERNS|FAIL","findings":[{"severity":"critical|high|medium|low","file":"","issue":"","exploit":"","fix":""}],"summary":""}. Be specific with line-level detail. If nothing is exploitable, return PASS and state what you verified.\n\n';
for (const f of files) {
  p += "===== FILE: " + f + " =====\n" + fs.readFileSync(path.join(ROOT, f), "utf8") + "\n\n";
}
const out = path.join(__dirname, "security-review-prompt.txt");
fs.writeFileSync(out, p, "utf8");
console.log("prompt bytes:", Buffer.byteLength(p), "->", out);
