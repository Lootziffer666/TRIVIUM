#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const C = require(path.join(ROOT, "packages/trivium-contracts"));

function main(argv) {
  const opts = parseArgs(argv);
  if (!opts.plan) usage(1);
  const registry = C.loadToolRegistry(opts.registry || path.join(ROOT, "registry", "tools"));
  const plan = C.loadPlanFile(opts.plan, registry);
  const report = executePlan(plan, registry, opts);
  const reportPath = opts.report || path.join(opts.workdir, "execution-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`execution report: ${reportPath}`);
  if (report.status === "not_executable") process.exit(3);
  if (report.status === "failed") process.exit(1);
}

function parseArgs(argv) {
  const opts = { dryRun: true, workdir: process.cwd(), registry: null, report: null, plan: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--run") opts.dryRun = false;
    else if (a === "--workdir") opts.workdir = path.resolve(argv[++i]);
    else if (a === "--registry") opts.registry = path.resolve(argv[++i]);
    else if (a === "--report") opts.report = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") usage(0);
    else if (!opts.plan) opts.plan = path.resolve(a);
    else usage(1);
  }
  return opts;
}

function usage(code) {
  console.log("usage: execute-plan <plan.json> [--dry-run|--run] [--workdir DIR] [--registry DIR] [--report FILE]");
  process.exit(code);
}

function executePlan(plan, registry, opts = {}) {
  const workdir = opts.workdir || process.cwd();
  const dryRun = opts.dryRun !== false;
  const report = { planId: plan.id, status: dryRun ? "dry-run" : "completed", mode: dryRun ? "dry-run" : "run", startedAt: new Date().toISOString(), steps: [] };
  let blocked = false;
  for (const step of plan.steps) {
    const tool = registry.get(step.tool);
    const command = commandFor(tool);
    const stepReport = { id: step.id, tool: step.tool, command, status: "pending", inputHashes: {}, outputHashes: {}, version: null, error: null };
    for (const input of step.inputs || []) stepReport.inputHashes[input] = hashIfExists(path.resolve(workdir, input));
    const found = findCommand(command);
    stepReport.version = found ? versionOf(command) : null;
    if (!found) {
      stepReport.status = "missing_tool";
      stepReport.error = `tool command '${command}' not found`;
      report.status = "not_executable";
      blocked = true;
    } else if (blocked) {
      stepReport.status = "skipped";
    } else if (dryRun) {
      stepReport.status = "dry-run";
    } else {
      try {
        execFileSync(command, argsFor(step, tool), { cwd: workdir, stdio: "pipe" });
        stepReport.status = "completed";
      } catch (err) {
        stepReport.status = "failed";
        stepReport.error = err.message;
        report.status = "failed";
        blocked = true;
      }
    }
    for (const output of step.produces || []) stepReport.outputHashes[output] = hashIfExists(path.resolve(workdir, output));
    report.steps.push(stepReport);
  }
  report.finishedAt = new Date().toISOString();
  return report;
}

function commandFor(tool) { return tool.command || (tool.execution && tool.execution.command) || tool.id; }
function argsFor(step, tool) { return Array.isArray(step.args) ? step.args : Array.isArray(tool.args) ? tool.args : []; }
function findCommand(command) {
  if (!command) return false;
  if (command.includes(path.sep)) return fs.existsSync(command);
  const res = spawnSync(process.platform === "win32" ? "where" : "which", [command], { encoding: "utf8" });
  return res.status === 0;
}
function versionOf(command) {
  try { return execFileSync(command, ["--version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 2000 }).split("\n")[0] || null; }
  catch { return null; }
}
function hashIfExists(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (require.main === module) main(process.argv.slice(2));
module.exports = { executePlan, parseArgs, hashIfExists };
