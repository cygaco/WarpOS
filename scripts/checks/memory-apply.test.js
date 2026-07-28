#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// memory-apply.test.js — planted-case + live sealed-store test for the GATED
// memory mutation executor (scripts/checks/memory-apply.js).
//
// Two layers (modelled on doc-ref-integrity.test.js):
//   • PURE validatePlan() — the safety gate — proved on synthetic plans with NO
//     disk: contradicted+evidence delete is allowed; the load-bearing invariant
//     (an UNVERIFIABLE — or verified — delete/correct is ALWAYS rejected) holds;
//     missing newBody / empty evidence / unknown action|classification are rejected;
//     action:none is always allowed.
//   • LIVE in a sealed fs.mkdtempSync store: a valid contradicted-delete plan
//     DRY-RUN (default) mutates NOTHING + exits 0; --apply removes the file AND its
//     MEMORY.md index line and leaves the store structurally clean (exit 0). An
//     unverifiable-delete plan exits 2 with the file STILL PRESENT (nothing mutated).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const CHECK = path.join(__dirname, "memory-apply.js");
const mod = require("./memory-apply.js");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

// ── PURE validatePlan(): the safety gate ─────────────────────────────────────

ok("PLANTED: delete on contradicted WITH evidence is ALLOWED", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence: "grep shows the claim is false" }],
  });
  assert.strictEqual(v.ok, true, `expected ok, got ${JSON.stringify(v.violations)}`);
  assert.strictEqual(v.violations.length, 0);
  assert.deepStrictEqual(v.planned, [{ file: "a.md", action: "delete" }]);
});

ok("INVARIANT: delete on UNVERIFIABLE is ALWAYS rejected ('couldn't verify' is not 'delete')", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "unverifiable", action: "delete", evidence: "could not find ground truth" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations.length, 1);
  assert.strictEqual(v.violations[0].reason, "only a contradicted memory may be mutated");
});

ok("INVARIANT: delete on VERIFIED is rejected (a true memory is never deleted)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "verified", action: "delete", evidence: "confirmed true" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations[0].reason, "only a contradicted memory may be mutated");
});

ok("PLANTED: correct with NO newBody is rejected", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "correct", evidence: "the value drifted" }],
  });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.violations[0].reason, "correct requires newBody");
});

ok("PLANTED: correct on contradicted WITH evidence + newBody is ALLOWED", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: a\n---\nfixed\n" }],
  });
  assert.strictEqual(v.ok, true, JSON.stringify(v.violations));
  // planned now carries the validated newBody so run() applies exactly what was gated
  // (no plan re-lookup / last-wins divergence).
  assert.deepStrictEqual(v.planned, [{ file: "a.md", action: "correct", newBody: "---\nname: a\n---\nfixed\n" }]);
});

ok("PLANTED: correct/delete with EMPTY (whitespace) evidence is rejected", () => {
  const del = mod.validatePlan({
    store: "s",
    changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence: "   " }],
  });
  assert.strictEqual(del.violations[0].reason, "mutation requires ground-truth evidence");
  const corr = mod.validatePlan({
    store: "s",
    changes: [{ file: "b.md", classification: "contradicted", action: "correct", evidence: "", newBody: "x" }],
  });
  assert.strictEqual(corr.violations[0].reason, "mutation requires ground-truth evidence");
});

ok("PLANTED: action 'none' is always allowed (even unverifiable, no evidence)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "unverifiable", action: "none" },
      { file: "b.md", classification: "verified", action: "none" },
    ],
  });
  assert.strictEqual(v.ok, true, JSON.stringify(v.violations));
  assert.strictEqual(v.planned.length, 2);
});

ok("PLANTED: unknown action or classification is rejected", () => {
  const badAction = mod.validatePlan({ store: "s", changes: [{ file: "a.md", classification: "contradicted", action: "purge", evidence: "x" }] });
  assert.strictEqual(badAction.violations[0].reason, "invalid action/classification");
  const badClass = mod.validatePlan({ store: "s", changes: [{ file: "b.md", classification: "maybe", action: "delete", evidence: "x" }] });
  assert.strictEqual(badClass.violations[0].reason, "invalid action/classification");
});

ok("PLANTED: all-or-nothing — one bad change fails the whole plan", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "false" },
      { file: "b.md", classification: "unverifiable", action: "delete", evidence: "dunno" },
    ],
  });
  assert.strictEqual(v.ok, false, "a single unsafe change fails the plan");
  assert.strictEqual(v.violations.length, 1);
  assert.strictEqual(v.violations[0].file, "b.md");
});

// ── removeIndexLines: reuses the detector's parseIndex ────────────────────────
ok("removeIndexLines drops only the matching target line", () => {
  const index = "- [Alpha](a.md) — h\n- [Bravo](b.md) — h\n- [Gamma](c.md) — h\n";
  const next = mod.removeIndexLines(index, new Set(["b.md"]));
  assert.ok(/a\.md/.test(next) && /c\.md/.test(next), "kept the others");
  assert.ok(!/b\.md/.test(next), "dropped the deleted target's line");
});

// ── LIVE sealed store ─────────────────────────────────────────────────────────

function seedStore(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const mk = (slug) => `---\nname: ${slug}\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n`;
  fs.writeFileSync(path.join(dir, "keep_one.md"), mk("keep-one"));
  fs.writeFileSync(path.join(dir, "drop_one.md"), mk("drop-one"));
  fs.writeFileSync(
    path.join(dir, "MEMORY.md"),
    "- [Keep One](keep_one.md) — a memory\n- [Drop One](drop_one.md) — a memory\n",
  );
}
function writePlan(dir, plan) {
  const p = path.join(dir, "plan.json");
  fs.writeFileSync(p, JSON.stringify(plan, null, 2));
  return p;
}

ok("LIVE: a valid contradicted-delete plan DRY-RUN (default) mutates NOTHING and exits 0", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER shows this fact was reversed" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(r.status, 0, "clean dry-run exits 0");
  assert.strictEqual(out.dryRun, true);
  assert.strictEqual(out.applied, false);
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "dry-run did NOT delete the file");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index untouched");
});

ok("LIVE: --apply removes the file + its MEMORY.md index line and leaves the store clean (exit 0)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER shows this fact was reversed" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  const out = JSON.parse(r.stdout);
  assert.strictEqual(r.status, 0, `apply should exit 0 clean, got ${r.status} :: ${r.stderr}`);
  assert.strictEqual(out.applied, true);
  assert.ok(!fs.existsSync(path.join(store, "drop_one.md")), "the file was deleted");
  const idx = fs.readFileSync(path.join(store, "MEMORY.md"), "utf8");
  assert.ok(!/drop_one\.md/.test(idx), "the index line was removed");
  assert.ok(/keep_one\.md/.test(idx), "the surviving entry is intact");
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean (bijection intact)");
});

ok("LIVE: an unverifiable-delete plan exits 2 with the file STILL PRESENT (nothing mutated)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "unverifiable", action: "delete", evidence: "could not confirm either way" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "an unverifiable delete is fail-closed exit 2 even under --apply");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "nothing mutated — the file is still present");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index still present");
});

