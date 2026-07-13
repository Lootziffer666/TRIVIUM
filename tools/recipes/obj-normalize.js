#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { ROUTES, createLedger, record, summarize } = require("../../packages/trivium-core/src/ledger");

const [input, glbOut, reportOut] = process.argv.slice(2);
if (!input || !glbOut || !reportOut) {
  console.error("usage: obj-normalize <input.obj> <out.glb> <report.json>");
  process.exit(1);
}
const text = fs.readFileSync(input, "utf8");
const verts = [...text.matchAll(/^v\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/gm)].map((m) => m.slice(1).map(Number));
if (!verts.length) throw new Error("obj-normalize: no vertices found");
const min = [0, 1, 2].map((i) => Math.min(...verts.map((v) => v[i])));
const max = [0, 1, 2].map((i) => Math.max(...verts.map((v) => v[i])));
const height = max[1] - min[1];
const normalized = verts.map((v) => [v[0], v[1] - min[1], v[2]]);
const gltfJson = JSON.stringify({ asset: { version: "2.0", generator: "TRIVIUM obj-normalize" }, extras: { source: input, normalized: { up: "Y", unit: "meter", pivotAtGround: true, bbox: { min: [min[0], 0, min[2]], max: [max[0], height, max[2]], height } }, vertices: normalized.length } });
const jsonBytes = Buffer.from(gltfJson, "utf8");
const header = Buffer.alloc(20);
header.write("glTF", 0, "ascii");
header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + jsonBytes.length, 8);
header.writeUInt32LE(jsonBytes.length, 12);
header.write("JSON", 16, "ascii");
fs.mkdirSync(path.dirname(glbOut), { recursive: true });
fs.writeFileSync(glbOut, Buffer.concat([header, jsonBytes]));
const ledger = createLedger("guard-fixture", "normalized-glb");
record(ledger, { conceptId: "asset.guard.geometry", kind: "asset.mesh.obj", route: ROUTES.NORMALIZE, ruleId: "TRV-C1-OBJ-NORMALIZE", reason: "normalize procedural guard OBJ to Y-up meter GLB fixture", contractRef: "examples/contracts/actor.guard.asset.contract.json", via: "trivium.obj-normalize" });
const report = { source: input, target: glbOut, gltf: JSON.parse(gltfJson), ledger, summary: summarize(ledger), byRoute: summarize(ledger).byRoute, manualRestaufwand: ["No DCC importer fidelity is proven in C1; this is the dependency-free normalization path."] };
fs.mkdirSync(path.dirname(reportOut), { recursive: true });
fs.writeFileSync(reportOut, JSON.stringify(report, null, 2) + "\n");
console.log(glbOut);
