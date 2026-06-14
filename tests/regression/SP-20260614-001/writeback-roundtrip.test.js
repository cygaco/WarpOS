#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// writeback-roundtrip.test.js — SP-20260614-001 / S-3 (LOAD-BEARING write-back).
//
// Exercises the ACTUAL source of src/lib/readiness/writeback.ts.tmpl — the test
// reads the real template bytes, strips TS-only syntax to plain JS, and loads it
// as a module. So a render-from-model / append / silent-noop implementation in
// the source genuinely FAILS these cases (the AC requirement).
//
//   AC-A6  roundtrip-preserves-annotations-and-flips-one-bit
//   AC-A6b patch-on-current-survives-interleaved-edit
//   AC-A6c unknown-id-no-write
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const TMPL = path.join(
  ROOT,
  "framework",
  "templates",
  "app-scaffold",
  "src",
  "lib",
  "readiness",
  "writeback.ts.tmpl",
);
const PRODUCER = path.join(ROOT, "scripts", "scaffold", "founders-checklist.js");
const { parseFoundersChecklist } = require(PRODUCER);

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

// ── Load the REAL writeback source as a module ──────────────────────────────
// Strip TS-only syntax (type aliases, param/return annotations, the `import`
// form) so node can evaluate the actual runtime logic of the template.
function loadWriteback() {
  let src = fs.readFileSync(TMPL, "utf8");

  // Drop the multi-line `export type PatchResult = ... ;` declaration.
  src = src.replace(/export type PatchResult[\s\S]*?;\n/, "");

  // Rewrite the node:crypto / node:fs imports to CommonJS requires.
  src = src.replace(
    /import \{ randomBytes \} from "node:crypto";/,
    'const { randomBytes } = require("node:crypto");',
  );
  src = src.replace(
    /import \{ readFileSync, renameSync, unlinkSync, writeFileSync \} from "node:fs";/,
    'const { readFileSync, renameSync, unlinkSync, writeFileSync } = require("node:fs");',
  );

  // Strip the `: PatchResult` return annotation on the helper + exported fn.
  src = src.replace(/\): PatchResult \{/g, ") {");
  src = src.replace(/function lineMatchesId\(line: string, id: string\): boolean/, "function lineMatchesId(line, id)");

  // Strip param type annotations on patchChecklistItem.
  src = src.replace(/checklistPath: string,/, "checklistPath,");
  src = src.replace(/  id: string,/, "  id,");
  src = src.replace(/  nextChecked: boolean,/, "  nextChecked,");

  // Strip simple local variable annotations (e.g. `let raw: string;`).
  src = src.replace(/\blet raw: string;/, "let raw;");

  // Strip `(e as Error)` casts and `export` keyword for CJS eval.
  src = src.replace(/\(e as Error\)/g, "e");
  src = src.replace(/export function patchChecklistItem/, "function patchChecklistItem");
  src += "\nmodule.exports = { patchChecklistItem };\n";

  const m = new Module(TMPL, module);
  m.filename = TMPL.replace(/\.tmpl$/, ".js");
  m.paths = Module._nodeModulePaths(path.dirname(TMPL));
  m._compile(src, m.filename);
  return m.exports;
}

const { patchChecklistItem } = loadWriteback();

// ── Fixture: a realistic FOUNDERS_CHECKLIST.md with the things parse() drops ──
const FIXTURE = [
  "<!-- warpos:founders-checklist v1 -->",
  "schema: warpos/founders-checklist/v1",
  "declared_stack_source: _requirements/00-canonical/DATA_AND_ACCOUNTS.md",
  "declared_stack: auth=clerk, payments=stripe, hosting=vercel",
  "",
  "## Human-only launch gates",
  "",
  "<!-- NOTE: payouts owner is Jordan; legal entity filed 2026-05-01 — do not toggle until bank verified -->",
  "- [ ] id=provider.accounts dim=product source=core Create production developer and provider accounts for the declared stack",
  "- [x] id=domain.dns dim=deployment source=core Confirm domain ownership and DNS access",
  "- [ ] id=legal.entity dim=monetization source=core Confirm legal entity, tax profile, and payout owner",
  "- [ ] id=legal.privacy_terms dim=privacy source=core Publish privacy policy and terms",
  "",
  "## Stack-conditional launch gates",
  "",
  "- [ ] id=auth.clerk.production dim=security source=declared-stack:auth=clerk Create Clerk production instance and allowed domains",
  "- [x] id=payments.stripe.identity dim=monetization source=declared-stack:payments=stripe Verify Stripe identity and live-mode payouts",
  "<!-- /warpos:founders-checklist -->",
  "",
].join("\n");

function writeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wb-rt-"));
  const file = path.join(dir, "FOUNDERS_CHECKLIST.md");
  fs.writeFileSync(file, FIXTURE, "utf8");
  return { dir, file };
}

function listTmp(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".tmp"));
}

