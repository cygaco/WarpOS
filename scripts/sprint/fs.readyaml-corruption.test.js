#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/fs.readyaml-corruption.test.js
 *
 * SP-20260829-001 bundle B4, Task 2 — teeth for the fs.js#readYamlMaybe /
 * parseMiniYaml repair.
 *
 * THE VERIFIED, LIVE ENVIRONMENT FACT THIS TEST DEPENDS ON: this repo has no
 * root package.json / node_modules (confirmed via `require.resolve("js-yaml")`
 * throwing MODULE_NOT_FOUND at the time this test was written — same
 * structural fact ED-380 records for ajv). That means, in THIS repo, every
 * readYamlMaybe() call on a real (non-JSON) tracker file legitimately misses
 * both js-yaml and JSON.parse and lands in parseMiniYaml — which is exactly
 * where the reachable fail-open lived: an unrecognized line was silently
 * dropped with zero signal, so a corrupt/garbled file was indistinguishable
 * from a well-formed one.
 *
 * This suite exercises that reachable path with a real fault injection
 * (a line neither parser format recognizes) and a no-op guard (the same
 * fixture with the fault removed must NOT warn), run with `node --test`.
 *
 * The require("js-yaml") MODULE_NOT_FOUND vs "js-yaml loaded but yaml.load()
 * threw on content" distinction is implemented in the repair but is NOT
 * exercised here — it is currently unreachable in this repo (js-yaml is
 * never resolvable), so there is no way to fabricate that branch without
 * installing js-yaml, which is out of scope (no supply-chain additions).
 * That gap is named explicitly rather than silently skipped.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { readYamlMaybe, writeText } = require("./fs");

function withCapturedStderr(fn) {
  const real = process.stderr.write;
  let captured = "";
  process.stderr.write = (chunk, ...rest) => {
    captured += chunk;
    return true;
  };
  try {
    fn();
  } finally {
    process.stderr.write = real;
  }
  return captured;
}

test("environment precondition: js-yaml is NOT resolvable in this repo", () => {
  // This is not an assertion about the fix — it's a documented, checked
  // precondition. If this ever flips to resolvable, the corruption-signal
  // path below moves from "the only reachable one" to "one of two
  // reachable ones" and this file's header comment needs revisiting.
  let resolved = false;
  try {
    require.resolve("js-yaml");
    resolved = true;
  } catch {
    resolved = false;
  }
  assert.equal(
    resolved,
    false,
    "js-yaml became resolvable — the require()-throw content-fact branch in " +
      "readYamlMaybe is no longer dead code; add a direct test for it.",
  );
});

test("readYamlMaybe surfaces a genuinely unparseable line instead of silently dropping it", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "readyaml-corrupt-"));
  const file = path.join(tmp, "current.yaml");
  try {
    // "!!!not a key or an array item!!!" matches neither the array pattern
    // (must start with "-") nor the key:value pattern (must start with a
    // letter/underscore) — this is the injected fault.
    const corrupt = [
      "sprint_id: SP-TEST",
      "!!!not a key or an array item!!!",
      "title: hello",
      "",
    ].join("\n");
    writeText(file, corrupt, { force: true });

    const stderrOut = withCapturedStderr(() => {
      const parsed = readYamlMaybe(file);
      // The fault is recorded, not silently discarded.
      const dropped = Object.getOwnPropertyDescriptor(
        parsed,
        "__parseDroppedLines",
      );
      assert.ok(
        dropped,
        "FAULT NOT DETECTED: __parseDroppedLines missing — the corrupt line " +
          "was silently dropped again (this is the pre-fix behavior).",
      );
      assert.equal(dropped.enumerable, false, "diagnostic marker must not leak into serialization");
      assert.equal(dropped.value.length, 1);
      assert.equal(dropped.value[0].line, 2);
      assert.match(dropped.value[0].text, /not a key or an array item/);
      // The rest of the file still parses around the dropped line.
      assert.equal(parsed.sprint_id, "SP-TEST");
      assert.equal(parsed.title, "hello");
    });
    assert.match(
      stderrOut,
      /CORRUPT/,
      "FAULT NOT DETECTED: no stderr warning was printed for the corrupt line.",
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("no-op guard: the SAME fixture with the fault removed produces no warning and no marker", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "readyaml-clean-"));
  const file = path.join(tmp, "current.yaml");
  try {
    const clean = ["sprint_id: SP-TEST", "title: hello", ""].join("\n");
    writeText(file, clean, { force: true });

    const stderrOut = withCapturedStderr(() => {
      const parsed = readYamlMaybe(file);
      const dropped = Object.getOwnPropertyDescriptor(
        parsed,
        "__parseDroppedLines",
      );
      assert.equal(
        dropped,
        undefined,
        "NO-OP GUARD FAILED: a clean, well-formed file was flagged as having " +
          "dropped lines — the detector is a rubber stamp, not a real check.",
      );
      assert.equal(parsed.sprint_id, "SP-TEST");
      assert.equal(parsed.title, "hello");
    });
    assert.equal(
      stderrOut,
      "",
      "NO-OP GUARD FAILED: a clean file produced a corruption warning on stderr.",
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("readYamlMaybe on a missing file still returns null (unchanged contract)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "readyaml-missing-"));
  try {
    const missing = path.join(tmp, "does-not-exist.yaml");
    assert.equal(readYamlMaybe(missing), null);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