ok("LIVE: a bad store (no MEMORY.md) is fail-closed exit 2", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-"));
  const store = path.join(base, "notastore");
  fs.mkdirSync(store, { recursive: true });
  const plan = writePlan(base, { store, changes: [] });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a store without MEMORY.md is not a valid store");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
});

// ── PURE path-safety gate (security gauntlet r3) ─────────────────────────────

ok("PURE: isSafeStoreFilename accepts a plain *.md name, rejects traversal/absolute/separator/non-md", () => {
  assert.strictEqual(mod.isSafeStoreFilename("feedback_x.md"), true);
  assert.strictEqual(mod.isSafeStoreFilename("../SECRET.md"), false, "parent traversal");
  assert.strictEqual(mod.isSafeStoreFilename("a/b.md"), false, "separator");
  assert.strictEqual(mod.isSafeStoreFilename("a\\b.md"), false, "backslash");
  assert.strictEqual(mod.isSafeStoreFilename(path.resolve("/tmp/x.md")), false, "absolute");
  assert.strictEqual(mod.isSafeStoreFilename(".."), false);
  assert.strictEqual(mod.isSafeStoreFilename("notmd.txt"), false, "non-.md");
  assert.strictEqual(mod.isSafeStoreFilename(""), false);
});

ok("PLANTED: validatePlan REJECTS a delete whose file is a traversal path", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [{ file: "../../CLAUDE.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  assert.strictEqual(v.ok, false);
  assert.ok(/unsafe file path/.test(v.violations[0].reason), v.violations[0] && v.violations[0].reason);
});

ok("PLANTED: validatePlan REJECTS duplicate file entries", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "verified", action: "none" },
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "x" },
    ],
  });
  assert.strictEqual(v.ok, false);
  assert.ok(v.violations.some((x) => /duplicate file entry/.test(x.reason)));
});

// ── LIVE security: traversal + symlink cannot escape the store ────────────────

ok("LIVE-SECURITY: a path-traversal delete is fail-closed and CANNOT delete a file OUTSIDE the store", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-trav-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const sentinel = path.join(base, "SECRET.md"); // lives OUTSIDE the store
  fs.writeFileSync(sentinel, "do not delete me\n");
  const plan = writePlan(base, {
    store,
    changes: [{ file: "../SECRET.md", classification: "contradicted", action: "delete", evidence: "attacker-supplied" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a traversal path is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(sentinel), "the out-of-store file MUST survive (no traversal delete)");
  // an ABSOLUTE path is rejected too
  const plan2 = writePlan(base, {
    store,
    changes: [{ file: sentinel, classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r2 = spawnSync("node", [CHECK, "--plan", plan2, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r2.status, 2, "an absolute path is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(sentinel), "sentinel still present after the absolute-path attempt");
});

ok("LIVE-SECURITY: a symlinked memory file is rejected under --apply (no out-of-store write) [skips if symlink unsupported]", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-sym-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "OUTSIDE.md");
  fs.writeFileSync(outside, "original outside content\n");
  const linkPath = path.join(store, "drop_one.md");
  fs.unlinkSync(linkPath); // replace the real store file with a symlink to the outside file
  try {
    fs.symlinkSync(outside, linkPath, "file");
  } catch (e) {
    console.log("  (skip: symlink creation not permitted on this platform)");
    return;
  }
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "x", newBody: "MALICIOUS\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a symlink target is rejected fail-closed exit 2");
  assert.strictEqual(fs.readFileSync(outside, "utf8"), "original outside content\n", "the symlink target was NOT overwritten");
});

// ── security gauntlet r5 (agy lane): the MEMORY.md index is never a mutation target ──
ok("PURE: isSafeStoreFilename REJECTS the index file MEMORY.md (case-insensitive)", () => {
  assert.strictEqual(mod.isSafeStoreFilename("MEMORY.md"), false);
  assert.strictEqual(mod.isSafeStoreFilename("memory.md"), false);
  assert.strictEqual(mod.isSafeStoreFilename("Memory.MD"), false);
  assert.strictEqual(mod.isSafeStoreFilename("a.md:MEMORY.md"), false, "NTFS alternate-data-stream name rejected");
  assert.strictEqual(mod.isSafeStoreFilename("x.md:stream"), false, "any ':' rejected (honest .md suffix)");
  assert.strictEqual(mod.isSafeStoreFilename("feedback_x.md"), true, "a real per-fact file still passes");
});

ok("PLANTED: validatePlan REJECTS a delete/correct targeting MEMORY.md", () => {
  const del = mod.validatePlan({
    store: "s",
    changes: [{ file: "MEMORY.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  assert.strictEqual(del.ok, false);
  assert.ok(/unsafe file path/.test(del.violations[0].reason));
});

ok("LIVE-SECURITY: a plan targeting MEMORY.md for delete is fail-closed and does NOT corrupt the index", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-idx-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "MEMORY.md", classification: "contradicted", action: "delete", evidence: "attacker-supplied" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "targeting the index is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "MEMORY.md")), "the index file MUST still exist (not deleted)");
  assert.ok(/keep_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "index content intact");
});

// ── security gauntlet r7 (agy lane): all-or-nothing hardening ─────────────────
ok("PLANTED: validatePlan REJECTS a CASE-ONLY-distinct duplicate (a.md + A.md)", () => {
  const v = mod.validatePlan({
    store: "s",
    changes: [
      { file: "a.md", classification: "contradicted", action: "delete", evidence: "x" },
      { file: "A.md", classification: "contradicted", action: "delete", evidence: "y" },
    ],
  });
  assert.strictEqual(v.ok, false, "a.md + A.md resolve to one file on a case-insensitive FS");
  assert.ok(v.violations.some((x) => /duplicate file entry/.test(x.reason)));
});

ok("LIVE-SECURITY: a DIRECTORY named foo.md is rejected in preflight (not unlinked mid-apply)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-dir-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.mkdirSync(path.join(store, "dir_as_file.md")); // a directory masquerading as a memory file
  const plan = writePlan(base, {
    store,
    changes: [{ file: "dir_as_file.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a non-regular target is rejected fail-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "dir_as_file.md")), "the directory is untouched");
  assert.ok(fs.existsSync(path.join(store, "keep_one.md")), "no partial mutation of siblings");
});

ok("LIVE-SECURITY: an unreadable index (MEMORY.md is a dir) fails BEFORE any delete (FIX-C)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-idx2-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.unlinkSync(path.join(store, "MEMORY.md")); // make the index unreadable-as-a-file
  fs.mkdirSync(path.join(store, "MEMORY.md")); // ...by replacing it with a directory
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "x" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "an unreadable index pre-read fails-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "the file was NOT deleted (pre-read failed before the mutation loop)");
});

// ── security gauntlet r8 (agy+qa): the case-insensitivity class, one canonicalization ──
ok("PURE: canonicalStoreName resolves a case-variant plan name to the real on-disk entry", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-canon-"));
  const store = path.join(base, "agent");
  seedStore(store); // writes drop_one.md, keep_one.md, MEMORY.md
  assert.strictEqual(mod.canonicalStoreName(store, "DROP_ONE.md"), "drop_one.md", "case-variant resolves to disk name");
  assert.strictEqual(mod.canonicalStoreName(store, "drop_one.md"), "drop_one.md", "exact match");
  assert.strictEqual(mod.canonicalStoreName(store, "nope.md"), null, "no match → null");
});

ok("LIVE-SECURITY: deleting a CASE-VARIANT name (DROP_ONE.md) removes the file AND its index line (no broken pointer)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-case-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "DROP_ONE.md", classification: "contradicted", action: "delete", evidence: "TRACKER reversed it" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, `apply should be clean, got ${r.status} :: ${r.stderr}`);
  assert.ok(!fs.existsSync(path.join(store, "drop_one.md")), "the real (lowercase) file was deleted");
  const idx = fs.readFileSync(path.join(store, "MEMORY.md"), "utf8");
  assert.ok(!/drop_one\.md/i.test(idx), "the index line was removed (case-insensitive) — no broken pointer");
  const out = JSON.parse(r.stdout);
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean (bijection intact)");
});

ok("LIVE-SECURITY: a CORRECT-only apply with an unreadable index (MEMORY.md dir) fails BEFORE the correct (no partial)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-corr-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = fs.readFileSync(path.join(store, "drop_one.md"), "utf8");
  fs.unlinkSync(path.join(store, "MEMORY.md"));
  fs.mkdirSync(path.join(store, "MEMORY.md")); // index is now a dir → not a readable regular file
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: drop-one\ndescription: x\nmetadata:\n  type: feedback\n---\nCORRECTED\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "index pre-check fails-closed BEFORE any correct (exit 2)");
  assert.strictEqual(fs.readFileSync(path.join(store, "drop_one.md"), "utf8"), before, "the fact file was NOT rewritten (no partial mutation)");
});

// ── security gauntlet r9 (backend): all-or-nothing rollback + malformed-plan ──────
ok("LIVE-SECURITY: a mid-sequence apply fault ROLLS BACK op1's delete — true all-or-nothing (:322)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-rollback-"));
  const store = path.join(base, "agent");
  seedStore(store); // drop_one.md, keep_one.md, MEMORY.md
  // Make keep_one.md read-only so the correct (op2) THROWS after the delete (op1) commits.
  fs.chmodSync(path.join(store, "keep_one.md"), 0o444);
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "keep_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: keep-one\ndescription: x\nmetadata:\n  type: feedback\n---\nNEW\n" },
    ],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  try { fs.chmodSync(path.join(store, "keep_one.md"), 0o644); } catch {} // restore for cleanup
  assert.strictEqual(r.status, 2, "a mid-sequence fault fails-closed exit 2");
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "op1's deleted file was RESTORED by rollback — all-or-nothing held");
});

