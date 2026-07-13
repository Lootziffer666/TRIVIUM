#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const T = require("../../packages/trivium-core");
const ledger = require("../../packages/trivium-core/src/ledger");
const { importStoryboard } = require("../../adapters/shaded/importer");

function main(argv) {
  const [input, outWir, outReport] = argv;
  if (!input || !outWir || !outReport) usage();
  const doc = JSON.parse(fs.readFileSync(input, "utf8"));
  const { world, report: importReport } = importStoryboard(doc.meta || {}, doc.steps || []);
  const l = ledger.createLedger(world.meta.id, "wir");
  ledger.record(l, {
    conceptId: "scene.shaded.storyboard",
    kind: "scene",
    route: ledger.ROUTES.RECONSTRUCT,
    ruleId: "TRV-C3-SHADED-IMPORT",
    reason: "SHADED storyboard parameters are lifted into WIR intent axes by the formal importer.",
    via: "adapters/shaded/importer.js",
    contractRef: "examples/contracts/scene.shaded-import.scene.contract.json"
  });
  fs.mkdirSync(path.dirname(outWir), { recursive: true });
  fs.writeFileSync(outWir, JSON.stringify(world, null, 2) + "\n");
  fs.writeFileSync(outReport, JSON.stringify({ import: importReport, ledger: l, summary: ledger.summarize(l), coherence: T.checkCoherence(world) }, null, 2) + "\n");
}

function usage() {
  console.error("usage: shaded-storyboard-to-wir <storyboard.json> <out.wir.json> <out.report.json>");
  process.exit(2);
}

if (require.main === module) main(process.argv.slice(2));
