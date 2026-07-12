"use strict";
// Dry-run executor and plan hashing.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { executePlan, hashIfExists } = require("../tools/execute-plan");
const C = require("../packages/trivium-contracts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function tempSetup(command = process.execPath) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trivium-exec-"));
  fs.mkdirSync(path.join(dir, "tools"));
  fs.writeFileSync(path.join(dir, "formats.md"), "- `txt.in`\n- `txt.out`\n");
  const tool = {
    contractVersion: "0.1.0", id: "node-writer", kind: "tool",
    source: { type: "test", provenance: "test_execute_plan", license: "MIT" },
    repository: "local/node-writer", license: "MIT", last_verified: "2026-07-12",
    source_versions: ["test"], target_versions: ["test"], execution_mode: "cli", headless: true,
    accepts: ["txt.in"], produces: ["txt.out"], capabilities: ["write_file"], unknown: [], known_losses: [], manual_steps: [], fixture: null, evidence: null, confidence: 1, status: "candidate",
    execution: { mode: "cli", headless: true, command }
  };
  fs.writeFileSync(path.join(dir, "tools", "node-writer.tool.json"), JSON.stringify(tool, null, 2));
  const script = "require('fs').writeFileSync(process.argv[1], 'ok')";
  const plan = {
    planVersion: "0.1.0", id: "write-plan", route: "native",
    source: { artifact: "in.txt", contractRef: "contracts/source.contract.json" },
    target: { runtime: "test", form: "txt.out" },
    steps: [{ id: "write", tool: "node-writer", inputs: ["in.txt"], produces: ["out.txt"], args: ["-e", script, "out.txt"] }],
    verify: { contractRef: "contracts/evidence.contract.json" }, fallbacks: []
  };
  fs.writeFileSync(path.join(dir, "plan.plan.json"), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(dir, "in.txt"), "input");
  return { dir, planPath: path.join(dir, "plan.plan.json"), registryDir: path.join(dir, "tools") };
}

t("hashIfExists returns sha256 for files and null for missing files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trivium-hash-"));
  const file = path.join(dir, "x.txt");
  fs.writeFileSync(file, "abc");
  assert.strictEqual(hashIfExists(file), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.strictEqual(hashIfExists(path.join(dir, "missing")), null);
});

t("dry-run reports missing tools as not executable", () => {
  const setup = tempSetup("definitely-missing-trivium-tool");
  const tools = C.loadToolRegistry(setup.registryDir);
  const plan = C.loadPlanFile(setup.planPath, tools);
  const report = executePlan(plan, tools, { workdir: setup.dir, dryRun: true });
  assert.strictEqual(report.status, "not_executable");
  assert.strictEqual(report.steps[0].status, "missing_tool");
});

t("dry-run succeeds without creating outputs when tools exist", () => {
  const setup = tempSetup();
  const tools = C.loadToolRegistry(setup.registryDir);
  const plan = C.loadPlanFile(setup.planPath, tools);
  const report = executePlan(plan, tools, { workdir: setup.dir, dryRun: true });
  assert.strictEqual(report.status, "dry-run");
  assert.strictEqual(report.steps[0].status, "dry-run");
  assert.strictEqual(fs.existsSync(path.join(setup.dir, "out.txt")), false);
});

t("real execution writes output hashes", () => {
  const setup = tempSetup();
  const tools = C.loadToolRegistry(setup.registryDir);
  const plan = C.loadPlanFile(setup.planPath, tools);
  const report = executePlan(plan, tools, { workdir: setup.dir, dryRun: false });
  assert.strictEqual(report.status, "completed");
  assert.strictEqual(report.steps[0].status, "completed");
  assert.strictEqual(fs.readFileSync(path.join(setup.dir, "out.txt"), "utf8"), "ok");
  assert.ok(report.steps[0].outputHashes["out.txt"]);
});

t("CLI dry-run writes execution-report.json and exits 0 for available tools", () => {
  const setup = tempSetup();
  execFileSync(process.execPath, [path.join(__dirname, "..", "tools", "execute-plan.js"), setup.planPath, "--dry-run", "--workdir", setup.dir, "--registry", setup.registryDir], { stdio: "pipe" });
  const report = JSON.parse(fs.readFileSync(path.join(setup.dir, "execution-report.json"), "utf8"));
  assert.strictEqual(report.status, "dry-run");
});

t("CLI dry-run exits 3 when required tools are missing", () => {
  const setup = tempSetup("definitely-missing-trivium-tool");
  const res = spawnSync(process.execPath, [path.join(__dirname, "..", "tools", "execute-plan.js"), setup.planPath, "--dry-run", "--workdir", setup.dir, "--registry", setup.registryDir], { encoding: "utf8" });
  assert.strictEqual(res.status, 3);
  const report = JSON.parse(fs.readFileSync(path.join(setup.dir, "execution-report.json"), "utf8"));
  assert.strictEqual(report.status, "not_executable");
});

console.log(`test_execute_plan: ${n} passed`);
