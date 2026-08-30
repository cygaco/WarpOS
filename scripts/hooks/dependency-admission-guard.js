#!/usr/bin/env node
/**
 * Blocks package.json dependency additions without an admission record.
 */

const path = require("path");
const { checkPackageEdit } = require("../deps/admission");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (!["Edit", "Write"].includes(event.tool_name)) process.exit(0);
    const filePath = String(event.tool_input?.file_path || "").replace(/\\/g, "/");
    if (!filePath.endsWith("/package.json") && path.basename(filePath) !== "package.json") process.exit(0);
    const oldText = event.tool_input?.old_string || "";
    const newText = event.tool_input?.new_string || event.tool_input?.content || "";
    if (!newText.trim()) process.exit(0);
    const result = checkPackageEdit(oldText, newText);
    if (!result.ok) {
      console.log(
        JSON.stringify({
          decision: "block",
          reason:
            "dependency-admission-guard: new dependencies require .claude/project/decisions/dependency-admissions.jsonl records: " +
            result.missing.map((d) => `${d.name}@${d.version}`).join(", "),
        }),
      );
      process.exit(2);
    }
  } catch (e) {
    // ED-379-class: this gate blocks package.json dependency additions
    // without an admission record — restrictive = block (exit 2). A payload-
    // parse or checkPackageEdit() failure is "could not evaluate this edit",
    // never "nothing to admit" (that path already exits 0 explicitly above,
    // outside this catch). Fail closed rather than silently admitting an
    // unreviewed dependency.
    console.log(
      JSON.stringify({
        decision: "block",
        reason:
          "dependency-admission-guard: could not evaluate this edit (" +
          (e && e.message ? e.message : "unknown error") +
          ") — failing closed.",
      }),
    );
    process.exit(2);
  }
  process.exit(0);
});
