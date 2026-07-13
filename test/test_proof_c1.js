"use strict";
// C1 proof route: generated OBJ → normalized GLB fixture → evidence dossier.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }
function run(cmd, args) { return execFileSync(process.execPath, [path.join(ROOT, cmd), ...args], { cwd: ROOT, encoding: "utf8" }); }

t("generator creates deterministic guard OBJ fixture", () => {
  run("fixtures/gen-guard-mesh.js", []);
  const obj = fs.readFileSync(path.join(ROOT, "fixtures", "out", "guard.obj"), "utf8");
  assert.ok(obj.includes("guard_low_poly"));
  assert.ok(obj.includes("v -0.25 0 -0.15"));
});

t("normalization plan executes through the dry-run executor in real mode", () => {
  run("tools/execute-plan.js", ["examples/plans/guard-obj-normalize.plan.json", "--run", "--workdir", ROOT]);
  assert.ok(fs.existsSync(path.join(ROOT, "fixtures", "out", "guard.normalized.glb")));
  assert.ok(fs.existsSync(path.join(ROOT, "fixtures", "out", "guard.normalize.report.json")));
});

t("normalization report records the first real normalize route", () => {
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures", "out", "guard.normalize.report.json"), "utf8"));
  assert.strictEqual(report.summary.byRoute.normalize, 1);
  assert.strictEqual(report.ledger.events[0].contractRef, "examples/contracts/actor.guard.asset.contract.json");
});

t("evidence contract verifies the normalized guard route", () => {
  run("tools/verify-evidence.js", ["examples/contracts/verify.guard.obj-normalize.evidence.contract.json", "--artifacts", ROOT]);
  const dossier = JSON.parse(fs.readFileSync(path.join(ROOT, "evidence-dossier.json"), "utf8"));
  assert.strictEqual(dossier.failed.length, 0);
  assert.strictEqual(dossier.needs_human_review.length, 0);
});

console.log(`test_proof_c1: ${n} passed`);
