#!/usr/bin/env node
// Smoke-test for beta-gate release-context escalation. Verifies:
//   1. Solo mode → allow (no adhoc dir).
//   2. Adhoc + release question + NO recent Beta event → block with
//      release-specific reason.
//   3. Adhoc + release question + recent release-Beta event → allow.
//   4. Adhoc + ESCALATE: prefix → allow (existing escape hatch).
//   5. Adhoc + non-release question → existing block (unchanged).
// Source: /scan:patterns 2026-05-13 (15x/day bypass).

"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const REPO = path.resolve(__dirname, "..");
const hook = path.join(REPO, "scripts/hooks/beta-gate.js");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "beta-gate-"));
  // paths.json + hooks/lib
  fs.mkdirSync(path.join(tmp, ".claude"), { recursive: true });
  fs.copyFileSync(
    path.join(REPO, ".claude/paths.json"),
    path.join(tmp, ".claude/paths.json"),
  );
  copyDir(
    path.join(REPO, "scripts/hooks/lib"),
    path.join(tmp, "scripts/hooks/lib"),
  );
  // Fake session id + adhoc dir under a HOME inside tmp so the hook
  // detects adhoc-active state for the gated cases.
  fs.mkdirSync(path.join(tmp, "home/.claude/teams/adhoc"), { recursive: true });
  // beta-gate treats no-heartbeat as adhoc-active, so just creating the dir
  // is enough. No heartbeat.json → falls through to the no-heartbeat branch.
  fs.mkdirSync(path.join(tmp, ".claude/runtime"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, ".claude/runtime/.session-id"),
    "test-session-id",
    "utf8",
  );
  return tmp;
}

function setBetaEvent(tmp, options) {
  // options: { age: ms ago, question: str, topicTags: [], phase: 'release' }
  const eventsRel = ".claude/agents/00-alex/.system/beta/events.jsonl";
  const fp = path.join(tmp, eventsRel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const ts = new Date(Date.now() - (options.age || 0)).toISOString();
  const row = {
    id: `EVT-test-${Date.now()}`,
    ts,
    cat: "beta",
    actor: "beta",
    session: "test-session-id",
    data: {
      question: options.question || "",
      answer: options.answer || "",
      topic_tags: options.topicTags || [],
      phase: options.phase || "",
    },
  };
  fs.writeFileSync(fp, JSON.stringify(row) + "\n", "utf8");
}

function clearBetaEvents(tmp) {
  const fp = path.join(tmp, ".claude/agents/00-alex/.system/beta/events.jsonl");
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function run(tmp, question, { solo = false } = {}) {
  // For solo mode, point HOME at a dir WITHOUT teams/adhoc so the hook
  // returns isAdhocActive=false.
  const home = solo ? path.join(tmp, "home-solo") : path.join(tmp, "home");
  if (solo) fs.mkdirSync(home, { recursive: true });
  const payload = JSON.stringify({
    tool_input: { questions: [{ question }] },
  });
  const r = spawnSync(process.execPath, [hook], {
    input: payload,
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: tmp,
      HOME: home,
      USERPROFILE: home,
    },
  });
  let parsed = null;
  try {
    parsed = JSON.parse((r.stdout || "").trim());
  } catch {
    /* ignore */
  }
  return { stdout: r.stdout, stderr: r.stderr, parsed, code: r.status };
}

function classify(r) {
  if (r.parsed && r.parsed.decision === "block") {
    return { result: "block", detail: r.parsed.reason || "" };
  }
  if (r.code === 0 && !r.parsed) return { result: "allow", detail: "" };
  return { result: "unknown", detail: `code=${r.code} stderr=${r.stderr}` };
}

const tmp = setup();

const cases = [
  {
    name: "solo mode → release question allowed (no Beta to consult)",
    question: "Deploy production?",
    solo: true,
    expect: "allow",
  },
  {
    name: "adhoc + release question + NO recent Beta → BLOCK (release-specific)",
    question: "Approve the production deploy for RL-20991231-001?",
    setup: (tmp) => clearBetaEvents(tmp),
    expect: "block",
    expectReason: "Release-context question detected with no recent Beta",
  },
  {
    name: "adhoc + release question + recent release-Beta event → allow",
    question: "Approve the production deploy for RL-20991231-001?",
    setup: (tmp) =>
      setBetaEvent(tmp, {
        age: 5 * 60 * 1000,
        question: "Release pre-flight for SP-X / RL-20991231-001",
        topicTags: ["release", "deploy"],
        phase: "release",
      }),
    expect: "allow",
  },
  {
    name: "adhoc + release question + STALE Beta event (>30min) → BLOCK",
    question: "Roll back the deploy for RL-20991231-001?",
    setup: (tmp) =>
      setBetaEvent(tmp, {
        age: 45 * 60 * 1000, // 45 min ago — outside window
        question: "Release pre-flight",
        topicTags: ["release"],
        phase: "release",
      }),
    expect: "block",
  },
  {
    name: "adhoc + ESCALATE: prefix → allow (existing escape hatch)",
    question: "ESCALATE: production deploy approval needed",
    setup: (tmp) => clearBetaEvents(tmp),
    expect: "allow",
  },
  {
    name: "adhoc + non-release question → existing generic block (unchanged)",
    question: "Should I use option A or B for this query?",
    setup: (tmp) => clearBetaEvents(tmp),
    expect: "block",
    expectReason: "Consult Alex β before asking",
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  if (c.setup) c.setup(tmp);
  const r = run(tmp, c.question, { solo: !!c.solo });
  const cls = classify(r);
  let ok = cls.result === c.expect;
  if (ok && c.expectReason) {
    ok = cls.detail.includes(c.expectReason);
  }
  if (ok) {
    pass++;
    process.stdout.write(`  PASS  ${c.name}  → ${cls.result}\n`);
  } else {
    fail++;
    process.stdout.write(
      `  FAIL  ${c.name}\n        expected=${c.expect}${c.expectReason ? " ('" + c.expectReason + "')" : ""}\n        got=${cls.result} detail=${cls.detail.slice(0, 200)}\n`,
    );
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

process.stdout.write(`\n${pass}/${pass + fail} passed\n`);
process.exit(fail > 0 ? 1 : 0);
