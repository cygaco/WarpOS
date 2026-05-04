// One-off: survey learnings.jsonl for /learn:integrate candidates.
const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "..",
  "..",
  ".claude",
  "project",
  "memory",
  "learnings.jsonl",
);
const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
const cands = [];
lines.forEach((l, i) => {
  try {
    const e = JSON.parse(l);
    const score = e.score || 0;
    const status = e.status || "logged";
    const impl = !!e.implemented_by;
    if (
      score >= 0.7 &&
      status !== "implemented" &&
      status !== "logged" &&
      !impl
    ) {
      cands.push({
        line: i + 1,
        intent: e.intent,
        score,
        status,
        source: e.source || "",
        tip: (e.tip || "").slice(0, 120),
      });
    }
  } catch {
    /* skip malformed */
  }
});
console.log("Total lines:", lines.length);
console.log(
  "Candidates (score>=0.7, validated, no implemented_by):",
  cands.length,
);
console.log("");
for (const c of cands.slice(0, 50)) {
  console.log(`#${c.line} [${c.intent}|s=${c.score}|${c.status}|${c.source}]`);
  console.log(`  ${c.tip}`);
}
