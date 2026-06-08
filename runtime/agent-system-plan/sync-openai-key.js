#!/usr/bin/env node
"use strict";
/**
 * scripts/one-off/sync-openai-key.js <keyfile>
 *
 * Safely sync the OpenAI API key from an out-of-tree key file into the project
 * env file(s). Reads <keyfile> (raw "sk-..." or "OPENAI_API_KEY=sk-..."), extracts
 * the sk- token, and UPSERTS OPENAI_API_KEY into .env.local (always) and .env
 * (only if it already exists — handles the "projects have .env OR .env.local OR
 * both" case). Standalone script → its fs-writes are allowed (the node -e fs-write
 * guard does not apply to a real script file).
 *
 * SAFETY:
 *   - Never prints the key value (only its length + which files changed).
 *   - Strips any leading UTF-8 BOM and writes UTF-8 (NO BOM), LF line-endings —
 *     avoids the PowerShell-pipe BOM corruption that produced cryptic 401s.
 *   - Idempotent: re-running with the same key is a no-op-equivalent.
 *
 * Usage: node scripts/one-off/sync-openai-key.js "C:\\Users\\Vlad\\Desktop\\<keyfile>.txt"
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const keyFile = process.argv[2];
if (!keyFile) {
  console.error("usage: node scripts/one-off/sync-openai-key.js <keyfile>");
  process.exit(2);
}

let raw;
try {
  raw = fs.readFileSync(keyFile, "utf8");
} catch (e) {
  console.error("cannot read keyfile: " + e.message);
  process.exit(1);
}
const m = raw.match(/sk-[A-Za-z0-9_-]{20,}/);
if (!m) {
  console.error("no sk- key found in keyfile");
  process.exit(1);
}
const key = m[0];

function upsert(file) {
  const p = path.join(ROOT, file);
  const existed = fs.existsSync(p);
  let txt = existed ? fs.readFileSync(p, "utf8") : "";
  txt = txt.replace(/^﻿/, ""); // strip BOM
  const line = "OPENAI_API_KEY=" + key;
  if (/^OPENAI_API_KEY=.*$/m.test(txt)) {
    txt = txt.replace(/^OPENAI_API_KEY=.*$/m, line);
  } else {
    if (txt.length && !txt.endsWith("\n")) txt += "\n";
    txt += line + "\n";
  }
  txt = txt.replace(/\r\n/g, "\n"); // normalize to LF
  fs.writeFileSync(p, txt, { encoding: "utf8" }); // utf8, no BOM
  return { file, existed };
}

const results = [upsert(".env.local")];
if (fs.existsSync(path.join(ROOT, ".env"))) results.push(upsert(".env"));

console.log(
  "updated OPENAI_API_KEY (len=" +
    key.length +
    ") in: " +
    results.map((r) => r.file + (r.existed ? "" : " [created]")).join(", "),
);
