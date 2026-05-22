#!/usr/bin/env node
// Throwaway: presence-check candidate voc quotes against the cached corpus
// under _docs/clones/<slug>/_raw/. Reads a slug from argv[2].

"use strict";
const fs = require("fs");
const path = require("path");

const slug = process.argv[2] || "companycam";
const quotesJson = process.argv[3] || "scripts/product/_clone-quotes.json";

const dir = path.join("_docs", "clones", slug, "_raw");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
const corpus = files
  .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
  .join("\n\n");

const normalize = (s) => s.replace(/\s+/g, " ").trim();
const N = normalize(corpus);

const quotes = JSON.parse(fs.readFileSync(quotesJson, "utf8"));

let ok = 0;
const failed = [];
for (const q of quotes) {
  const nq = normalize(q);
  if (N.includes(nq)) ok++;
  else failed.push(q);
}
console.log(`OK: ${ok} / ${quotes.length}`);
if (failed.length) {
  console.log("FAILED:");
  for (const q of failed) console.log("  - " + JSON.stringify(q));
}
process.exit(failed.length ? 1 : 0);