ok("LIVE: a non-array plan.changes is a MALFORMED plan (exit 2), not a silent empty one (:101)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-badplan-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const p = path.join(base, "plan.json");
  fs.writeFileSync(p, JSON.stringify({ store, changes: "not-an-array" }));
  const r = spawnSync("node", [CHECK, "--plan", p, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "non-array changes → fatal exit 2, not a silent exit 0");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
});

// ── gauntlet r10 (:417): --apply leaves the store CLEAN or BYTE-IDENTICAL, never corrupted ──
// Snapshot every file in a store so "byte-identical to pre-apply" is asserted, not assumed.
function snapshot(dir) {
  const snap = new Map();
  for (const name of fs.readdirSync(dir).sort()) {
    snap.set(name, fs.readFileSync(path.join(dir, name)).toString("base64"));
  }
  return snap;
}
function assertUnchanged(dir, before, why) {
  const after = snapshot(dir);
  assert.deepStrictEqual([...after.keys()], [...before.keys()], `${why}: the file SET changed`);
  for (const [name, bytes] of before) {
    assert.strictEqual(after.get(name), bytes, `${why}: '${name}' is not byte-identical to pre-apply`);
  }
}

// Run `body()` with the detector's post-check replaced by `fn`. The POST-CHECK is a real branch of
// run() — a post-check that errors or reports findings routes to the rollback — but since r12 the
// PROSPECTIVE pre-check refuses store-dirtying plans before they ever mutate, so a dirty store can
// no longer be used to reach the rollback. Substituting the post-check reaches the same branch
// deterministically and on every platform, and touches NOTHING in the production module: the
// projection calls mem.readStore/mem.evaluate, never mem.run.
function withPostCheck(fn, body) {
  const memmod = require("./memory-integrity.js");
  const orig = memmod.run;
  memmod.run = fn;
  try {
    return body();
  } finally {
    memmod.run = orig;
  }
}

ok("r10 PURE: validateNewBody accepts a valid memory file and names every structural defect", () => {
  assert.deepStrictEqual(
    mod.validateNewBody("---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nbody\n"),
    [],
    "a canonical memory file is valid",
  );
  assert.ok(/no YAML frontmatter/.test(mod.validateNewBody("just prose, no block\n")[0]), "no block is caught");
  const partial = mod.validateNewBody("---\nname: a-slug\n---\nbody\n");
  assert.ok(partial.some((r) => /'description'/.test(r)), "missing description named");
  assert.ok(partial.some((r) => /metadata\.type/.test(r)), "missing metadata.type named");
  const badType = mod.validateNewBody("---\nname: a-slug\ndescription: d\nmetadata:\n  type: nonsense\n---\nb\n");
  assert.strictEqual(badType.length, 1);
  assert.ok(/metadata\.type/.test(badType[0]));
});

// PLANTED RED — proves HALF ONE (pre-validation). Before the fix, validatePlan only required a
// non-empty newBody STRING, so this body was written to disk successfully; nothing threw, so the
// catch-only rollback never fired and a corrupted memory file was left behind.
ok("r10 PLANTED (half a): a correct plan with a STRUCTURALLY INVALID newBody is refused BEFORE any mutation", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-prevalid-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "TRACKER reversed it", newBody: "CORRUPTED — no frontmatter at all\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, `a structurally invalid newBody is fail-closed exit 2, got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.strictEqual(out.applied, false, "nothing was applied");
  assert.ok(
    (out.violations || []).some((x) => /newBody is not a valid memory file/.test(x.reason)),
    `the refusal names the body defect: ${JSON.stringify(out.violations)}`,
  );
  assertUnchanged(store, before, "invalid newBody refused pre-mutation");
});

ok("r10 PLANTED (half a): the SAME invalid newBody is refused in DRY-RUN too (no gate/apply divergence)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-dry-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "x", newBody: "---\nname: only-a-name\n---\nb\n" }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a dry-run must not promise a correct that --apply would refuse");
  assertUnchanged(store, before, "dry-run never mutates");
});

