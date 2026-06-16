#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// aggregator-epics.test.js — SP-20260615-002 S-1 / AC-R1a.
//
// ::epics-parsed-state-percent-childsprints-one-bad-file-degrades-only-itself
//   The data aggregator (scripts/panel/roadmap.js#generate) emits summary.epics —
//   an array of { id, title, state, percent, childSprints[] } parsed from
//   trackers/epics/*.md. Asserts:
//     - state ← the `**Current state:**` line, percent ← leading number on
//       `**Percent completion:**` (null if unparseable, NEVER a throw),
//       childSprints ← the `## Related sprints` bolded-id list.
//     - PER-EPIC fail-soft (β-4): ONE malformed/renamed epic file degrades ONLY
//       that epic (kept as {id, parseError}); the healthy epics still parse, and
//       "epics" is NOT added to sectionsUnavailable[] (one bad file ≠ blank area).
//     - WHOLE-AREA degrade: only an unreadable/absent trackers/epics/ dir adds
//       "epics" to sectionsUnavailable[]; a present-but-empty dir is a valid
//       empty state (epics: [], no error).
//
//   SANDBOX-SAFE: drives generate({root}) IN-PROCESS over injectable --root temp
//   fixtures — no nested `node` spawn, the REAL repo files are never touched.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap.js");
const roadmap = require(SCRIPT);

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

// Build a fresh fixture root containing only trackers/epics/<files>.
function makeEpicsRoot(filesByName) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-epics-"));
  const epicsDir = path.join(dir, "trackers", "epics");
  fs.mkdirSync(epicsDir, { recursive: true });
  for (const [name, body] of Object.entries(filesByName || {})) {
    fs.writeFileSync(path.join(epicsDir, name), body);
  }
  return dir;
}

function epicFile(opts) {
  const o = opts || {};
  const lines = [];
  lines.push(`# ${o.id || "E-X-001"} — ${o.title || "Some Title"}`);
  lines.push("");
  lines.push(`- **Epic label and number:** ${o.id || "E-X-001"}`);
  lines.push(`- **Title:** ${o.title || "Some Title"}`);
  lines.push(`- **Current state:** ${o.state || "Active"}`);
  lines.push(`- **Percent completion:** ${o.percent != null ? o.percent : "~42% — partway"}`);
  lines.push("");
  lines.push("## Related sprints");
  for (const s of o.childSprints || []) {
    lines.push(`- **${s}** — some description — Done`);
  }
  if (!o.childSprints || o.childSprints.length === 0) {
    lines.push("- None currently recorded.");
  }
  lines.push("");
  return lines.join("\n");
}

function byId(epics, id) {
  return epics.find((e) => e.id === id);
}

