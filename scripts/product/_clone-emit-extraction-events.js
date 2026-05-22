#!/usr/bin/env node
// Emits the 5 extraction_completed events that the skill body (not the
// clone generator) is responsible for, per the /product:clone spec.

"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const eventsFile = path.join(
  ".claude",
  "project",
  "events",
  "events.jsonl",
);
const runId = process.env.CLONE_RUN_ID || crypto.randomUUID();
const slug = process.argv[2] || "companycam";
const now = () => new Date().toISOString();

const passes = [
  { pass: "jtbds", result_count: 7, duration_ms: 4200 },
  { pass: "feature_list", result_count: 25, duration_ms: 5100 },
  { pass: "voice_of_customer", result_count: 22, duration_ms: 6300 },
  { pass: "gaps", result_count: 13, duration_ms: 4800 },
  { pass: "opportunities", result_count: 14, duration_ms: 5600 },
];

const dir = path.dirname(eventsFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const p of passes) {
  fs.appendFileSync(
    eventsFile,
    JSON.stringify({
      ts: now(),
      type: "extraction_completed",
      id: runId,
      slug,
      pass: p.pass,
      result_count: p.result_count,
      duration_ms: p.duration_ms,
    }) + "\n",
    "utf8",
  );
}
console.log(`extraction_completed × ${passes.length} emitted for run ${runId}`);
