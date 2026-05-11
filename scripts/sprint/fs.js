#!/usr/bin/env node

/**
 * scripts/sprint/fs.js — File-system helpers for sprint scripts.
 *
 *   ensureDir(dir)               -> mkdir -p
 *   readText(file)               -> string or null
 *   writeText(file, text, opts)  -> { wrote: bool, reason }
 *   render(template, data)       -> string with {{key}} substituted
 *   readYamlMaybe(file)          -> parsed yaml/json or null
 *   writeYaml(file, value)       -> writes yaml-ish text (no js-yaml dep)
 *   nowIso()                     -> ISO-8601 UTC string
 *
 * The YAML writer is intentionally small. It handles strings, numbers,
 * booleans, nulls, arrays, and objects — enough for sprint tracker
 * files. Multi-line strings use the `|` block style only when the
 * value contains a newline. Reading falls back to JSON.parse if
 * js-yaml is unavailable AND the file happens to be JSON (the schemas
 * are valid JSON), otherwise tries a minimal yaml-subset parser via
 * eval-free split.
 */

"use strict";

const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function writeText(file, text, opts = {}) {
  const { force = false } = opts;
  if (!force && fs.existsSync(file)) {
    return { wrote: false, reason: "exists" };
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text, "utf8");
  return { wrote: true, reason: "ok" };
}

function render(template, data) {
  if (typeof template !== "string") return "";
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = data[key];
    if (v === undefined || v === null) return `{{${key}}}`;
    return String(v);
  });
}

function nowIso() {
  return new Date().toISOString();
}

// ── YAML writer (tiny) ────────────────────────────────────────

function isScalar(v) {
  return (
    v === null ||
    typeof v === "boolean" ||
    typeof v === "number" ||
    typeof v === "string"
  );
}