// PLANTED RED — the r12 MEDIUM fixture. This body PASSES per-file pre-validation (name +
// description + valid type), so validateNewBody cannot catch it; it is dirty only relative to the
// REST of the store — its name-slug collides with keep_one.md's. r10 caught it AFTER mutating and
// rolled back; r12 refuses it BEFORE mutating, because the pre-check now runs the detector over
// the store state the plan would produce instead of over the body alone.
ok("r12 MEDIUM: a correct that passes per-file validation but DIRTIES the store (duplicate name-slug) is refused BEFORE any mutation", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-prospect-"));
  const store = path.join(base, "agent");
  seedStore(store); // keep_one.md → name: keep-one ; drop_one.md → name: drop-one
  const before = snapshot(store);
  const collide = "---\nname: keep-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nCOLLIDES WITH keep_one.md\n";
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "TRACKER shows the slug was merged", newBody: collide }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, `a store-dirtying plan must fail closed (exit 2), got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.fatal, true);
  assert.strictEqual(out.applied, false, "nothing was applied");
  // THE claim: refused BEFORE the mutation, so there was no rollback to run at all.
  assert.strictEqual(out.rolledBack, undefined, "nothing was mutated, so no rollback should have been needed");
  assert.ok(
    (out.prospectiveFindings || []).some((f) => f.kind === "duplicate-name-slug"),
    `the store-wide finding is reported from the PROJECTED store: ${JSON.stringify(out.prospectiveFindings)}`,
  );
  assert.ok(
    (out.violations || []).some((x) => /duplicate-name-slug/.test(x.reason)),
    `the refusal names the collision: ${JSON.stringify(out.violations)}`,
  );
  assertUnchanged(store, before, "store-dirtying plan refused pre-mutation");
  // Asserted LAST, on purpose: the pre-mutation refusal above is what this test proves. This line
  // is the supporting claim — the body IS per-file valid, so the body-level gate cannot see it.
  assert.deepStrictEqual(mod.validateNewBody(collide), [], "the body is per-file VALID — the body-level gate cannot catch this");
});

// The post-check is now the BACKSTOP rather than the gate for this class, and it must still work:
// if anything the projection did not predict makes the store dirty, the mutations are rolled back.
ok("r12 MEDIUM: the post-check backstop still rolls back a store the projection did not predict", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-backstop-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER reversed it" }],
  });
  // A post-check that reports a finding the projection could not have seen (a concurrent writer,
  // a platform surprise). The plan itself is clean, so it clears every pre-mutation gate.
  const res = withPostCheck(
    () => ({ ok: false, fatal: false, findings: [{ severity: "high", check: "memory-integrity", kind: "duplicate-name-slug", dir: store, message: "a finding the projection did not predict" }], warnings: [] }),
    () => mod.run({ plan, apply: true }),
  );
  assert.strictEqual(res.fatal, true, "a dirty post-check still fails closed");
  assert.strictEqual(res.rolledBack, true, "the backstop rolled the mutations back");
  assert.strictEqual(res.applied, false, "rolled back cleanly → nothing net-applied");
  assert.ok((res.postFindings || []).some((f) => f.kind === "duplicate-name-slug"), "the post-check finding is reported");
  assertUnchanged(store, before, "post-check backstop rolled back");
});

ok("r10 NO-REGRESSION: a correct with a VALID body still applies cleanly and leaves the store clean", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-good-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const newBody = "---\nname: drop-one\ndescription: a corrected memory\nmetadata:\n  type: project\n---\n\nCORRECTED BODY.\n";
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "git log shows the value changed", newBody }],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, `a valid correct applies cleanly, got ${r.status} :: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, true);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(fs.readFileSync(path.join(store, "drop_one.md"), "utf8"), newBody, "the corrected body is on disk");
  assert.strictEqual((out.postFindings || []).length, 0, "post-check clean");
  assert.ok(/drop_one\.md/.test(fs.readFileSync(path.join(store, "MEMORY.md"), "utf8")), "correct leaves the index alone");
});

ok("r10/r12: a MIXED plan is all-or-nothing — one dirty-making correct blocks the sibling DELETE too", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r10-mixed-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.writeFileSync(path.join(store, "third.md"), "---\nname: third-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n");
  fs.appendFileSync(path.join(store, "MEMORY.md"), "- [Third](third.md) — a memory\n");
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "third.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "merged", newBody: "---\nname: keep-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nCOLLIDES.\n" },
    ],
  });
  const r = spawnSync("node", [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "the whole plan fails closed");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, false, "nothing net-applied");
  // r12: the collision is now seen in the PROJECTED store, so the whole plan — the sound delete
  // included — is refused before anything is written, rather than applied and then undone.
  assert.strictEqual(out.rolledBack, undefined, "refused pre-mutation, so no rollback was needed");
  assert.ok(
    (out.prospectiveFindings || []).some((f) => f.kind === "duplicate-name-slug"),
    `the projection names the collision: ${JSON.stringify(out.prospectiveFindings)}`,
  );
  assert.ok(fs.existsSync(path.join(store, "third.md")), "the sibling delete never happened");
  assertUnchanged(store, before, "mixed plan refused whole (index re-sync included)");
});

// ── gauntlet r11 HIGH-1: a hardlinked target cannot reach OUTSIDE the store ───
// A hardlink is a REGULAR file by every stat predicate, so lstat+isFile() cannot see one. Before
// r11, `correct` used fs.writeFileSync, which writes THROUGH the inode — the out-of-store twin was
// overwritten while the run reported ok:true with a clean post-check. Two fixtures, because there
// are two independent claims: the MECHANISM (rename never writes through an inode) and the
// END-TO-END refusal. Both are RED against 16bcf623.

ok("r11 HIGH-1 MECHANISM: atomicWriteInStore over a HARDLINKED target leaves the outside file BYTE-UNCHANGED", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-hl1-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "outside.md");
  const outsideBytes = Buffer.from("OUTSIDE SECRET — must never be rewritten\n", "utf8");
  fs.writeFileSync(outside, outsideBytes);
  const target = path.join(store, "drop_one.md");
  fs.unlinkSync(target);
  try {
    fs.linkSync(outside, target); // a REAL hardlink: store entry and outside file share one inode
  } catch (e) {
    console.log(`      (skipped: hardlinks unsupported here — ${e.code})`);
    return;
  }
  assert.ok(fs.lstatSync(target).nlink > 1, "precondition: the target really is hardlinked");

  mod.atomicWriteInStore(store, target, "REPLACEMENT BODY\n");

  assert.ok(
    fs.readFileSync(outside).equals(outsideBytes),
    "the OUT-OF-STORE file must be byte-unchanged (writeFileSync would have written through the inode)",
  );
  assert.strictEqual(fs.readFileSync(target, "utf8"), "REPLACEMENT BODY\n", "the in-store target got the new bytes");
  assert.strictEqual(fs.lstatSync(target).nlink, 1, "the target is no longer hardlinked — rename replaced the dir entry");
  assert.ok(
    !fs.readdirSync(store).some((n) => n.endsWith(".tmp")),
    "no temp file is left behind in the store",
  );
});