function main() {
  // ── 1. fully-populated epics parse all five fields correctly ────────────────
  ok("epics parse: id/title/state/percent/childSprints from a well-formed file", () => {
    const dir = makeEpicsRoot({
      "E-ALPHA-001-alpha.md": epicFile({
        id: "E-ALPHA-001",
        title: "Alpha Epic",
        state: "Active",
        percent: "~88% — almost there",
        childSprints: ["S-A-01", "S-A-02", "S-A-03"],
      }),
    });
    const { summary } = roadmap.generate({ root: dir });
    assert.ok(Array.isArray(summary.epics), "epics must be an array");
    const e = byId(summary.epics, "E-ALPHA-001");
    assert.ok(e, "E-ALPHA-001 must be present");
    assert.strictEqual(e.title, "Alpha Epic", "title parsed from **Title:**");
    assert.strictEqual(e.state, "Active", "state parsed from **Current state:**");
    assert.strictEqual(e.percent, 88, "percent = leading number on **Percent completion:**");
    assert.deepStrictEqual(
      e.childSprints,
      ["S-A-01", "S-A-02", "S-A-03"],
      "childSprints parsed from ## Related sprints bolded ids",
    );
  });

  // ── 2. percent edge cases: 0 / 100 / unparseable → null, NEVER throws ───────
  ok("percent: '0%' → 0, '100%' → 100, no-number → null (never throws)", () => {
    const dir = makeEpicsRoot({
      "E-ZERO-001-z.md": epicFile({ id: "E-ZERO-001", percent: "0% — not started" }),
      "E-HUND-001-h.md": epicFile({ id: "E-HUND-001", percent: "100% — landed" }),
      "E-NONUM-001-n.md": epicFile({ id: "E-NONUM-001", percent: "TBD — no number here" }),
    });
    const { summary } = roadmap.generate({ root: dir });
    assert.strictEqual(byId(summary.epics, "E-ZERO-001").percent, 0, "'0%' → 0");
    assert.strictEqual(byId(summary.epics, "E-HUND-001").percent, 100, "'100%' → 100");
    assert.strictEqual(byId(summary.epics, "E-NONUM-001").percent, null, "no number → null");
  });

  // ── 3. PER-EPIC degrade: one bad file → {parseError}, others fine, NOT in S.U.
  ok("one malformed epic (no Current state) degrades ONLY itself; healthy epics intact; 'epics' NOT in sectionsUnavailable", () => {
    const goodA = epicFile({ id: "E-GOODA-001", state: "Active", percent: "50%", childSprints: ["S-1"] });
    const goodB = epicFile({ id: "E-GOODB-001", state: "Planned", percent: "0%", childSprints: ["S-2"] });
    // Bad: strip the **Current state:** line (the load-bearing field).
    const bad = goodA
      .replace(/^- \*\*Current state:\*\*.*$/m, "- (state heading renamed away)")
      .replace(/E-GOODA-001/g, "E-BADX-001");
    const dir = makeEpicsRoot({
      "E-GOODA-001-a.md": goodA,
      "E-GOODB-001-b.md": goodB,
      "E-BADX-001-bad.md": bad,
    });
    const { summary } = roadmap.generate({ root: dir });

    // Healthy epics still parse fully.
    const a = byId(summary.epics, "E-GOODA-001");
    const b = byId(summary.epics, "E-GOODB-001");
    assert.ok(a && a.state === "Active" && a.percent === 50, "healthy epic A intact");
    assert.ok(b && b.state === "Planned" && b.percent === 0, "healthy epic B intact");

    // The bad epic is KEPT as a {id, parseError} marker — dropped-or-marked, never
    // silently vanished, and never blanks the area.
    const bad1 = byId(summary.epics, "E-BADX-001");
    assert.ok(bad1, "the bad epic must still appear (kept, by filename-derived id)");
    assert.ok(bad1.parseError, "the bad epic must carry a parseError marker");

    // ONE bad file must NOT add "epics" to sectionsUnavailable — only a whole-dir
    // failure does (asserted in case 5).
    assert.ok(
      !summary.sectionsUnavailable.includes("epics"),
      "one bad file must NOT add 'epics' to sectionsUnavailable",
    );
    assert.strictEqual(summary.epicsAvailable, true, "epicsAvailable stays true on a single bad file");
  });

  // ── 4. present-but-empty trackers/epics/ → epics: [], NO error (valid state) ─
  ok("present-but-empty trackers/epics/ → epics:[] and NOT in sectionsUnavailable", () => {
    const dir = makeEpicsRoot({}); // dir exists, no files
    const { summary } = roadmap.generate({ root: dir });
    assert.deepStrictEqual(summary.epics, [], "empty dir → empty epics array");
    assert.ok(!summary.sectionsUnavailable.includes("epics"), "empty dir is a valid state, not unavailable");
  });

  // ── 5. WHOLE-AREA degrade: absent trackers/epics/ dir → 'epics' in S.U. ──────
  ok("absent trackers/epics/ directory → 'epics' IS added to sectionsUnavailable", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agg-noepics-"));
    const { summary } = roadmap.generate({ root: dir });
    assert.deepStrictEqual(summary.epics, [], "absent dir → empty epics array in summary");
    assert.ok(summary.sectionsUnavailable.includes("epics"), "absent dir → 'epics' in sectionsUnavailable");
    assert.strictEqual(summary.epicsAvailable, false, "epicsAvailable false when the whole area is absent");
    // Direct parse probe: error is set on the whole area.
    const parsed = roadmap.parseEpics(dir);
    assert.ok(parsed.error && /not found/i.test(parsed.error), "parseEpics reports a whole-area 'not found'");
  });

  // ── 6. childSprints empty when 'None currently recorded.' ───────────────────
  ok("childSprints is [] when ## Related sprints says 'None currently recorded.'", () => {
    const dir = makeEpicsRoot({
      "E-NOCH-001-n.md": epicFile({ id: "E-NOCH-001", childSprints: [] }),
    });
    const { summary } = roadmap.generate({ root: dir });
    assert.deepStrictEqual(byId(summary.epics, "E-NOCH-001").childSprints, [], "no child sprints → []");
  });

  // ── 7. a NUL-corrupt epic file degrades only itself ─────────────────────────
  ok("a NUL-corrupt epic file → {parseError} for that epic only, others healthy", () => {
    const dir = makeEpicsRoot({
      "E-OK-001-ok.md": epicFile({ id: "E-OK-001", state: "Active", percent: "10%" }),
    });
    // Plant a binary-corrupt epic file alongside.
    fs.writeFileSync(
      path.join(dir, "trackers", "epics", "E-BIN-001-bin.md"),
      Buffer.from([0x23, 0x20, 0x45, 0x00, 0x00, 0xff, 0xfe, 0x0a]),
    );
    const { summary } = roadmap.generate({ root: dir });
    assert.ok(byId(summary.epics, "E-OK-001"), "healthy epic still parsed");
    const bin = byId(summary.epics, "E-BIN-001");
    assert.ok(bin && bin.parseError, "corrupt epic marked with parseError");
    assert.ok(!summary.sectionsUnavailable.includes("epics"), "one corrupt file ≠ whole-area unavailable");
  });

  console.log(`\naggregator-epics: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main();
