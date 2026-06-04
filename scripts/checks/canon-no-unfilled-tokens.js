#!/usr/bin/env node
"use strict";

/**
 * /scan:canon-no-unfilled-tokens (WI-38) — the golden-flow gate's tripwire.
 *
 * The zero-unfilled-token assertion. A generated canonical set (the canon
 * engine's output — scripts/canon/generate.js) MUST contain ZERO raw `{{token}}`.
 * The engine guarantees this STRUCTURALLY via its degrade step (every unfilled
 * field becomes a visible `*needs input: <field>*` marker, never a raw token);
 * this scan is the standing enforcer that a raw token never SHIPS — replacing the
 * old warning-only "thin is a warning" behavior (the hollow `no-dumb-default`
 * check), which let raw `{{vision}}` etc. reach a product repo with exit 0.
 *
 * REJECTS (exit 1), never lints, when ANY emitted canonical artifact contains a
 * raw `{{token}}`. The `*needs input:*` markers are the SANCTIONED thin signal
 * (a human or an LLM brief-expand round fills them) and are reported, not failed —
 * unless --strict-needs-input is passed (a "fully-filled canon" variant, off by
 * default since WI-38's contract is specifically "no raw token").
 *
 * Internal error / missing-or-unreadable target dir => exit 2 (fail-closed: a scan
 * that cannot read its target must NEVER read green — the false-green lesson,
 * project_enforcer_falsegreen_gauntlet / BC-16).
 *
 *   node scripts/checks/canon-no-unfilled-tokens.js [--dir <canonical-dir>] [--json] [--strict-needs-input]
 *
 * Default --dir resolves to <repo>/_requirements/00-canonical (the canon engine's
 * default --out). Override for a product repo or a test fixture dir.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");

// Raw template token: `{{ token }}`. This is the invariant breach.
const RAW_TOKEN_RE = /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g;
// The sanctioned "no intent source" marker the engine degrades to.
const NEEDS_INPUT_RE = /\*needs input:\s*([a-zA-Z0-9_]+)\s*\*/g;

// Artifacts the canon engine emits (extension-gated, so a stray README isn't scanned).
function isCanonArtifact(name) {
  return /\.(md|json)$/.test(name);
}

function parseArgs(argv) {
  const out = { dir: null, json: false, strictNeedsInput: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dir") out.dir = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--strict-needs-input") out.strictNeedsInput = true;
  }
  return out;
}

function resolveDir(arg) {
  if (arg) return path.isAbsolute(arg) ? arg : path.resolve(REPO_ROOT, arg);
  return path.join(REPO_ROOT, "_requirements", "00-canonical");
}

function main(argv) {
  const args = parseArgs(argv);
  const errors = []; // raw-token leaks (always a failure) + strict needs-input
  const needsInput = []; // sanctioned thin markers (reported)
  let scanned = 0;
  let dir;
  try {
    dir = resolveDir(args.dir);
    // Fail-closed: a missing/unreadable target is exit 2, NOT a green "0 leaks".
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      process.stderr.write(
        `canon-no-unfilled-tokens: cannot read target dir ${path.relative(REPO_ROOT, dir)} — ${e.message}\n`,
      );
      return 2;
    }
    for (const e of ents) {
      if (!e.isFile() || !isCanonArtifact(e.name)) continue;
      scanned++;
      let body;
      try {
        body = fs.readFileSync(path.join(dir, e.name), "utf8");
      } catch (err) {
        // A file we can list but can't read is a real fault — fail-closed.
        process.stderr.write(
          `canon-no-unfilled-tokens: cannot read ${e.name} — ${err.message}\n`,
        );
        return 2;
      }
      let m;
      RAW_TOKEN_RE.lastIndex = 0;
      while ((m = RAW_TOKEN_RE.exec(body)) !== null) {
        errors.push(`${e.name}: raw unfilled token "${m[0]}"`);
      }
      NEEDS_INPUT_RE.lastIndex = 0;
      while ((m = NEEDS_INPUT_RE.exec(body)) !== null) {
        needsInput.push(`${e.name}:${m[1]}`);
      }
    }
    // Fail-closed: an EMPTY canonical dir is not "clean" — generate produced
    // nothing (or pointed at the wrong dir). A real canonical set has artifacts.
    if (scanned === 0) {
      process.stderr.write(
        `canon-no-unfilled-tokens: no canonical artifacts (*.md/*.json) found in ${path.relative(REPO_ROOT, dir)} — nothing to assert (run the canon engine first / check --dir)\n`,
      );
      return 2;
    }
    if (args.strictNeedsInput && needsInput.length) {
      for (const n of needsInput)
        errors.push(`${n}: field still needs input (--strict-needs-input)`);
    }
  } catch (e) {
    process.stderr.write(`canon-no-unfilled-tokens error: ${e.message}\n`);
    return 2; // fail-closed
  }
  return emit(args.json, { errors, needsInput, scanned, dir });
}

function emit(json, { errors, needsInput, scanned, dir }) {
  const rel = path.relative(REPO_ROOT, dir);
  if (json) {
    process.stdout.write(
      JSON.stringify(
        { ok: errors.length === 0, dir: rel, scanned, errors, needs_input: needsInput },
        null,
        2,
      ) + "\n",
    );
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(
      `OK canon-no-unfilled-tokens: ${scanned} artifact(s) in ${rel}, zero raw {{tokens}}` +
        (needsInput.length
          ? ` (${needsInput.length} sanctioned "needs input:" marker(s): ${needsInput.join(", ")})`
          : "") +
        "\n",
    );
    return 0;
  }
  process.stderr.write(
    `FAIL canon-no-unfilled-tokens (${errors.length}) in ${rel}:\n${errors
      .map((e) => `  - ${e}`)
      .join("\n")}\n`,
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { main, parseArgs, resolveDir, RAW_TOKEN_RE, NEEDS_INPUT_RE };
