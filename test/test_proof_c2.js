"use strict";
// C2 proof route: normalized GLB fixture → 8-direction atlas → Godot resource.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }
function run(cmd, args) { return execFileSync(process.execPath, [path.join(ROOT, cmd), ...args], { cwd: ROOT, encoding: "utf8" }); }
function ensureC1() { run("fixtures/gen-guard-mesh.js", []); run("tools/execute-plan.js", ["examples/plans/guard-obj-normalize.plan.json", "--run", "--workdir", ROOT]); }

t("sprite bake plan emits frames, atlas, and Godot resource", () => {
  ensureC1();
  run("tools/execute-plan.js", ["examples/plans/guard-sprite-bake.plan.json", "--run", "--workdir", ROOT]);
  assert.ok(fs.existsSync(path.join(ROOT, "fixtures/out/guard.atlas.png")));
  assert.ok(fs.existsSync(path.join(ROOT, "fixtures/out/guard.tres")));
});

t("atlas manifest records eight directions with alpha and consistent boxes", () => {
  const atlas = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures/out/guard.atlas.json"), "utf8"));
  assert.strictEqual(atlas.frameCount, 8);
  assert.strictEqual(atlas.alphaPresent, true);
  assert.strictEqual(atlas.bboxConsistent, true);
});

t("sprite report records bake and project with losses and gains", () => {
  const report = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures/out/guard.sprite.report.json"), "utf8"));
  assert.strictEqual(report.summary.byRoute.bake, 1);
  assert.strictEqual(report.summary.byRoute.project, 1);
  assert.ok(report.losses.some((x) => x.route === "bake"));
  assert.ok(report.gains.length >= 2);
});

t("sprite bake evidence exits cleanly", () => {
  run("tools/verify-evidence.js", ["examples/contracts/verify.guard.sprite-bake.evidence.contract.json", "--artifacts", ROOT, "--out", "fixtures/out/guard.sprite.evidence-dossier.json"]);
  const dossier = JSON.parse(fs.readFileSync(path.join(ROOT, "fixtures/out/guard.sprite.evidence-dossier.json"), "utf8"));
  assert.strictEqual(dossier.failed.length, 0);
  assert.strictEqual(dossier.needs_human_review.length, 0);
});

t("verified C2 tools point at the generated evidence dossier", () => {
  for (const id of ["trivium.render-eight-direction", "trivium.atlas-pack", "trivium.godot-sprite-resource"]) {
    const tool = JSON.parse(fs.readFileSync(path.join(ROOT, "registry/tools", `${id}.tool.json`), "utf8"));
    assert.strictEqual(tool.status, "verified");
    assert.strictEqual(tool.evidence, "fixtures/out/guard.sprite.evidence-dossier.json");
  }
});

console.log(`test_proof_c2: ${n} passed`);
