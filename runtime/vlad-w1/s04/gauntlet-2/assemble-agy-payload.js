#!/usr/bin/env node
// Assemble the gauntlet-2 cross-family (agy) payload with a MANIFEST GENERATED FROM WHAT WAS
// ACTUALLY INCLUDED — not hand-written alongside it.
//
// WHY THIS EXISTS (ED-362). In gauntlet-1 the conductor hand-picked an excerpt window of
// src/spawn-shim.js (lines 280-340) and the lane reasoned correctly to a FALSE finding because the
// refuting gate sat at line 238, outside the window. The lane honestly listed "the rest of the file"
// as unseen; nobody reconciled it. A hand-written manifest would have had the same defect as the
// hand-written window, because the same person writes both from the same belief. So the manifest
// here is DERIVED: every range is recorded as the assembler emits it, and the "not included" note is
// computed from the file's real line count.
//
// FAIL-CLOSED: over the argv ceiling -> exit 1 with the overage, never a silently truncated payload
// (a truncated payload is the excerpt-window bug with no manifest at all). A named source file that
// is missing -> exit 1, never an empty section that reads as "nothing to see".

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const WT = "C:\\Users\\Vlad\\Desktop\\Claude\\Projects\\vlad\\.worktrees\\engine-lane";
const HERE = __dirname;

// Measured ceiling: an assembled payload of 32512 bytes hit the permission wall; 32000 is the
// documented assembled ceiling. Held 500 below it as margin for the wrapper's own framing.
const CEILING = 31500;

/** @type {{file:string, mode:"diff"|"lines", ranges?:[number,number][], why:string}[]} */
const SPEC = [
  {
    file: "engine/CUSTODY.md",
    mode: "diff",
    why: "THE SHIPPED CLAIM SURFACE. S4-1 is the decisive criterion and it is decided by reading these sentences. You get 100% of what the fix attempt CHANGED here, and none of what it did not.",
  },
  {
    file: "engine/src/spawn-shim.js",
    mode: "lines",
    ranges: [[228, 252], [300, 330]],
    why: "THE REGION THAT PRODUCED A FALSE FINDING LAST TIME. the first range holds the Array.isArray gate at line 238 — the refuting code that sat outside the gauntlet-1 window; the second holds the prototype check downstream of it. You are being given the gate this time, deliberately.",
  },
  {
    file: "engine/scripts/checks/custody-claim-lint.js",
    mode: "lines",
    ranges: [[100, 140], [185, 215]],
    why: "THE TRANSFORM, in code and in its own comment block. Bundle K rewrote CUSTODY.md's DESCRIPTION of this. Compare the description you read in the CUSTODY.md diff against this — if they disagree, that is an S4-1 finding and it is yours to file.",
  },
];

function run(args) {
  return execFileSync("git", ["-C", WT, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function main() {
  const base = process.argv[2];
  const headSha = process.argv[3];
  if (!base || !headSha) {
    console.error("usage: node assemble-agy-payload.js <base-sha> <head-sha>");
    process.exit(1);
  }

  const head = fs.readFileSync(path.join(HERE, "_agy-head.md"), "utf8");
  const manifestRows = [];
  const bodies = [];

  for (const item of SPEC) {
    const abs = path.join(WT, item.file);
    if (!fs.existsSync(abs)) {
      console.error(`FATAL: ${item.file} does not exist at ${WT} — refusing to emit a payload with a silently empty section.`);
      process.exit(1);
    }
    const totalLines = fs.readFileSync(abs, "utf8").split("\n").length;

    if (item.mode === "diff") {
      const body = run(["diff", "-U2", `${base}..${headSha}`, "--", item.file]);
      if (!body.trim()) {
        console.error(`FATAL: empty diff for ${item.file} between ${base}..${headSha}.`);
        process.exit(1);
      }
      const changed = (body.match(/^[+-][^+-]/gm) || []).length;
      bodies.push(`\n### ${item.file} — UNIFIED DIFF ${base}..${headSha} (complete for this file)\n\n\`\`\`diff\n${body}\`\`\`\n`);
      manifestRows.push(
        `- **${item.file}** — the COMPLETE diff for this file (${changed} changed lines). ` +
          `The file is ${totalLines} lines total; **every unchanged line is NOT included.** ${item.why}`
      );
    } else {
      const lines = fs.readFileSync(abs, "utf8").split("\n");
      const shown = [];
      const parts = [];
      for (const [a, b] of item.ranges) {
        const end = Math.min(b, lines.length);
        parts.push(
          `\n### ${item.file} — LINES ${a}-${end} (verbatim)\n\n\`\`\`js\n` +
            lines.slice(a - 1, end).map((l, i) => `${a + i}| ${l}`).join("\n") +
            "\n```\n"
        );
        shown.push(`${a}-${end}`);
      }
      bodies.push(parts.join(""));
      const covered = item.ranges.reduce((n, [a, b]) => n + (Math.min(b, lines.length) - a + 1), 0);
      manifestRows.push(
        `- **${item.file}** — lines ${shown.join(", ")} ONLY (${covered} of ${totalLines} lines, ` +
          `${Math.round((covered / totalLines) * 100)}%). **The other ${totalLines - covered} lines are NOT included.** ${item.why}`
      );
    }
  }

  const manifest =
    manifestRows.join("\n") +
    "\n\n**Nothing else was included.** No other file of this package is in this payload at all — not " +
    "`src/env-scrub.js`, not `driver/host-free-driver.js`, not `scripts/checks/spawn-env-allowlist.js`, " +
    "not `package.json`, and no test file. If a judgement needs one of them, that is a `files_i_could_not_see` " +
    "entry, and it will be reconciled rather than discarded.";

  const payload =
    head.replace("<<<MANIFEST>>>", manifest).replace(/<<<COMMIT_SHA>>>/g, headSha) +
    "\n\n---\n\n# THE CODE YOU WERE GIVEN\n" +
    bodies.join("\n");

  const bytes = Buffer.byteLength(payload, "utf8");
  const out = path.join(HERE, "lane-security-agy.md");

  if (bytes > CEILING) {
    console.error(`FATAL: payload is ${bytes} bytes, over the ${CEILING} ceiling by ${bytes - CEILING}.`);
    console.error("Trim a RANGE in SPEC and re-run. Do NOT truncate the payload — a truncated payload is the");
    console.error("excerpt-window defect with no manifest describing it.");
    process.exit(1);
  }

  fs.writeFileSync(out, payload, "utf8");
  console.log(`OK — ${bytes} bytes (ceiling ${CEILING}, headroom ${CEILING - bytes})`);
  console.log(`wrote ${out}`);
  console.log("\nMANIFEST AS EMITTED:\n" + manifest);
}

main();
