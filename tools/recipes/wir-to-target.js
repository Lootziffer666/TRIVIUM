#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const T = require("../../packages/trivium-core");
const { adapter: renpyAdapter } = require("../../adapters/renpy/adapter");
const { adapter: shadedAdapter } = require("../../adapters/shaded/adapter");

const ADAPTERS = { renpy: renpyAdapter, shaded: shadedAdapter };

function main(argv) {
  const [inputWir, target, outDir, outReport] = argv;
  if (!inputWir || !target || !outDir || !outReport) usage();
  const adapter = ADAPTERS[target];
  if (!adapter) throw new Error(`unknown target '${target}'`);
  const world = T.fromJSON(JSON.parse(fs.readFileSync(inputWir, "utf8")));
  const reg = T.createRegistry();
  reg.register(adapter);
  const result = T.translate(world, target, reg);
  fs.mkdirSync(outDir, { recursive: true });
  for (const artifact of result.artifacts) {
    const dest = path.join(outDir, artifact.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, artifact.content);
  }
  const reportPath = path.join(outDir, "TRANSLATION_REPORT.md");
  fs.writeFileSync(reportPath, T.formatReport(result.ledger, T.checkCoherence(world)));
  fs.writeFileSync(outReport, JSON.stringify({ target, artifacts: result.artifacts.map((a) => a.path), summary: result.summary, report: reportPath }, null, 2) + "\n");
}

function usage() {
  console.error("usage: wir-to-target <input.wir.json> <target> <out-dir> <out.report.json>");
  process.exit(2);
}

if (require.main === module) main(process.argv.slice(2));
