#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const LAB = require("../packages/trivium-lab");

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  process.stdout.write(`TRIVIUM LAB — Legacy Adventure Bridge\n\nUsage:\n  node bin/trivium-lab.js <request.json> [--out <directory>] [--json]\n\nOutputs:\n  lab-bundle.json\n  plan.json\n  handoffs/{decompile,trivium,wizard,swift,shaded}.request.json\n`);
  process.exit(0);
}

const requestFile = path.resolve(args[0]);
const outIndex = args.indexOf("--out");
const outputDir = path.resolve(outIndex >= 0 ? args[outIndex + 1] : `lab-out/${path.basename(requestFile, path.extname(requestFile))}`);
if (!fs.existsSync(requestFile)) fail(`LAB: request not found: ${requestFile}`, 2);
if (outIndex >= 0 && !args[outIndex + 1]) fail("LAB: --out requires a directory", 2);

let request;
try {
  request = JSON.parse(fs.readFileSync(requestFile, "utf8"));
} catch (error) {
  fail(`LAB: invalid request JSON: ${error.message}`, 2);
}

const validation = LAB.validateRequest(request);
if (!validation.ok) fail(`LAB: ${validation.errors.join("; ")}`, 2);

try {
  const bundle = LAB.writeBundle(request, outputDir);
  const summary = {
    status: "success",
    module: bundle.module,
    moduleVersion: bundle.moduleVersion,
    jobId: bundle.request.id,
    outputDir,
    handoffs: Object.keys(bundle.handoffs),
  };
  process.stdout.write(args.includes("--json") ? `${JSON.stringify(summary)}\n` : `LAB bundle written to ${outputDir}\n`);
} catch (error) {
  fail(`LAB: ${error.message}`, 1);
}