// ── AC-A6 ────────────────────────────────────────────────────────────────────
ok("roundtrip-preserves-annotations-and-flips-one-bit", () => {
  const { dir, file } = writeFixture();
  const before = parseFoundersChecklist(fs.readFileSync(file, "utf8"));
  const beforeLines = FIXTURE.split("\n");

  // Toggle exactly one currently-open item.
  const targetId = "provider.accounts";
  const res = patchChecklistItem(file, targetId, true);
  assert.strictEqual(res.ok, true, "patch should succeed");
  assert.strictEqual(res.changed, true, "the target bit should flip");

  const afterRaw = fs.readFileSync(file, "utf8");
  const after = parseFoundersChecklist(afterRaw);
  const afterLines = afterRaw.split("\n");

  // Same items, same order.
  assert.strictEqual(after.items.length, before.items.length, "item count preserved");
  for (let i = 0; i < before.items.length; i += 1) {
    assert.strictEqual(after.items[i].id, before.items[i].id, `item order preserved at ${i}`);
  }

  // EXACTLY ONE flipped checked bit, ZERO other item diffs.
  let flips = 0;
  for (let i = 0; i < before.items.length; i += 1) {
    if (before.items[i].checked !== after.items[i].checked) {
      flips += 1;
      assert.strictEqual(before.items[i].id, targetId, "only the target item flipped");
      assert.strictEqual(after.items[i].checked, true, "target now checked");
    }
  }
  assert.strictEqual(flips, 1, "exactly one bit flipped");

  // Raw line-diff: ONLY one line changed.
  assert.strictEqual(afterLines.length, beforeLines.length, "no lines added/removed");
  const changedLineIdxs = [];
  for (let i = 0; i < beforeLines.length; i += 1) {
    if (beforeLines[i] !== afterLines[i]) changedLineIdxs.push(i);
  }
  assert.strictEqual(changedLineIdxs.length, 1, "exactly one raw line changed");

  // Note, header, metadata, BOTH markers survive byte-for-byte.
  assert.ok(afterRaw.includes("<!-- warpos:founders-checklist v1 -->"), "open marker survives");
  assert.ok(afterRaw.includes("<!-- /warpos:founders-checklist -->"), "close marker survives");
  assert.ok(afterRaw.includes("## Human-only launch gates"), "section header survives");
  assert.ok(
    afterRaw.includes("<!-- NOTE: payouts owner is Jordan; legal entity filed 2026-05-01"),
    "human note survives byte-for-byte",
  );
  assert.ok(afterRaw.includes("schema: warpos/founders-checklist/v1"), "schema metadata survives");
  assert.ok(
    afterRaw.includes("declared_stack: auth=clerk, payments=stripe, hosting=vercel"),
    "declared_stack metadata survives",
  );

  fs.rmSync(dir, { recursive: true, force: true });
});

// ── AC-A6b ─────────────────────────────────────────────────────────────────
ok("patch-on-current-survives-interleaved-edit", () => {
  const { dir, file } = writeFixture();

  // A human edits a DIFFERENT line on disk AFTER render but BEFORE the toggle
  // submit lands. (Simulated by mutating the file in place.)
  const edited = FIXTURE.replace(
    "## Human-only launch gates",
    "## Human-only launch gates (reviewed by Jordan 2026-06-14)",
  );
  fs.writeFileSync(file, edited, "utf8");

  // Now the toggle runs — it must re-read current disk state, not a stale copy.
  const res = patchChecklistItem(file, "legal.entity", true);
  assert.strictEqual(res.ok, true, "patch succeeds on current state");

  const afterRaw = fs.readFileSync(file, "utf8");

  // Human's interleaved edit survives.
  assert.ok(
    afterRaw.includes("## Human-only launch gates (reviewed by Jordan 2026-06-14)"),
    "human's interleaved header edit survives the patch",
  );

  // Toggle landed on the right id.
  const after = parseFoundersChecklist(afterRaw);
  const target = after.items.find((it) => it.id === "legal.entity");
  assert.ok(target, "target item present");
  assert.strictEqual(target.checked, true, "toggle landed on legal.entity");

  // No collateral: provider.accounts stays open, domain.dns stays done.
  assert.strictEqual(after.items.find((it) => it.id === "provider.accounts").checked, false);
  assert.strictEqual(after.items.find((it) => it.id === "domain.dns").checked, true);

  fs.rmSync(dir, { recursive: true, force: true });
});

// ── AC-A6c ─────────────────────────────────────────────────────────────────
ok("unknown-id-no-write", () => {
  const { dir, file } = writeFixture();
  const beforeRaw = fs.readFileSync(file, "utf8");

  const res = patchChecklistItem(file, "does.not.exist", true);

  // Error surfaced, no write.
  assert.strictEqual(res.ok, false, "unknown id returns error");
  assert.ok(/not found/i.test(res.error), "error explains the missing id");

  // Original byte-identical.
  const afterRaw = fs.readFileSync(file, "utf8");
  assert.strictEqual(afterRaw, beforeRaw, "original untouched byte-for-byte");

  // No tmp file left behind.
  assert.deepStrictEqual(listTmp(dir), [], "no stray .tmp file");

  fs.rmSync(dir, { recursive: true, force: true });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
