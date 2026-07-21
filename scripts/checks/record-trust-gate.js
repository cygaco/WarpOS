#!/usr/bin/env node
"use strict";

/**
 * record-trust-gate.js — the SHARP-3 NAMED ENFORCER for the design->build record-trust gate
 * (record-trust-gate.md; SP-20260718-005). Converts the record-trust checklist from discipline
 * into enforcement: a design phase that names a record-trust surface but ships no choke-point / no
 * falsifier fixture BLOCKS build-entry (exit 1). This is the enforcer the doctrine calls for so the
 * gate is not a hollow ladder rung.
 *
 * WHAT IT CHECKS (against a manifest — default the SP-005 manifest):
 *   1. COMPLETENESS — every surface names a non-empty choke_point AND structural_guard, and a
 *      scope in {same-session, cross-session}.
 *   2. PARTITION INVARIANT (SHARP-1) — a cross-session surface's trust_anchor must NOT reference a
 *      per-session-HMAC term (hmac / per-session-signature / attest-signing / sessionSecret). A
 *      cross-session artifact signed with the per-session secret is the R3 cross-session false-RED.
 *   3. FALSIFIER PRESENCE + SHAPE (SHARP-3) — every falsifier_fixture file EXISTS and carries the
 *      `FALSIFIER:` marker AND a `MUST-BLOCK` assertion token (fail-closed shape). A missing or
 *      unshapen falsifier BLOCKS build-entry.
 *   4. NEW-SURFACE COVERAGE — every surface introduced this phase (new_in_phase3:true) that gates
 *      an irreversible action must carry at least one falsifier fixture.
 *   5. VERIFIED_BY CLAIMS-VS-DISK (FIX-6 class-closer, SP-20260720-002 R1; ED-056/G0.1 claims-vs-disk
 *      false-green class) — when a `prd.md` sits alongside the manifest, every `verified_by:` reference
 *      it declares (a fully-qualified `scripts/**\/*.js`/`.md` path, including brace-expanded
 *      `{a,b,c}`-shaped lists) must resolve to an EXISTING file on disk. A dangling verified_by pointer —
 *      an AC that claims a test file that was never created — is a hand-authored claim that rots silently
 *      without a structural check; this makes it self-detect FOREVER, not just once by hand. A manifest
 *      with no sibling `prd.md` is unaffected (`checked:0`, not a violation — not every manifest ships one).
 *
 * MODES:
 *   default    — the design->build EXIT gate (presence + shape; fixtures may be RED pre-build).
 *   --built    — additionally require each named choke_point MODULE file to exist (used at
 *                gauntlet/release to confirm build actually wired the choke-points).
 *
 * Exit: 0 = gate satisfied · 1 = BLOCK (a violation) · 2 = usage / manifest unreadable (fail-closed).
 *
 *   node scripts/checks/record-trust-gate.js [--manifest <path>] [--built] [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const DEFAULT_MANIFEST = path.join(
  ROOT,
  ".claude",
  "project",
  "sprint",
  "sprints",
  "SP-20260718-005",
  "record-trust-gate.manifest.json",
);

const VALID_SCOPES = Object.freeze(["same-session", "cross-session"]);

/** Resolve a manifest reference like "scripts/x.js#fn" to its file path (drop the #anchor). */
function filePart(ref) {
  return String(ref || "").split("#")[0].trim();
}

