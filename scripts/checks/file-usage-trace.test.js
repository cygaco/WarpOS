#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for file-usage-trace.js — the pre-delete/rename safety tracer.
 *
 * Plants a sealed fixture tree: a target file + 3 consumers (one by full path,
 * one by bare basename, one inside framework/releases/** that MUST be counted-
 * not-listed) + one non-consumer. Asserts the tracer finds EXACTLY the 2 live
 * consumers, excludes the snapshot from the listing (counts it), never lists the
 * target itself, and correctly tags token vs literal references.
 *
 *   node scripts/checks/file-usage-trace.test.js
 */

const { harness, sealedDir } = require("./lib/fixture-harness");
const { trace } = require("./file-usage-trace");

const h = harness("file-usage-trace");

const TARGET = ".claude/project/reference/agent-dispatch-guide.md";

// A sealed corpus the tracer can scan without touching git. Each entry is the
// {file, body} shape trace() consumes.
function corpus() {
  return [
    // (1) live consumer — references by FULL relative path (a doc).
    {
      file: "_requirements/03-architecture/SPEC_GRAPH.md",
      body: `See [the guide](${TARGET}) for the dispatch contract.`,
    },
    // (2) live consumer — references by BARE BASENAME (a script).
    {
      file: "scripts/dispatch/dispatch-agent.js",
      body: `// loads agent-dispatch-guide.md at runtime\nconst g = "agent-dispatch-guide.md";`,
    },
    // (3) SNAPSHOT consumer — must be COUNTED, not listed.
    {
      file: "framework/releases/0.15.4/.claude/project/reference/agent-dispatch-guide.md",
      body: `frozen historical copy referencing ${TARGET}`,
    },
    // (4) NON-consumer — a confusable basename that must NOT match (substring/boundary).
    {
      file: "scripts/checks/unrelated.js",
      body: `// mentions my-agent-dispatch-guide.markdown and dispatch-guide.md but not the target\nconst x = "agent-dispatch-guideXmd";`,
    },
    // the target itself — must never be listed as its own consumer.
    { file: TARGET, body: "# Agent Dispatch Guide\nbody references agent-dispatch-guide.md self" },
  ];
}

function findConsumer(res, file) {
  return res.consumers.find((c) => c.file === file);
}

// ── known-answer: finds EXACTLY the 2 live consumers ────────
h.pass("finds exactly the 2 live consumers (path + basename), target/non-consumer excluded", () => {
  const res = trace({ target: TARGET, corpus: corpus() });
  return (
    res.totalConsumers === 2 &&
    !!findConsumer(res, "_requirements/03-architecture/SPEC_GRAPH.md") &&
    !!findConsumer(res, "scripts/dispatch/dispatch-agent.js") &&
    !findConsumer(res, "scripts/checks/unrelated.js") &&
    !findConsumer(res, TARGET)
  );
});

// ── known-answer: snapshot counted, not listed ──────────────
h.pass("framework/releases/** match is counted, never listed", () => {
  const res = trace({ target: TARGET, corpus: corpus() });
  return (
    res.snapshotCount === 1 &&
    !res.consumers.some((c) => c.file.startsWith("framework/releases/"))
  );
});

// ── known-answer: literal references are flagged as the rot risk ──
h.pass("both live consumers reference via hardcoded LITERAL (rot risk), tagged accordingly", () => {
  const res = trace({ target: TARGET, corpus: corpus() });
  const doc = findConsumer(res, "_requirements/03-architecture/SPEC_GRAPH.md");
  const script = findConsumer(res, "scripts/dispatch/dispatch-agent.js");
  return (
    res.literalConsumerCount === 2 &&
    doc && doc.reference === "literal" && doc.bucket === "docs" &&
    script && script.reference === "literal" && script.bucket === "scripts/hooks"
  );
});

// ── known-answer: a paths-token reference resolves & is tagged token ──
h.pass("a paths.* token referencing the target is detected and tagged 'token'", () => {
  const registry = { keysForPath: () => [{ key: "agentDispatchGuide" }] };
  const c = corpus().concat([
    { file: "scripts/hooks/lib/some-hook.js", body: 'const g = PATHS.agentDispatchGuide;' },
  ]);
  const res = trace({ target: TARGET, corpus: c, registry });
  const tok = findConsumer(res, "scripts/hooks/lib/some-hook.js");
  return res.resolvedKeys.includes("agentDispatchGuide") && tok && tok.reference === "token";
});

// ── known-answer: a planted path-literal consumer is NEVER missed ──
// The whole point of the tracer: a false "safe to delete" (a real consumer
// silently dropped) is the bug class it prevents. Assert a known consumer is
// always present.
h.pass("a planted path-literal consumer is NEVER missed (a false 'safe to delete' would be the bug)", () => {
  const c = [
    { file: "docs/USES_IT.md", body: `references ${TARGET} explicitly` },
    { file: TARGET, body: "# target" },
  ];
  const res = trace({ target: TARGET, corpus: c });
  return !!findConsumer(res, "docs/USES_IT.md") && res.totalConsumers >= 1;
});

// ── PLANTED VIOLATION: a confusable non-consumer must NOT be reported ──
// A naive substring scan would FALSE-POSITIVE on `my-agent-dispatch-guide.md`,
// `dispatch-guide.md`, or `agent-dispatch-guideXmd`, reporting a phantom
// consumer that blocks a legitimately-safe delete. The boundary check must
// reject all of them. We frame "the tracer reports the confusable file" as the
// violation: ok:true ONLY when the confusable is correctly NOT listed, so a
// regression to naive substring matching reads as a FALSE-GREEN here.
h.violation("a confusable non-consumer (substring/boundary trap) is NEVER reported as a consumer", () => {
  const c = [
    {
      file: "scripts/checks/confusable.js",
      body: 'mentions my-agent-dispatch-guide.markdown, dispatch-guide.md, and "agent-dispatch-guideXmd" — none are the target',
    },
    { file: TARGET, body: "# target" },
  ];
  const res = trace({ target: TARGET, corpus: c });
  const falsePositive = !!findConsumer(res, "scripts/checks/confusable.js");
  // ok:true ⇒ harness reads PASS ⇒ but violation() wants a FAIL, so we INVERT:
  // a correct tracer (no false positive) must make this return a FAIL-shaped result.
  return { ok: falsePositive, falsePositive, total: res.totalConsumers };
});

// ── FAIL-CLOSED: malformed input must not silently read green ────
h.failClosed("malformed corpus (null) fails closed rather than reporting 'no consumers'", () => {
  // A null corpus is malformed; trace must throw rather than return a clean
  // zero-consumer "safe to delete" result.
  return trace({ target: TARGET, corpus: null });
});

h.done();
