"use strict";

const fs = require("fs");
const path = require("path");
const { loadContract } = require("./schema");

const REQUIRED_MATRIX_FIELDS = Object.freeze([
  "repository", "license", "last_verified", "source_versions", "target_versions",
  "execution_mode", "headless", "known_losses", "manual_steps", "fixture", "evidence", "confidence", "status",
]);
const TOOL_STATUSES = Object.freeze(["candidate", "verified", "rejected", "superseded"]);
const HEADLESS_VALUES = Object.freeze([true, false, "partial", "unknown"]);

function loadToolRegistry(dir, opts = {}) {
  const registry = new Map();
  const warnings = [];
  const formats = loadKnownFormats(opts.formatsPath || path.join(dir, "..", "formats.md"));
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".tool.json")).sort()) {
    const full = path.join(dir, file);
    const manifest = loadToolManifest(full, formats, warnings);
    if (registry.has(manifest.id)) throw new Error(`tool registry: duplicate id '${manifest.id}'`);
    registry.set(manifest.id, manifest);
  }
  registry.warnings = warnings;
  return registry;
}

function loadToolManifest(file, formats = new Set(), warnings = []) {
  const doc = loadContract(fs.readFileSync(file, "utf8"));
  const errors = [];
  if (doc.kind !== "tool") errors.push(`${file}: kind must be 'tool'`);
  for (const f of REQUIRED_MATRIX_FIELDS) if (doc[f] === undefined) errors.push(`${file}: missing matrix field '${f}'`);
  if (!nonEmptyString(doc.repository)) errors.push(`${file}: repository is required`);
  if (!nonEmptyString(doc.license)) errors.push(`${file}: license is required; use 'unknown' when unverified`);
  if (!nonEmptyString(doc.last_verified)) errors.push(`${file}: last_verified is required`);
  if (!Array.isArray(doc.source_versions)) errors.push(`${file}: source_versions[] is required`);
  if (!Array.isArray(doc.target_versions)) errors.push(`${file}: target_versions[] is required`);
  if (!nonEmptyString(doc.execution_mode)) errors.push(`${file}: execution_mode is required`);
  if (!HEADLESS_VALUES.includes(doc.headless)) errors.push(`${file}: headless must be true, false, 'partial', or 'unknown'`);
  if (!Array.isArray(doc.known_losses)) errors.push(`${file}: known_losses[] is required`);
  if (!Array.isArray(doc.manual_steps)) errors.push(`${file}: manual_steps[] is required`);
  if (typeof doc.confidence !== "number" || doc.confidence < 0 || doc.confidence > 1) errors.push(`${file}: confidence must be 0..1`);
  if (!TOOL_STATUSES.includes(doc.status)) errors.push(`${file}: invalid status '${doc.status}'`);
  if (doc.status === "verified" && !doc.evidence) errors.push(`${file}: verified status requires evidence`);
  warnUnknownFormats(doc, formats, warnings, file);
  if (errors.length) throw new Error(errors.join("; "));
  return doc;
}

function toolsAccepting(registry, format) {
  return [...registry.values()].filter((tool) => tool.accepts.includes(format));
}

function toolsProducing(registry, format) {
  return [...registry.values()].filter((tool) => tool.produces.includes(format));
}

function loadKnownFormats(file) {
  if (!fs.existsSync(file)) return new Set();
  const text = fs.readFileSync(file, "utf8");
  const formats = new Set();
  for (const m of text.matchAll(/`([^`]+)`/g)) formats.add(m[1]);
  return formats;
}

function warnUnknownFormats(doc, formats, warnings, file) {
  if (!formats.size) return;
  for (const field of ["accepts", "produces"]) {
    for (const token of doc[field] || []) {
      if (!formats.has(token)) warnings.push(`${file}: ${field} token '${token}' is not listed in formats.md`);
    }
  }
}

function nonEmptyString(x) { return typeof x === "string" && x.trim().length > 0; }

module.exports = { REQUIRED_MATRIX_FIELDS, TOOL_STATUSES, loadToolRegistry, loadToolManifest, toolsAccepting, toolsProducing, loadKnownFormats };