ok("r11 HIGH-1 END-TO-END: a valid `correct` plan on a HARDLINKED file is refused and the OUTSIDE file is BYTE-UNCHANGED", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-hl2-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "outside.md");
  const outsideBytes = Buffer.from("OUTSIDE SECRET — must never be rewritten\n", "utf8");
  fs.writeFileSync(outside, outsideBytes);
  const target = path.join(store, "drop_one.md");
  fs.unlinkSync(target);
  try {
    fs.linkSync(outside, target);
  } catch (e) {
    console.log(`      (skipped: hardlinks unsupported here — ${e.code})`);
    return;
  }
  // A fully VALID plan — contradicted, real evidence, structurally valid newBody. Nothing about
  // the PLAN is wrong; the danger is entirely in the target's extra directory entry.
  const plan = writePlan(base, {
    store,
    changes: [
      {
        file: "drop_one.md",
        classification: "contradicted",
        action: "correct",
        evidence: "grep shows the claim is false",
        newBody: "---\nname: drop-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNew body.\n",
      },
    ],
  });
  const r = spawnSync(process.execPath, [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "fail-closed on a hardlinked target");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, false, "nothing was applied");
  assert.ok(
    (out.violations || []).some((v) => /hard link/i.test(v.reason)),
    `preflight must name the hardlink, got ${JSON.stringify(out.violations)}`,
  );
  assert.ok(
    fs.readFileSync(outside).equals(outsideBytes),
    "the OUT-OF-STORE file must be byte-unchanged",
  );
});

// ── gauntlet r11 HIGH-3: rollback restores MEMORY.md BYTE-EXACTLY ─────────────
// The backup used to capture MEMORY.md as Buffer.from(preReadIndexText, "utf8") — the string that
// had already been DECODED at read time. A decode→re-encode round trip is not the identity on
// arbitrary bytes: invalid UTF-8 comes back as U+FFFD (EF BF BD). So `rolledBack: true` could be
// reported over a MEMORY.md whose bytes had changed. MEMORY.md is human-edited, so this is live.
// The assertion below is a BUFFER comparison on purpose — comparing strings would decode both
// sides and hide exactly the defect under test. RED against 16bcf623.
// r12 note on the TRIGGER (the claim is unchanged): these used to reach the rollback by seeding a
// structurally broken `bad.md` so the POST-check found the store dirty. Since r12 the PROSPECTIVE
// pre-check refuses that plan before it mutates, so the rollback is now reached the way it will be
// reached in the field — a post-check that could not certify the store — via withPostCheck.
ok("r11 HIGH-3: a rollback restores MEMORY.md BYTE-IDENTICALLY even when it holds invalid UTF-8", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-utf8-"));
  const store = path.join(base, "agent");
  fs.mkdirSync(store, { recursive: true });
  const mk = (slug) => `---\nname: ${slug}\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n`;
  fs.writeFileSync(path.join(store, "drop_one.md"), mk("drop-one"));
  fs.writeFileSync(path.join(store, "keep_one.md"), mk("keep-one"));
  // MEMORY.md carries a LONE 0xFF — a byte that is not valid UTF-8 and cannot survive a
  // decode→re-encode round trip. It sits in a hook, so the index still parses.
  const indexBytes = Buffer.concat([
    Buffer.from("- [Drop One](drop_one.md) — a memory\n- [Keep One](keep_one.md) — hook ", "utf8"),
    Buffer.from([0xff]),
    Buffer.from("\n", "utf8"),
  ]);
  fs.writeFileSync(path.join(store, "MEMORY.md"), indexBytes);
  assert.ok(
    !Buffer.from(indexBytes.toString("utf8"), "utf8").equals(indexBytes),
    "precondition: these bytes really do NOT survive a utf8 round trip",
  );

  const plan = writePlan(base, {
    store,
    changes: [
      {
        file: "drop_one.md",
        classification: "contradicted",
        action: "delete",
        evidence: "grep shows the claim is false",
      },
    ],
  });
  const res = withPostCheck(
    () => {
      throw new Error("simulated: the post-check could not verify the store");
    },
    () => mod.run({ plan, apply: true }),
  );
  assert.strictEqual(res.fatal, true, "an unverifiable post-check must refuse the apply");
  assert.strictEqual(res.rolledBack, true, "the transaction reports a clean rollback");

  const after = fs.readFileSync(path.join(store, "MEMORY.md"));
  assert.ok(
    after.equals(indexBytes),
    `rolledBack:true must mean BYTE-identical — got ${after.toString("hex")} vs ${indexBytes.toString("hex")}`,
  );
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "the delete was undone");
});

ok("r11 HIGH-3: the MEMORY.md backup is UNCONDITIONAL — a correct-only rollback restores it byte-exactly too", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-uncond-"));
  const store = path.join(base, "agent");
  fs.mkdirSync(store, { recursive: true });
  fs.writeFileSync(
    path.join(store, "drop_one.md"),
    "---\nname: drop-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n",
  );
  const indexBytes = Buffer.concat([
    Buffer.from("- [Drop One](drop_one.md) — a memory hook ", "utf8"),
    Buffer.from([0xff]),
    Buffer.from("\n", "utf8"),
  ]);
  fs.writeFileSync(path.join(store, "MEMORY.md"), indexBytes);
  const plan = writePlan(base, {
    store,
    changes: [
      {
        file: "drop_one.md",
        classification: "contradicted",
        action: "correct",
        evidence: "grep shows the claim is false",
        newBody: "---\nname: drop-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNew.\n",
      },
    ],
  });
  // A correct-only plan never writes MEMORY.md, so this proves the backup captures it anyway.
  const res = withPostCheck(
    () => {
      throw new Error("simulated: the post-check could not verify the store");
    },
    () => mod.run({ plan, apply: true }),
  );
  assert.strictEqual(res.fatal, true);
  assert.strictEqual(res.rolledBack, true);
  assert.ok(fs.readFileSync(path.join(store, "MEMORY.md")).equals(indexBytes), "MEMORY.md is byte-identical");
  assert.ok(
    !fs.readdirSync(store).some((n) => n.endsWith(".tmp")),
    "no temp file survives a rolled-back correct",
  );
});

// ── gauntlet r11 MEDIUM: invisible-only evidence is not evidence ──────────────
ok("r11 MEDIUM: evidence made ONLY of invisible characters is REJECTED", () => {
  // U+200B/U+2060/U+180E/U+034F are format characters, NOT whitespace — JS trim() leaves them, so
  // each of these cleared the old `.trim()` gate and applied a delete with visually blank audit
  // evidence. RED against 16bcf623.
  const invisibleOnly = [
    "\u200B",
    "\u200B\u200B\u200B",
    "\u2060",
    "\u180E",
    "\u034F",
    "\uFEFF\u200B",
    "\u200B \t\n",
    "\u00A0\u200B ",
    "\u200E\u200F",
  ];
  for (const evidence of invisibleOnly) {
    const v = mod.validatePlan({
      store: "s",
      changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence }],
    });
    assert.strictEqual(v.ok, false, `invisible-only evidence ${JSON.stringify(evidence)} must be rejected`);
    assert.strictEqual(v.violations[0].reason, "mutation requires ground-truth evidence");
  }
});

ok("r11 MEDIUM: evidence with ONE visible character still passes (the gate is not over-tight)", () => {
  for (const evidence of ["x", "\u200Bgrep shows the claim is false\u200B", " \u00A0 g \u200B "]) {
    const v = mod.validatePlan({
      store: "s",
      changes: [{ file: "a.md", classification: "contradicted", action: "delete", evidence }],
    });
    assert.strictEqual(v.ok, true, `visible evidence ${JSON.stringify(evidence)} must be accepted`);
  }
});

