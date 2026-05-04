// One-off: print full content of specific learning lines.
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
const wanted = [4, 8, 9, 28, 65].map((n) => n - 1); // 0-indexed
const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
for (const i of wanted) {
  console.log(`--- line ${i + 1} ---`);
  try {
    const e = JSON.parse(lines[i]);
    console.log(JSON.stringify(e, null, 2));
  } catch (err) {
    console.log("(parse error:", err.message + ")");
  }
}
