#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const C = require(path.join(ROOT, "packages/trivium-contracts"));

function main(argv) {
  const opts = parseArgs(argv);
  if (!opts.contract || !opts.artifacts) usage(1);
  const contract = C.loadContract(fs.readFileSync(opts.contract, "utf8"));
  if (contract.kind !== "evidence") throw new Error("verify-evidence: contract kind must be evidence");
  const dossier = runEvidence(contract, opts.artifacts);
  const out = opts.out || path.join(opts.artifacts, "evidence-dossier.json");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(dossier, null, 2) + "\n");
  console.log(`evidence dossier: ${out}`);
  process.exit(dossier.needs_human_review.length ? 2 : dossier.failed.length ? 1 : 0);
}

function parseArgs(argv) {
  const opts = { contract: null, artifacts: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--artifacts") opts.artifacts = path.resolve(argv[++i]);
    else if (a === "--out") opts.out = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") usage(0);
    else if (!opts.contract) opts.contract = path.resolve(a);
    else usage(1);
  }
  return opts;
}

function usage(code) {
  console.log("usage: verify-evidence <evidence.contract.json> --artifacts DIR [--out dossier.json]");
  process.exit(code);
}

function runEvidence(contract, artifactsDir) {
  const dossier = { contractId: contract.id, artifactsDir: path.resolve(artifactsDir), startedAt: new Date().toISOString(), checks: [], passed: [], failed: [], needs_human_review: [], artifactHashes: {} };
  for (const artifact of contract.artifacts || []) {
    const full = path.join(artifactsDir, artifact);
    dossier.artifactHashes[artifact] = hashIfExists(full);
  }
  for (const spec of contract.checks || []) {
    const result = runCheck(spec, artifactsDir);
    dossier.checks.push(result);
    if (result.status === "pass") dossier.passed.push(result.spec);
    else if (result.status === "manual") dossier.needs_human_review.push(result.spec);
    else dossier.failed.push(result.spec);
  }
  dossier.finishedAt = new Date().toISOString();
  return dossier;
}

function runCheck(spec, artifactsDir) {
  const parts = splitSpec(spec);
  const op = parts[0];
  try {
    if (op === "file_exists") return check(parts.length === 2 && fs.existsSync(path.join(artifactsDir, parts[1])), spec);
    if (op === "file_hash") return check(parts.length === 3 && hashIfExists(path.join(artifactsDir, parts[1])) === parts[2], spec);
    if (op === "json_path") return checkJsonPath(parts, artifactsDir, spec);
    if (op === "image_dimensions") return checkImageDimensions(parts, artifactsDir, spec);
    if (op === "report_route_count") return checkRouteCount(parts, artifactsDir, spec);
    if (op === "manual") return { spec, status: "manual", detail: parts.slice(1).join(" ") };
    return { spec, status: "fail", detail: `unknown check '${op}'` };
  } catch (err) {
    return { spec, status: "fail", detail: err.message };
  }
}

function checkJsonPath(parts, artifactsDir, spec) {
  if (parts.length !== 5) return check(false, spec, "json_path expects file path op value");
  const doc = JSON.parse(fs.readFileSync(path.join(artifactsDir, parts[1]), "utf8"));
  const actual = getPath(doc, parts[2]);
  return check(compare(actual, parts[3], parts[4]), spec, `actual=${JSON.stringify(actual)}`);
}

function checkImageDimensions(parts, artifactsDir, spec) {
  if (parts.length !== 4) return check(false, spec, "image_dimensions expects file w h");
  const buf = fs.readFileSync(path.join(artifactsDir, parts[1]));
  const png = buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a";
  const w = png ? buf.readUInt32BE(16) : null;
  const h = png ? buf.readUInt32BE(20) : null;
  return check(png && w === Number(parts[2]) && h === Number(parts[3]), spec, `actual=${w}x${h}`);
}

function checkRouteCount(parts, artifactsDir, spec) {
  if (parts.length !== 5) return check(false, spec, "report_route_count expects file route op n");
  const report = JSON.parse(fs.readFileSync(path.join(artifactsDir, parts[1]), "utf8"));
  const actual = report.byRoute ? report.byRoute[parts[2]] : report.routes ? report.routes[parts[2]] : undefined;
  return check(compare(actual, parts[3], parts[4]), spec, `actual=${actual}`);
}

function check(ok, spec, detail) { return { spec, status: ok ? "pass" : "fail", detail: detail || null }; }
function compare(actual, op, expectedRaw) {
  const expected = parseValue(expectedRaw);
  if (op === "eq") return actual === expected;
  if (op === "gte") return Number(actual) >= Number(expected);
  if (op === "lte") return Number(actual) <= Number(expected);
  if (op === "nonempty") return actual != null && String(actual).length > 0;
  throw new Error(`unknown comparison op '${op}'`);
}
function parseValue(x) { if (/^-?\d+(\.\d+)?$/.test(x)) return Number(x); if (x === "true") return true; if (x === "false") return false; return x; }
function getPath(obj, dotted) { return dotted.split(".").reduce((cur, key) => cur == null ? undefined : cur[key], obj); }
function hashIfExists(file) { if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null; return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function splitSpec(spec) { return String(spec).trim().split(/\s+/); }

if (require.main === module) main(process.argv.slice(2));
module.exports = { runEvidence, runCheck, hashIfExists };
