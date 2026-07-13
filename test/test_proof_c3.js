"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }
function run(cmd, args) { return execFileSync(cmd, args, { cwd: root, encoding: "utf8" }); }

function resetOut() {
  fs.rmSync(path.join(root, "fixtures/out"), { recursive: true, force: true });
}

t("C3 SHADED storyboard plan reconstructs WIR and projects to Ren'Py", () => {
  resetOut();
  run("node", ["tools/execute-plan.js", "examples/plans/shaded-storyboard-to-renpy.plan.json", "--run", "--workdir", root, "--report", "fixtures/out/c3-shaded.execution.json"]);
  assert.ok(fs.existsSync(path.join(root, "fixtures/out/shaded-import.wir.json")));
  const report = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/shaded-import.report.json"), "utf8"));
  assert.strictEqual(report.summary.byRoute.reconstruct, 1);
  assert.ok(report.import.losses.some((l) => l.param === "flash"), "SHADED-only flash parameter remains explicit loss");
  const rpy = fs.readFileSync(path.join(root, "fixtures/out/shaded-renpy/shaded-sturmnacht_trivium.rpy"), "utf8");
  assert.ok(rpy.includes("label trivium_sturmnacht:"));
});

t("C3 SHADED evidence dossier passes", () => {
  const out = run("node", ["tools/verify-evidence.js", "examples/contracts/verify.shaded-to-renpy.evidence.contract.json", "--artifacts", root, "--out", "fixtures/out/c3-shaded.evidence.json"]);
  assert.ok(out.includes("evidence dossier"));
  const dossier = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/c3-shaded.evidence.json"), "utf8"));
  assert.strictEqual(dossier.failed.length, 0);
});

t("C3 TSCN fragment reader emits WIR, EIR and honest review entries", () => {
  run("node", ["tools/execute-plan.js", "examples/plans/godot-tscn-fragment-to-wir.plan.json", "--run", "--workdir", root, "--report", "fixtures/out/c3-tscn.execution.json"]);
  const eir = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/godot-five-node.eir.json"), "utf8"));
  const report = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/godot-five-node.report.json"), "utf8"));
  const wir = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/godot-five-node.wir.json"), "utf8"));
  assert.strictEqual(eir.nodes.length, 5);
  assert.ok(report.reviewCount > 0, "a recovered engine scene must retain review debt");
  assert.ok(wir.grammar.entities.some((e) => e.id === "guard" && e.kind === "character"));
  assert.ok(report.summary.byRoute.unknown > 0);
});

t("C3 TSCN evidence dossier passes", () => {
  const out = run("node", ["tools/verify-evidence.js", "examples/contracts/verify.godot-tscn-fragment.evidence.contract.json", "--artifacts", root, "--out", "fixtures/out/c3-tscn.evidence.json"]);
  assert.ok(out.includes("evidence dossier"));
  const dossier = JSON.parse(fs.readFileSync(path.join(root, "fixtures/out/c3-tscn.evidence.json"), "utf8"));
  assert.strictEqual(dossier.failed.length, 0);
});

t("TSCN parser keeps only declared node headers as structural input", () => {
  const { parseNodes } = require("../tools/recipes/tscn-fragment-to-wir");
  const nodes = parseNodes(fs.readFileSync(path.join(root, "fixtures/godot/five-node-scene.tscn"), "utf8"));
  assert.deepStrictEqual(nodes.map((x) => x.name), ["Root", "Door", "DoorCollision", "Guard", "StormParticles"]);
});

console.log(`test_proof_c3: ${n} passed`);