function yamlScalar(v) {
  if (v === null) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  // strings
  const s = String(v);
  if (s === "") return '""';
  if (/^(true|false|null|yes|no|on|off)$/i.test(s)) return JSON.stringify(s);
  if (/^[-+]?\d+(\.\d+)?$/.test(s)) return JSON.stringify(s);
  // simple identifiers and paths are safe without quotes
  if (/^[A-Za-z_][A-Za-z0-9_\-/.:@ ]*$/.test(s) && !s.includes("\n")) {
    // still quote if it has yaml-significant chars
    if (/[:#&*!|>%@`{}\[\]]/.test(s)) return JSON.stringify(s);
    return s;
  }
  // strings with newlines use block literal
  if (s.includes("\n")) {
    const indented = s
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    return `|\n${indented}`;
  }
  return JSON.stringify(s);
}

function yamlDump(value, indent = 0) {
  const pad = (n) => " ".repeat(n);
  if (isScalar(value)) {
    return yamlScalar(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        if (isScalar(item)) {
          return `${pad(indent)}- ${yamlScalar(item)}`;
        }
        const dumped = yamlDump(item, indent + 2);
        // First line gets `- `, subsequent lines indent by 2.
        const lines = dumped.split("\n");
        const firstNonEmpty = lines.findIndex((l) => l.trim().length > 0);
        if (firstNonEmpty < 0) return `${pad(indent)}- {}`;
        lines[firstNonEmpty] =
          `${pad(indent)}- ${lines[firstNonEmpty].slice(indent + 2)}`;
        return lines.join("\n");
      })
      .join("\n");
  }
  // object
  const keys = Object.keys(value);
  if (keys.length === 0) return "{}";
  const lines = [];
  for (const k of keys) {
    const v = value[k];
    if (isScalar(v)) {
      lines.push(`${pad(indent)}${k}: ${yamlScalar(v)}`);
    } else if (Array.isArray(v) && v.length === 0) {
      lines.push(`${pad(indent)}${k}: []`);
    } else if (
      typeof v === "object" &&
      v !== null &&
      !Array.isArray(v) &&
      Object.keys(v).length === 0
    ) {
      lines.push(`${pad(indent)}${k}: {}`);
    } else if (Array.isArray(v)) {
      lines.push(`${pad(indent)}${k}:`);
      lines.push(yamlDump(v, indent + 2));
    } else {
      lines.push(`${pad(indent)}${k}:`);
      lines.push(yamlDump(v, indent + 2));
    }
  }
  return lines.join("\n");
}

function writeYaml(file, value) {
  ensureDir(path.dirname(file));
  const body = yamlDump(value, 0) + "\n";
  fs.writeFileSync(file, body, "utf8");
  return { wrote: true, reason: "ok" };
}

// ── Minimal YAML reader (handles the subset we write) ──────────

function readYamlMaybe(file) {
  const text = readText(file);
  if (text === null) return null;
  // First try js-yaml if available (better robustness).
  try {
    const yaml = require("js-yaml");
    return yaml.load(text);
  } catch {
    // fall through to JSON.parse for json-mode tracker files
  }
  try {
    return JSON.parse(text);
  } catch {
    // fall through to mini-yaml
  }
  return parseMiniYaml(text);
}

// Very small yaml subset parser — only handles scalar/array/object/
// block-literal that our own yamlDump writer emits. NOT a general
// yaml parser. Sprint tracker files written by writeYaml are
// round-trippable through it.
function parseMiniYaml(text) {
  const lines = text.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, value: root, key: null }];

  function setValue(parent, key, val) {
    if (Array.isArray(parent)) {
      parent.push(val);
    } else {
      parent[key] = val;
    }
  }
  function topContainer() {
    return stack[stack.length - 1];
  }
  function indentOf(line) {
    let i = 0;
    while (i < line.length && line[i] === " ") i++;
    return i;
  }

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (raw.trim() === "" || raw.trim().startsWith("#")) {
      i++;
      continue;
    }
    const indent = indentOf(raw);
    const line = raw.slice(indent);
    // pop stack until parent has lower indent
    while (stack.length > 1 && topContainer().indent >= indent) stack.pop();
    const parent = topContainer().value;
    const arrMatch = /^-\s*(.*)$/.exec(line);
    if (arrMatch) {
      // ensure parent is array
      if (!Array.isArray(parent)) {
        // convert: parent[key] should be array; happen by replacing on key
        // not expected in our writer output
      }
      const rest = arrMatch[1];
      if (rest === "" || rest === "{}" || rest === "[]") {
        const v = rest === "[]" ? [] : rest === "{}" ? {} : {};
        if (Array.isArray(parent)) parent.push(v);
        stack.push({ indent, value: v, key: null });
        i++;
        continue;
      }
      // inline: - key: value
      const km = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(rest);
      if (km) {
        const obj = {};
        const v = parseInlineValue(km[2]);
        obj[km[1]] = v;
        if (Array.isArray(parent)) parent.push(obj);
        stack.push({ indent, value: obj, key: km[1] });
        i++;
        continue;
      }
      // - scalar
      const sv = parseInlineValue(rest);
      if (Array.isArray(parent)) parent.push(sv);
      i++;
      continue;
    }
    const kv = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(line);
    if (kv) {
      const k = kv[1];
      const rest = kv[2];
      if (rest === "") {
        // nested container — peek next line to decide array vs object
        const next = lines[i + 1] || "";
        if (next.trim().startsWith("- ") || next.trim() === "-") {
          const v = [];
          setValue(parent, k, v);
          stack.push({ indent, value: v, key: k });
        } else {
          const v = {};
          setValue(parent, k, v);
          stack.push({ indent, value: v, key: k });
        }
        i++;
        continue;
      }
      if (rest === "|") {
        // block literal — read indented lines beneath this one
        const baseIndent = indent + 2;
        const buf = [];
        i++;
        while (i < lines.length) {
          const next = lines[i];
          if (next.trim() === "") {
            buf.push("");
            i++;
            continue;
          }
          const nIndent = indentOf(next);
          if (nIndent < baseIndent) break;
          buf.push(next.slice(baseIndent));
          i++;
        }
        setValue(parent, k, buf.join("\n").replace(/\n+$/, ""));
        continue;
      }
      if (rest === "{}") {
        setValue(parent, k, {});
        i++;
        continue;
      }
      if (rest === "[]") {
        setValue(parent, k, []);
        i++;
        continue;
      }
      // inline scalar
      setValue(parent, k, parseInlineValue(rest));
      i++;
      continue;
    }
    i++;
  }
  return root;
}

function parseInlineValue(s) {
  if (s === "" || s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "{}") return {};
  if (s === "[]") return [];
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      return JSON.parse(s);
    } catch {
      return s.slice(1, -1);
    }
  }
  // inline {} object — minimal: keep as raw string
  return s;
}

module.exports = {
  ensureDir,
  readText,
  writeText,
  render,
  nowIso,
  writeYaml,
  readYamlMaybe,
  yamlDump,
};
