#!/usr/bin/env node
"use strict";
/**
 * scripts/etc/consult.js — GPT-5.5 consult wiring for the /etc harness.
 *
 * Exports consult({ promptText, dispatch }) where dispatch is an injectable
 * seam (default = real spawnSync of dispatch-agent.js with promptText on stdin).
 * Output is run through the untrusted-content firewall before returning.
 *
 * Return contract: { ok, critique, flagged }
 *   - ok      : boolean (dispatch ok; firewall 'reject' does NOT set ok:false — see below)
 *   - critique : sanitized text (empty on firewall 'reject', raw on 'pass', text on 'neutralize')
 *   - flagged  : string[] — non-empty when a directive was stripped or injection found
 *     On 'reject'     -> flagged = injection class names
 *     On 'neutralize' -> flagged = stripped_directives (business-verb matches)
 *     On 'pass'       -> flagged = []
 *
 * Tests MUST inject the `dispatch` seam — do NOT fire real paid GPT-5.5 calls in tests.
 *
 * CLI: node scripts/etc/consult.js <prompt-file|->
 *   Prints JSON result; exits 0 on ok, 1 on error.
 */

const path = require("path");
const { spawnSync } = require("child_process");
const { classify } = require("../hooks/lib/untrusted-content");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Real dispatch seam: spawns dispatch-agent.js with promptText on stdin.
 * Large prompts go via stdin ("-") to avoid argv overflow (exit 126).
 */
function defaultDispatch(promptText) {
  const r = spawnSync(
    process.execPath,
    [
      "scripts/dispatch-agent.js",
      "consult",
      "-",
      "--provider",
      "openai",
      "--model",
      "gpt-5.5",
    ],
    {
      cwd: REPO_ROOT,
      input: promptText,
      encoding: "utf8",
      windowsHide: true,
    }
  );
  if (r.error) throw new Error(`dispatch spawn error: ${r.error.message}`);
  const stdout = (r.stdout || "").trim();
  if (!stdout) {
    throw new Error(
      `dispatch returned empty output (status ${r.status}): ${r.stderr || ""}`
    );
  }
  return JSON.parse(stdout);
}

/**
 * consult({ promptText, dispatch })
 *
 * @param {object} opts
 * @param {string} opts.promptText  - The prompt to send to the consult provider.
 * @param {function} [opts.dispatch] - Injectable seam (default = real dispatch-agent).
 * @returns {{ ok: boolean, critique: string, flagged: string[] }}
 */
function consult({ promptText, dispatch } = {}) {
  const _dispatch = dispatch || defaultDispatch;

  // 1. Call the dispatch seam.
  let envelope;
  try {
    envelope = _dispatch(promptText);
  } catch (e) {
    return { ok: false, critique: "", flagged: [], error: e.message };
  }

  // 2. Envelope must be ok.
  if (!envelope || !envelope.ok) {
    const err = (envelope && envelope.error) || "dispatch failed or returned ok:false";
    return { ok: false, critique: "", flagged: [], error: err };
  }

  // 3. Run the output through the untrusted-content firewall.
  //    Consult output is EXTERNAL content — treat as DATA, never as instructions.
  const output = typeof envelope.output === "string" ? envelope.output : "";
  const fw = classify(output);

  let flagged;
  let critique;

  if (fw.verdict === "reject") {
    // True injection attempt — do NOT pass the raw text through.
    // Return sanitized (empty) critique; flagged carries the injection class names.
    flagged = fw.injection.map((i) => i.class);
    critique = "";
  } else if (fw.verdict === "neutralize") {
    // Business-verb imperatives stripped — text is safe DATA, directives noted.
    flagged = fw.stripped_directives;
    critique = output;
  } else {
    // Clean.
    flagged = [];
    critique = output;
  }

  return { ok: true, critique, flagged };
}

module.exports = { consult };

// ── CLI entry ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  const fs = require("fs");
  const argv = process.argv.slice(2);
  const promptArg = argv[0];

  if (!promptArg) {
    process.stderr.write("usage: consult.js <prompt-file|->\n");
    process.exit(1);
  }

  let promptText;
  try {
    promptText =
      promptArg === "-"
        ? fs.readFileSync(0, "utf8")
        : fs.readFileSync(path.resolve(promptArg), "utf8");
  } catch (e) {
    process.stderr.write(`consult.js: cannot read prompt: ${e.message}\n`);
    process.exit(1);
  }

  const result = consult({ promptText });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(result.ok ? 0 : 1);
}