ok("r11 MEDIUM: hasVisibleText routes through the module's ONE INVIS/SPACE_MAP enumeration", () => {
  assert.strictEqual(typeof mod.hasVisibleText, "function");
  assert.ok(mod.INVIS instanceof RegExp && mod.SPACE_MAP instanceof RegExp, "both classes are exported, not inlined twice");
  assert.strictEqual(mod.hasVisibleText("\u200B"), false);
  assert.strictEqual(mod.hasVisibleText(""), false);
  assert.strictEqual(mod.hasVisibleText(null), false);
  assert.strictEqual(mod.hasVisibleText("a"), true);
  // /g regexes carry lastIndex — prove repeated calls do not alternate.
  assert.strictEqual(mod.hasVisibleText("\u200B"), false, "a second call agrees with the first");
  assert.strictEqual(mod.hasVisibleText("ab"), true);
  assert.strictEqual(mod.hasVisibleText("ab"), true, "no lastIndex leakage between calls");
});

// ── gauntlet r11 HIGH-2: the newBody pre-check no longer MIRRORS the detector ──
ok("r11 HIGH-2: validateNewBody REJECTS the parser shapes that used to yield a trusted type", () => {
  const dupMetadata =
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\nmetadata:\n  type: feedback\n---\nbody\n";
  const nonScalarChild =
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  tags: []\n---\nbody\n";
  for (const [label, body] of [["duplicate top-level metadata:", dupMetadata], ["metadata.tags: []", nonScalarChild]]) {
    const reasons = mod.validateNewBody(body);
    assert.ok(reasons.length > 0, `${label} must produce reasons, got none`);
    assert.ok(
      reasons.some((rr) => /metadata\.type/.test(rr)),
      `${label}: expected a metadata.type reason, got ${JSON.stringify(reasons)}`,
    );
  }
});

ok("r11 HIGH-2: the pre-check and the post-check are the SAME function, not two copies", () => {
  const memmod = require("./memory-integrity.js");
  assert.strictEqual(typeof memmod.frontmatterProblems, "function", "the shared validator is exported");
  // Every body the pre-check accepts must also satisfy the detector's own rules, and vice versa.
  const bodies = [
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n---\nbody\n",
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\n  tags: []\n---\nbody\n",
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: feedback\nmetadata:\n  type: user\n---\nbody\n",
    "---\nname: a-slug\ndescription: d\nmetadata:\n  type: nonsense\n---\nbody\n",
    "no frontmatter at all\n",
    "---\nname: a-slug\nmetadata:\n  type: feedback\n---\nbody\n",
  ];
  for (const body of bodies) {
    const pre = mod.validateNewBody(body);
    const post = memmod.frontmatterProblems(memmod.parseFrontmatter(body)).map((p) => p.message);
    assert.deepStrictEqual(pre, post, `pre-check and post-check disagree about ${JSON.stringify(body)}`);
  }
});

ok("r11 HIGH-2 LIVE: an --apply whose newBody carries a duplicated metadata block is fail-closed", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-dupmeta-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [
      {
        file: "drop_one.md",
        classification: "contradicted",
        action: "correct",
        evidence: "grep shows the claim is false",
        newBody:
          "---\nname: drop-one\ndescription: d\nmetadata:\n  type: feedback\nmetadata:\n  type: feedback\n---\nbody\n",
      },
    ],
  });
  const r = spawnSync(process.execPath, [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a structurally invalid newBody must be refused BEFORE any write");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, false);
  assert.ok(
    (out.violations || []).some((v) => /newBody is not a valid memory file/.test(v.reason)),
    `expected a newBody violation, got ${JSON.stringify(out.violations)}`,
  );
  assertUnchanged(store, before, "a refused newBody leaves the store untouched");
});

// ─────────────────────────────────────────────────────────────────────────────
// gauntlet r12 CRITICAL — the temp-and-rename mechanism is no longer escapable
//
// r11 moved the write off the TARGET's inode (rename replaces a directory entry). It left the
// write's SOURCE unguarded: the temp was created by `fs.writeFileSync(tmpAbs, data)` — a write BY
// PATH — at `.memory-apply.<pid>.<counter>.tmp`, a name built from two ENUMERABLE values. A
// hardlink pre-created at that path was followed exactly the way the target's used to be, so an
// ordinary `correct` plan overwrote an out-of-store file and still reported {ok:true,
// applied:true} with a clean post-check.
//
// The layers are tested SEPARATELY on purpose, so a later reader can see which one is the control:
//   • CONTROL      — `wx` exclusive create + a write through the DESCRIPTOR (the two tests below);
//   • depth        — an unguessable temp name;
//   • belt+braces  — nlink === 1 on the fresh descriptor;
//   • hygiene ONLY — the stray-temp refusal. Tested LAST and labelled, because it is NOT what
//     makes the escape impossible; the mechanism tests above hold with no scan in sight.
// ─────────────────────────────────────────────────────────────────────────────

const VALID_BODY = "---\nname: drop-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNew body.\n";

// Plant a hardlink to `outside` at EVERY temp name the pre-fix generator could pick in THIS
// process (pid is fixed; the counter is monotonic and shared across this file's earlier writes).
// Returns false if the platform has no hardlinks.
function plantEnumerableTempLinks(store, outside) {
  for (let i = 0; i < 64; i++) {
    const p = path.join(store, `.memory-apply.${process.pid}.${i}.tmp`);
    try {
      fs.linkSync(outside, p);
    } catch (e) {
      if (i === 0) {
        console.log(`      (skipped: hardlinks unsupported here — ${e.code})`);
        return false;
      }
    }
  }
  return true;
}

ok("r12 CRITICAL CONTROL: the temp is created O_EXCL ('wx') and written through the DESCRIPTOR, never by path", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-fd-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const target = path.join(store, "drop_one.md");

  const origOpen = fs.openSync;
  const origWrite = fs.writeFileSync;
  const origFstat = fs.fstatSync;
  const opens = [];
  const writeTargets = [];
  const fstatted = [];
  fs.openSync = (p, flags, mode) => {
    const fd = origOpen(p, flags, mode);
    opens.push({ p, flags, fd });
    return fd;
  };
  fs.writeFileSync = (dest, data, o) => {
    writeTargets.push(dest);
    return origWrite(dest, data, o);
  };
  fs.fstatSync = (fd, o) => {
    fstatted.push(fd);
    return origFstat(fd, o);
  };
  try {
    mod.atomicWriteInStore(store, target, "NEW BODY\n");
  } finally {
    fs.openSync = origOpen;
    fs.writeFileSync = origWrite;
    fs.fstatSync = origFstat;
  }

  assert.strictEqual(opens.length, 1, `exactly one temp open, got ${opens.length}`);
  assert.strictEqual(opens[0].flags, "wx", "the temp must be created O_CREAT|O_EXCL|O_WRONLY");
  assert.ok(writeTargets.length >= 1, "the data was written");
  for (const w of writeTargets) {
    assert.strictEqual(
      typeof w,
      "number",
      `the write must target a file DESCRIPTOR, got ${JSON.stringify(w)} — a write BY PATH after the exclusive open re-resolves the name and reopens the exact TOCTOU window the open closed`,
    );
  }
  assert.strictEqual(writeTargets[0], opens[0].fd, "the write goes to the descriptor the exclusive open returned");
  assert.ok(fstatted.includes(opens[0].fd), "nlink is checked on that same descriptor (belt-and-braces)");
  assert.strictEqual(fs.readFileSync(target, "utf8"), "NEW BODY\n", "the target still gets the new bytes");
});

