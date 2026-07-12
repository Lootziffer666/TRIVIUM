#!/usr/bin/env node
/*!
 * TRIVIUM verify — the whole proof in one run (same spirit as SHADED's
 * tools/verify.js): run every test, then translate the example world to
 * every registered adapter, write the artifacts + reports to
 * tools/verify-out/ (never committed) and print each ledger summary.
 * Exit ≠ 0 on any failure.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "verify-out");

let failed = false;

// ── 1. tests ─────────────────────────────────────────────────────────────
const testDir = path.join(ROOT, "test");
for (const f of fs.readdirSync(testDir).filter((f) => f.startsWith("test_")).sort()) {
  process.stdout.write(`\n== ${f} ==\n`);
  try {
    execFileSync(process.execPath, [path.join(testDir, f)], { stdio: "inherit" });
  } catch {
    failed = true;
    console.error(`FAIL: ${f}`);
  }
}


// ── 1.5 contract fixtures ───────────────────────────────────────────────
process.stdout.write(`\n== contract fixtures ==\n`);
try {
  const C = require(path.join(ROOT, "packages/trivium-contracts"));
  const contractsDir = path.join(ROOT, "examples", "contracts");
  const fixtures = fs.existsSync(contractsDir)
    ? fs.readdirSync(contractsDir).filter((f) => f.endsWith(".contract.json")).sort()
    : [];
  for (const f of fixtures) {
    C.loadContract(fs.readFileSync(path.join(contractsDir, f), "utf8"));
    console.log(`  ok ${f}`);
  }
  console.log(`contract fixtures: ${fixtures.length} passed`);
} catch (err) {
  failed = true;
  console.error(`FAIL: contract fixtures: ${err.message}`);
}


// ── 1.6 tool registry ──────────────────────────────────────────────────
process.stdout.write(`\n== tool registry ==\n`);
try {
  const C = require(path.join(ROOT, "packages/trivium-contracts"));
  const tools = C.loadToolRegistry(path.join(ROOT, "registry", "tools"));
  console.log(`tool registry: ${tools.size} candidates loaded`);
  if (tools.warnings.length) {
    failed = true;
    for (const w of tools.warnings) console.error(`FAIL: ${w}`);
  }
} catch (err) {
  failed = true;
  console.error(`FAIL: tool registry: ${err.message}`);
}

// ── 2. translate every example world to every adapter ────────────────────
const T = require(path.join(ROOT, "packages/trivium-core"));
const examplesDir = path.join(ROOT, "examples");
const worlds = fs.readdirSync(examplesDir).filter((f) => f.endsWith(".js")).sort()
  .map((f) => require(path.join(examplesDir, f)).build);

const reg = T.createRegistry();
for (const name of ["shaded", "godot", "love2d", "renpy", "unity", "unreal"]) {
  reg.register(require(path.join(ROOT, "adapters", name, "adapter")).adapter);
}

// Nur eigene Übersetzungs-Ordner räumen — live_*.png von verify-live
// sind fremde Beweise und bleiben liegen.
for (const build of worlds) {
  fs.rmSync(path.join(OUT, build().meta.id), { recursive: true, force: true });
}
for (const build of worlds) {
const worldId = build().meta.id;
console.log(`\n== translations: ${worldId} ==`);
for (const target of reg.list()) {
  try {
    const res = T.translate(build(), target, reg);
    const dir = path.join(OUT, worldId, target);
    fs.mkdirSync(dir, { recursive: true });
    for (const a of res.artifacts) {
      const p = path.join(dir, a.path);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, a.content);
    }
    fs.writeFileSync(path.join(dir, "TRANSLATION_REPORT.md"), res.report);
    const s = res.summary;
    console.log(
      `${target.padEnd(7)} fidelity=${String(s.fidelity).padEnd(5)} ` +
      `native=${s.byRoute.native} bridge=${s.byRoute.bridge} approx=${s.byRoute.approximate} ` +
      `preserve=${s.byRoute.preserve} unknown=${s.byRoute.unknown} ` +
      `losses=${s.losses} gains=${s.gains} review=${s.needsHumanReview}`
    );
    if (s.needsHumanReview) {
      failed = true;
      console.error(`FAIL: ${target} left concepts in needs_human_review`);
    }
  } catch (err) {
    failed = true;
    console.error(`FAIL: ${target}: ${err.message}`);
  }
}
}

console.log(`\nartifacts + reports: ${path.relative(process.cwd(), OUT)}/<world>/<target>/`);
console.log(failed ? "\nVERIFY: FAIL" : "\nVERIFY: PASS");
process.exit(failed ? 1 : 0);