function loadManifest(manifestPath) {
  let text;
  try {
    text = fs.readFileSync(manifestPath, "utf8");
  } catch (e) {
    return { ok: false, error: `manifest unreadable: ${e.message}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    return { ok: false, error: `manifest not valid JSON: ${e.message}` };
  }
  if (!parsed || !Array.isArray(parsed.surfaces)) {
    return { ok: false, error: "manifest missing 'surfaces' array (fail-closed)" };
  }
  return { ok: true, manifest: parsed };
}

/** A falsifier fixture is present+shaped iff it exists AND carries the FALSIFIER marker + a
 *  MUST-BLOCK assertion token. Checked WITHOUT running it (a fixture may be RED pre-build). */
function checkFalsifier(fixtureRel) {
  const abs = path.join(ROOT, fixtureRel);
  if (!fs.existsSync(abs)) return { ok: false, reason: "MISSING" };
  let body;
  try {
    body = fs.readFileSync(abs, "utf8");
  } catch (e) {
    return { ok: false, reason: `unreadable: ${e.message}` };
  }
  const hasMarker = /FALSIFIER:/.test(body);
  const hasMustBlock = /MUST-BLOCK/i.test(body);
  if (!hasMarker) return { ok: false, reason: "no `FALSIFIER:` marker (not a shaped falsifier)" };
  if (!hasMustBlock) return { ok: false, reason: "no `MUST-BLOCK` assertion token (fail-open shape)" };
  return { ok: true };
}

/**
 * extractVerifiedByRefs(prdText) -> {paths: string[], bare: string[]}. FIX-6 class-closer, COMPLETED in R2
 * (S5 / QA-SP002-006 + QA-SP002-R2-002).
 *
 *   `paths` — FULLY-QUALIFIED references (contain a `/`) ending `.js`/`.md`, including brace-expanded lists
 *             (`scripts/dispatch/falsifiers/{a,b,c}-check.falsifier.test.js` -> 3 paths).
 *   `bare`  — BARE filenames with no directory component (`missing-bare-proof.test.js`).
 *
 * R1 SKIPPED bare filenames entirely ("too ambiguous to resolve generically"), which left the universal
 * claims-vs-disk class-closer INCOMPLETE: a dangling BARE `verified_by:` yielded `extracted_paths: []` and
 * `evaluate_ok: true` — a false-green in exactly the class this gate exists to close. A class-closer that
 * covers only the convenient form is not a class-closer. Bare names are now EXTRACTED and RESOLVED against
 * the repo by basename (see `resolveBareRef`), FAIL-CLOSED on ambiguity: unresolvable -> violation.
 */
function extractVerifiedByRefs(prdText) {
  const found = new Set();
  const bare = new Set();
  const text = String(prdText || "");
  const blocks = text.split(/\n(?=-\s+\*\*AC)/);
  for (const block of blocks) {
    const vbMatch = block.match(/`verified_by:`([\s\S]*?)(?=\n\n|$)/);
    if (!vbMatch) continue;
    const vbText = vbMatch[1];

    const braceRe = /([\w./-]*)\{([^}]+)\}([\w./-]*\.(?:js|md))\b/g;
    let bm;
    while ((bm = braceRe.exec(vbText))) {
      const [, pre, alts, post] = bm;
      for (const alt of alts.split(",")) {
        const p = `${pre}${alt.trim()}${post}`;
        if (p.includes("/")) found.add(p);
        else bare.add(p);
      }
    }

    // Blank out the brace-expansion spans so their fragments are not re-scanned as bare names.
    const scanText = vbText.replace(braceRe, (m) => " ".repeat(m.length));

    const plainRe = /\b([\w.-]+\/[\w./-]+\.(?:js|md))\b/g;
    let pm;
    while ((pm = plainRe.exec(scanText))) {
      found.add(pm[1]);
    }

    // BARE filenames: a `.js`/`.md` token with NO `/` anywhere around it. Anchored on a non-path boundary so
    // the trailing segment of a fully-qualified path (already captured above) is never double-counted.
    const bareRe = /(^|[\s`'"(,])([\w][\w.-]*\.(?:js|md))(?=$|[\s`'"),;])/g;
    let bmm;
    while ((bmm = bareRe.exec(scanText))) {
      bare.add(bmm[2]);
    }
  }
  // A bare name that is ALSO the basename of a fully-qualified path in the same prd is already covered.
  const qualifiedBasenames = new Set(Array.from(found).map((p) => p.split("/").pop()));
  return { paths: Array.from(found), bare: Array.from(bare).filter((b) => !qualifiedBasenames.has(b)) };
}

const BARE_SCAN_ROOTS = ["scripts", ".claude", "framework", "docs"];
const BARE_SCAN_SKIP = new Set(["node_modules", ".git", "runtime", ".provider-tmp", ".worktrees"]);

/**
 * resolveBareRef(root, name) -> string[] of repo-relative paths whose basename === `name`. Bounded walk over
 * BARE_SCAN_ROOTS, skipping generated/vendor trees. FAIL-CLOSED by construction: an empty result means the
 * declaration cannot be backed by any file on disk, which is a violation — never a silent pass.
 */
function resolveBareRef(root, name) {
  const hits = [];
  for (const top of BARE_SCAN_ROOTS) {
    const start = path.join(root, top);
    if (!fs.existsSync(start)) continue;
    const stack = [start];
    while (stack.length) {
      const dir = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        if (BARE_SCAN_SKIP.has(ent.name)) continue;
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) stack.push(abs);
        else if (ent.isFile() && ent.name === name) hits.push(path.relative(root, abs).split(path.sep).join("/"));
      }
    }
  }
  return hits;
}