ok("r12 CRITICAL MECHANISM: a hardlink planted at every ENUMERABLE temp name cannot capture the write", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-hltmp-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "outside.md");
  const outsideBytes = Buffer.from("OUTSIDE SECRET — must never be rewritten\n", "utf8");
  fs.writeFileSync(outside, outsideBytes);
  if (!plantEnumerableTempLinks(store, outside)) return;

  const target = path.join(store, "drop_one.md");
  mod.atomicWriteInStore(store, target, "REPLACEMENT BODY\n");

  assert.ok(
    fs.readFileSync(outside).equals(outsideBytes),
    "the OUT-OF-STORE file must be byte-unchanged — a write BY PATH to a pre-created temp follows the planted hardlink",
  );
  assert.strictEqual(fs.readFileSync(target, "utf8"), "REPLACEMENT BODY\n", "the in-store target got the new bytes");
});

ok("r12 CRITICAL END-TO-END (correct): a planted temp hardlink cannot reach an out-of-store file", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-e2e-corr-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "outside.md");
  const outsideBytes = Buffer.from("OUTSIDE SECRET — must never be rewritten\n", "utf8");
  fs.writeFileSync(outside, outsideBytes);
  if (!plantEnumerableTempLinks(store, outside)) return;

  // A fully ORDINARY plan: contradicted, real evidence, structurally valid body, a target with one
  // directory entry. Nothing about the plan or the target is suspicious.
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "grep shows the claim is false", newBody: VALID_BODY }],
  });
  const res = mod.run({ plan, apply: true }); // IN-PROCESS so process.pid matches the planted names

  // Asserted FIRST: the escape itself. Pre-fix this run returned {ok:true, applied:true} with a
  // clean post-check while the out-of-store file had been overwritten.
  assert.ok(
    fs.readFileSync(outside).equals(outsideBytes),
    "the OUT-OF-STORE file must be BYTE-UNCHANGED",
  );
  assert.strictEqual(res.fatal, true, "the apply must fail closed");
  assert.strictEqual(res.applied, false, "nothing was applied");
});

ok("r12 CRITICAL END-TO-END (delete/index): the index re-sync cannot reach an out-of-store file either", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-e2e-del-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const outside = path.join(base, "outside.md");
  const outsideBytes = Buffer.from("OUTSIDE SECRET — must never be rewritten\n", "utf8");
  fs.writeFileSync(outside, outsideBytes);
  if (!plantEnumerableTempLinks(store, outside)) return;

  // The delete path writes MEMORY.md through the SAME writer, so it reproduces independently.
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER shows this fact was reversed" }],
  });
  const res = mod.run({ plan, apply: true });

  // Asserted FIRST: the escape itself (pre-fix the outside file came back truncated/rewritten).
  assert.ok(
    fs.readFileSync(outside).equals(outsideBytes),
    "the OUT-OF-STORE file must be BYTE-UNCHANGED (the index re-sync used to write through it)",
  );
  assert.strictEqual(res.fatal, true, "the apply must fail closed");
  assert.strictEqual(res.applied, false, "nothing was applied");
  assert.ok(fs.existsSync(path.join(store, "drop_one.md")), "the delete did not happen");
});

ok("r12 CRITICAL: EEXIST ABORTS the write fail-closed — it is NEVER retried under a fresh name", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-eexist-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const target = path.join(store, "drop_one.md");
  const before = fs.readFileSync(target);

  const origOpen = fs.openSync;
  let tempOpens = 0;
  fs.openSync = (p, flags, mode) => {
    if (typeof p === "string" && path.basename(p).startsWith(mod.TMP_PREFIX)) {
      tempOpens++;
      throw Object.assign(new Error("EEXIST: file already exists, open"), { code: "EEXIST" });
    }
    return origOpen(p, flags, mode);
  };
  let threw = null;
  try {
    mod.atomicWriteInStore(store, target, "SHOULD NEVER LAND\n");
  } catch (e) {
    threw = e;
  } finally {
    fs.openSync = origOpen;
  }

  assert.ok(threw, "the write must abort, not swallow the collision");
  assert.strictEqual(threw.code, "EEXIST", `the abort keeps the code: ${threw && threw.message}`);
  assert.strictEqual(
    tempOpens,
    1,
    `exactly ONE open attempt — a retry under a fresh name would mask an attack in progress (got ${tempOpens})`,
  );
  assert.ok(fs.readFileSync(target).equals(before), "the target is untouched");
  assert.ok(
    !fs.readdirSync(store).some((n) => n.startsWith(mod.TMP_PREFIX)),
    "no temp is left behind by the aborted write",
  );
});

ok("r12 CRITICAL depth: temp names are unguessable (crypto-random) and never repeat", () => {
  assert.strictEqual(typeof mod.tempFileName, "function", "the temp name has ONE generator");
  const names = new Set();
  for (let i = 0; i < 500; i++) {
    const n = mod.tempFileName();
    assert.ok(/^\.memory-apply\.[0-9a-f]{32}\.tmp$/.test(n), `unexpected temp-name shape: ${n}`);
    assert.ok(!n.includes(`.${process.pid}.`), "the pid must not appear in the name — it is enumerable");
    names.add(n);
  }
  assert.strictEqual(names.size, 500, "no repeats");
});

ok("r12 HYGIENE (explicitly NOT the control): a stray apply temp in the store refuses the plan", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-stray-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.writeFileSync(path.join(store, ".memory-apply.leftover-from-a-crash.tmp"), "junk\n");
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "e", newBody: VALID_BODY }],
  });
  const r = spawnSync(process.execPath, [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a store in an unexplained state is not written into");
  const out = JSON.parse(r.stdout);
  assert.ok(
    (out.violations || []).some((v) => /stray apply temp/.test(v.reason)),
    `the refusal names the stray temp: ${JSON.stringify(out.violations)}`,
  );
  assertUnchanged(store, before, "stray temp refused");
});

// ─────────────────────────────────────────────────────────────────────────────
// gauntlet r12 HIGH — `rolledBack` is an OBSERVATION of the store, not a report
// from the code that was supposed to restore it.
// ─────────────────────────────────────────────────────────────────────────────

