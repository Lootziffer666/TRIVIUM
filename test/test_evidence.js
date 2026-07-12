"use strict";
// CUE-light evidence runner checks.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { runEvidence, runCheck } = require("../tools/verify-evidence");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trivium-evidence-"));
  fs.writeFileSync(path.join(dir, "hello.txt"), "hello");
  fs.writeFileSync(path.join(dir, "data.json"), JSON.stringify({ score: 3, nested: { name: "guard" } }));
  fs.writeFileSync(path.join(dir, "report.json"), JSON.stringify({ byRoute: { project: 2, bake: 1 } }));
  fs.writeFileSync(path.join(dir, "tiny.png"), png1x1());
  return dir;
}
function contract(dir, checks) {
  const doc = { contractVersion: "0.1.0", id: "verify.demo", kind: "evidence", source: { type: "test", provenance: "test_evidence" }, checks, artifacts: ["hello.txt", "data.json", "report.json", "tiny.png"] };
  const file = path.join(dir, "contract.evidence.contract.json");
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
  return { doc, file };
}
function png1x1() {
  return Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000154a24f5d0000000049454e44ae426082", "hex");
}

t("file_exists passes and fails", () => {
  const dir = setup();
  assert.strictEqual(runCheck("file_exists hello.txt", dir).status, "pass");
  assert.strictEqual(runCheck("file_exists missing.txt", dir).status, "fail");
});

t("file_hash checks sha256", () => {
  const dir = setup();
  assert.strictEqual(runCheck("file_hash hello.txt 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", dir).status, "pass");
});

t("json_path supports eq/gte/lte/nonempty", () => {
  const dir = setup();
  assert.strictEqual(runCheck("json_path data.json nested.name eq guard", dir).status, "pass");
  assert.strictEqual(runCheck("json_path data.json score gte 2", dir).status, "pass");
  assert.strictEqual(runCheck("json_path data.json score lte 3", dir).status, "pass");
  assert.strictEqual(runCheck("json_path data.json nested.name nonempty ignored", dir).status, "pass");
});

t("image_dimensions reads PNG header", () => {
  const dir = setup();
  assert.strictEqual(runCheck("image_dimensions tiny.png 1 1", dir).status, "pass");
  assert.strictEqual(runCheck("image_dimensions tiny.png 2 1", dir).status, "fail");
});

t("report_route_count compares route counts", () => {
  const dir = setup();
  assert.strictEqual(runCheck("report_route_count report.json project gte 2", dir).status, "pass");
  assert.strictEqual(runCheck("report_route_count report.json bake eq 2", dir).status, "fail");
});

t("manual checks require human review", () => {
  const dir = setup();
  assert.strictEqual(runCheck("manual inspect_silhouette", dir).status, "manual");
});

t("runEvidence writes pass/fail/manual groupings", () => {
  const dir = setup();
  const { doc } = contract(dir, ["file_exists hello.txt", "file_exists missing.txt", "manual inspect"]);
  const dossier = runEvidence(doc, dir);
  assert.strictEqual(dossier.passed.length, 1);
  assert.strictEqual(dossier.failed.length, 1);
  assert.strictEqual(dossier.needs_human_review.length, 1);
  assert.ok(dossier.artifactHashes["hello.txt"]);
});

t("CLI exits 0/1/2 for pass/fail/manual", () => {
  const passDir = setup();
  const pass = contract(passDir, ["file_exists hello.txt"]);
  assert.strictEqual(spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "verify-evidence.js"), pass.file, "--artifacts", passDir]).status, 0);
  const failDir = setup();
  const fail = contract(failDir, ["file_exists nope.txt"]);
  assert.strictEqual(spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "verify-evidence.js"), fail.file, "--artifacts", failDir]).status, 1);
  const manualDir = setup();
  const manual = contract(manualDir, ["manual inspect"]);
  assert.strictEqual(spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "verify-evidence.js"), manual.file, "--artifacts", manualDir]).status, 2);
});

console.log(`test_evidence: ${n} passed`);