/**
 * checkVerifiedByPaths(root, prdPath) -> {ok, checked, missing:[], bareChecked, bareUnresolved:[],
 * class_closer_enforced:true}. Skips (ok:true, checked:0) when no prd.md sits alongside the manifest — not
 * every manifest ships one. `class_closer_enforced` is TRUE for ALL verified_by forms (S5): fully-qualified
 * paths are existence-checked, BARE filenames are basename-resolved against the repo and FAIL when
 * unresolvable.
 */
function checkVerifiedByPaths(root, prdPath) {
  if (!fs.existsSync(prdPath)) return { ok: true, checked: 0, missing: [], bareChecked: 0, bareUnresolved: [], class_closer_enforced: true };
  let text;
  try {
    text = fs.readFileSync(prdPath, "utf8");
  } catch (e) {
    return { ok: false, checked: 0, missing: [], bareChecked: 0, bareUnresolved: [], class_closer_enforced: true, error: e.message };
  }
  const { paths, bare } = extractVerifiedByRefs(text);
  const missing = paths.filter((p) => !fs.existsSync(path.join(root, p)));
  const bareUnresolved = bare.filter((b) => resolveBareRef(root, b).length === 0);
  return {
    ok: missing.length === 0 && bareUnresolved.length === 0,
    checked: paths.length,
    missing,
    bareChecked: bare.length,
    bareUnresolved,
    class_closer_enforced: true,
  };
}