ok("r12 HIGH: a rollback whose restore SILENTLY leaves wrong bytes reports rolledBack:false + ROLLBACK INCOMPLETE", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-rbverify-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const dropAbs = path.join(store, "drop_one.md");
  const dropBefore = fs.readFileSync(dropAbs);
  const newDrop = "---\nname: drop-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNEW DROP.\n";
  const newKeep = "---\nname: keep-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNEW KEEP.\n";
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "e1", newBody: newDrop },
      { file: "keep_one.md", classification: "contradicted", action: "correct", evidence: "e2", newBody: newKeep },
    ],
  });

  // Two sabotages, both in the RENAME — deliberately NOT in the temp writer, because this fixture
  // tests the VERIFICATION and must fail just as loudly with the writer fixed:
  //   rename #2 (forward, keep_one) THROWS  → the mid-flight fault that triggers the rollback;
  //   rename #3 (rollback, drop_one) silently does NOTHING → the restore "succeeds" and returns
  //     normally while drop_one.md keeps its mutated bytes. That is the exact shape all three
  //     previous rounds produced by three different mechanisms.
  const origRename = fs.renameSync;
  let renames = 0;
  fs.renameSync = (from, to) => {
    renames++;
    if (renames === 2) throw Object.assign(new Error("EIO: simulated mid-flight fault"), { code: "EIO" });
    if (renames > 2 && path.basename(String(to)) === "drop_one.md") {
      try {
        fs.unlinkSync(from); // drop the temp and pretend the restore landed
      } catch {
        /* best-effort */
      }
      return undefined;
    }
    return origRename(from, to);
  };
  let res;
  try {
    res = mod.run({ plan, apply: true });
  } finally {
    fs.renameSync = origRename;
  }

  assert.strictEqual(res.fatal, true, "the apply fails closed");
  assert.strictEqual(res.rolledBack, false, "a restore that did not restore must NOT be reported as a rollback");
  assert.strictEqual(res.rollbackVerified, false, "the verification is what caught it");
  assert.ok(
    (res.problems || []).some((p) => /ROLLBACK INCOMPLETE/.test(p)),
    `the operator is told the store is not as it was: ${JSON.stringify(res.problems)}`,
  );
  assert.ok(
    (res.changedFilesAfterRollback || []).includes("drop_one.md"),
    `the unrestored file is NAMED: ${JSON.stringify(res.changedFilesAfterRollback)}`,
  );
  assert.strictEqual(res.applied, true, "an incomplete rollback leaves a residual change — say so");
  // The report is TRUE, not merely cautious: the store really is not byte-identical.
  assert.ok(
    !fs.readFileSync(dropAbs).equals(dropBefore),
    "precondition of the claim: drop_one.md really does still hold its mutated bytes",
  );
});

ok("r12 HIGH: a genuine rollback still reports rolledBack:true — after RE-READING every captured path", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-rbok-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "keep_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody: "---\nname: keep-one\ndescription: corrected\nmetadata:\n  type: feedback\n---\n\nNEW.\n" },
    ],
  });
  const res = withPostCheck(
    () => {
      throw new Error("simulated: the post-check could not verify the store");
    },
    () => mod.run({ plan, apply: true }),
  );
  assert.strictEqual(res.rolledBack, true, "the restore really did restore");
  assert.strictEqual(res.rollbackVerified, true, "and the store was re-read to prove it");
  assert.deepStrictEqual(res.changedFilesAfterRollback, [], "nothing differs from the captured bytes");
  assert.ok(
    (res.problems || []).some((p) => /RE-READ/.test(p)),
    "the success message states that the claim was observed, not assumed",
  );
  assertUnchanged(store, before, "verified rollback");
});

// ─────────────────────────────────────────────────────────────────────────────
// gauntlet r12 MEDIUM — the pre-check and the post-check are ONE computation
// ─────────────────────────────────────────────────────────────────────────────

ok("r12 MEDIUM: the PROJECTED store is exactly what the detector reads after the apply", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-proj-"));
  const store = path.join(base, "agent");
  seedStore(store);
  fs.writeFileSync(path.join(store, "third.md"), "---\nname: third-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n");
  fs.appendFileSync(path.join(store, "MEMORY.md"), "- [Third](third.md) — a memory\n");
  const indexText = fs.readFileSync(path.join(store, "MEMORY.md"), "utf8");

  const newBody = "---\nname: drop-one\ndescription: corrected\nmetadata:\n  type: project\n---\n\nCORRECTED [[keep-one]].\n";
  const mutations = [
    { file: "third.md", canonicalFile: "third.md", action: "delete" },
    { file: "drop_one.md", canonicalFile: "drop_one.md", action: "correct", newBody },
  ];
  const projected = mod.projectStoreState(store, mutations, indexText);

  // Now really apply the same ops and read the store back off disk.
  const plan = writePlan(base, {
    store,
    changes: [
      { file: "third.md", classification: "contradicted", action: "delete", evidence: "reversed" },
      { file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "drifted", newBody },
    ],
  });
  const res = mod.run({ plan, apply: true });
  assert.strictEqual(res.applied, true, `the plan is clean and should apply: ${JSON.stringify(res.problems || res.violations)}`);

  const memmod = require("./memory-integrity.js");
  const actual = memmod.readStore(store, projected.dir, memmod.DEFAULT_MAX_INDEX_LINES);
  assert.deepStrictEqual(projected, actual, "the projection is the post-apply store record, not an approximation of it");
  assert.deepStrictEqual(
    memmod.evaluate({ stores: [projected] }),
    memmod.evaluate({ stores: [actual] }),
    "so the pre-check and the post-check are the SAME computation over the SAME state",
  );
});

ok("r12 MEDIUM: an ALREADY-dirty store is refused BEFORE mutation, not applied and rolled back", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-dirty-"));
  const store = path.join(base, "agent");
  seedStore(store);
  // An orphan: present on disk, referenced by no index line. The plan's own ops are sound.
  fs.writeFileSync(path.join(store, "orphan.md"), "---\nname: orphan-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nBody.\n");
  const before = snapshot(store);
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "delete", evidence: "TRACKER reversed it" }],
  });
  const r = spawnSync(process.execPath, [CHECK, "--plan", plan, "--apply", "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "the plan must leave the store fully clean — fail-closed otherwise");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.applied, false);
  assert.strictEqual(out.rolledBack, undefined, "refused pre-mutation — nothing to roll back");
  assert.ok(
    (out.prospectiveFindings || []).some((f) => f.kind === "orphan-memory-file"),
    `the projection names the pre-existing finding: ${JSON.stringify(out.prospectiveFindings)}`,
  );
  assertUnchanged(store, before, "already-dirty store refused pre-mutation");
});

ok("r12 MEDIUM: the DRY-RUN clears the same gates as --apply (no gate/apply divergence)", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "memapply-r12-dry-"));
  const store = path.join(base, "agent");
  seedStore(store);
  const before = snapshot(store);
  const collide = "---\nname: keep-one\ndescription: a memory\nmetadata:\n  type: feedback\n---\n\nCOLLIDES.\n";
  const plan = writePlan(base, {
    store,
    changes: [{ file: "drop_one.md", classification: "contradicted", action: "correct", evidence: "merged", newBody: collide }],
  });
  const r = spawnSync(process.execPath, [CHECK, "--plan", plan, "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 2, "a dry-run must not promise a correct that --apply would refuse");
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.dryRun, true, "it is still reported as a dry-run");
  assert.ok(
    (out.prospectiveFindings || []).some((f) => f.kind === "duplicate-name-slug"),
    `the dry-run sees the store-wide consequence too: ${JSON.stringify(out.prospectiveFindings)}`,
  );
  assertUnchanged(store, before, "dry-run never mutates");
});

console.log(`\nmemory-apply: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