function evaluate(manifest, opts = {}) {
  const forbidden = (manifest.trust_anchor_forbidden_for_cross_session || []).map((s) =>
    String(s).toLowerCase(),
  );
  const violations = [];
  const surfacesChecked = [];

  for (const s of manifest.surfaces) {
    const id = s.id || "(unnamed surface)";
    surfacesChecked.push(id);

    // 1. COMPLETENESS
    if (!s.choke_point || !String(s.choke_point).trim())
      violations.push(`${id}: no choke_point named`);
    if (!s.structural_guard || !String(s.structural_guard).trim())
      violations.push(`${id}: no structural_guard named`);
    if (!VALID_SCOPES.includes(s.scope))
      violations.push(`${id}: scope ${JSON.stringify(s.scope)} not in [${VALID_SCOPES.join(", ")}]`);

    // 2. PARTITION INVARIANT (SHARP-1) — cross-session must not lean on per-session HMAC.
    if (s.scope === "cross-session") {
      const anchor = String(s.trust_anchor || "").toLowerCase();
      const hit = forbidden.find((term) => anchor.includes(term));
      if (hit)
        violations.push(
          `${id}: CROSS-SESSION surface declares a per-session-HMAC trust_anchor ("${hit}") — that is the R3 cross-session false-RED; use atomic-FS / content-addressed identity`,
        );
    }

    // 3. FALSIFIER PRESENCE + SHAPE (SHARP-3)
    const fixtures = Array.isArray(s.falsifier_fixtures) ? s.falsifier_fixtures : [];
    for (const fx of fixtures) {
      const r = checkFalsifier(fx);
      if (!r.ok) violations.push(`${id}: falsifier ${fx} -> ${r.reason}`);
    }

    // 3b. POSITIVE COMPANIONS (quality-lead) — a reject-everything stub can pass a whole reject-only falsifier
    // set while authorizing nothing. A surface that declares positive_companions must have them PRESENT (a
    // happy-path test that a valid record DOES authorize) so constant-false fails. Existence-only (no MUST-BLOCK).
    const companions = Array.isArray(s.positive_companions) ? s.positive_companions : [];
    for (const pc of companions) {
      if (!fs.existsSync(path.join(ROOT, pc)))
        violations.push(`${id}: positive_companion ${pc} -> MISSING (a reject-everything stub would false-green without it)`);
    }

    // 4. NEW-SURFACE COVERAGE — a new irreversible-gating surface must carry >=1 falsifier.
    if (s.new_in_phase3 === true && fixtures.length === 0)
      violations.push(`${id}: NEW record-trust surface with ZERO falsifier fixtures (SHARP-3 coverage gap)`);

    // 5. --built: the choke_point module must exist on disk.
    if (opts.built) {
      const cp = filePart(s.choke_point);
      if (cp && !fs.existsSync(path.join(ROOT, cp)))
        violations.push(`${id}: --built: choke_point module ${cp} does not exist (build did not wire it)`);
    }
  }

  // 6. VERIFIED_BY CLAIMS-VS-DISK (FIX-6 class-closer) — manifest-level, not per-surface: a sibling
  // prd.md's `verified_by:` pointers must all resolve to an existing file. Checked in BOTH modes.
  if (opts.manifestPath) {
    const prdPath = path.join(path.dirname(opts.manifestPath), "prd.md");
    const vb = checkVerifiedByPaths(opts.root || ROOT, prdPath);
    if (!vb.ok) {
      for (const m of vb.missing) {
        violations.push(
          `verified_by dangling reference: ${m} (named in ${path.relative(opts.root || ROOT, prdPath)} but absent on disk — FIX-6 class-closer)`,
        );
      }
      // S5 (R2): a BARE verified_by filename that resolves to NO file anywhere in the repo is the SAME
      // dangling-claim class — fail-closed on the unresolvable form too, never `extracted_paths: []` + pass.
      for (const b of vb.bareUnresolved) {
        violations.push(
          `verified_by dangling reference: ${b} (BARE filename named in ${path.relative(opts.root || ROOT, prdPath)} resolves to no file in the repo — FIX-6 class-closer, S5 bare-form)`,
        );
      }
    }
  }

  return { ok: violations.length === 0, violations, surfacesChecked, class_closer_enforced: true };
}

function main(argv) {
  const json = argv.includes("--json");
  const built = argv.includes("--built");
  const mi = argv.indexOf("--manifest");
  const manifestPath = mi !== -1 && argv[mi + 1] ? path.resolve(argv[mi + 1]) : DEFAULT_MANIFEST;

  const loaded = loadManifest(manifestPath);
  if (!loaded.ok) {
    if (json) process.stdout.write(JSON.stringify({ ok: false, error: loaded.error }, null, 2) + "\n");
    else process.stderr.write(`record-trust-gate: ${loaded.error}\n`);
    return 2;
  }

  const res = evaluate(loaded.manifest, { built, manifestPath });
  if (json) {
    process.stdout.write(
      JSON.stringify(
        {
          ok: res.ok,
          mode: built ? "built" : "design-exit",
          manifest: manifestPath,
          surfaces: res.surfacesChecked,
          violations: res.violations,
          class_closer_enforced: res.class_closer_enforced === true,
        },
        null,
        2,
      ) + "\n",
    );
  } else if (res.ok) {
    process.stdout.write(
      `record-trust-gate: PASS (${built ? "built" : "design-exit"}) — ${res.surfacesChecked.length} surfaces, all choke-points named, cross-session partition clean, falsifiers present+shaped.\n`,
    );
  } else {
    process.stdout.write(`record-trust-gate: BLOCK — ${res.violations.length} violation(s):\n`);
    for (const v of res.violations) process.stdout.write(`  - ${v}\n`);
  }
  return res.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = {
  loadManifest,
  evaluate,
  checkFalsifier,
  filePart,
  extractVerifiedByRefs,
  resolveBareRef,
  checkVerifiedByPaths,
  DEFAULT_MANIFEST,
};
