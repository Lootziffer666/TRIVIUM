#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const T = require("../../packages/trivium-core");
const ledger = require("../../packages/trivium-core/src/ledger");

const TYPE_MAP = {
  Node2D: { kind: "place", tags: ["godot", "root"] },
  Area2D: { kind: "zone", tags: ["godot", "trigger-zone"] },
  CharacterBody2D: { kind: "character", tags: ["godot", "actor"] },
};

function main(argv) {
  const [input, outWir, outEir, outReport] = argv;
  if (!input || !outWir || !outEir || !outReport) usage();
  const text = fs.readFileSync(input, "utf8");
  const nodes = parseNodes(text);
  const world = T.createWorld({ id: "godot-five-node-fragment", title: "Godot Five Node Fragment", dims: "2d" });
  const review = [];
  const recognized = [];
  for (const n of nodes) {
    const map = TYPE_MAP[n.type];
    if (!map) {
      review.push({ node: n.name, type: n.type, reason: "no dependency-free semantic mapping in C3 fragment reader" });
      continue;
    }
    const id = slug(n.name);
    recognized.push({ node: n.name, type: n.type, entityId: id, kind: map.kind });
    T.addEntity(world, { id, kind: map.kind, name: n.name, tags: map.tags, props: { sourceType: n.type, sourceParent: n.parent || null } });
  }
  for (const n of nodes) {
    if (!n.parent || n.parent === ".") continue;
    const from = slug(n.parent);
    const to = slug(n.name);
    if (world.grammar.entities.some((e) => e.id === from) && world.grammar.entities.some((e) => e.id === to)) {
      T.addRelation(world, { id: `${from}_contains_${to}`, type: "contains", from, to, props: { source: "tscn.parent" } });
    }
  }
  T.addMoment(world, { id: "scene_static", label: "Static Godot scene fragment", durationSec: 1, intents: {} });
  T.setArc(world, ["scene_static"]);
  const l = ledger.createLedger(world.meta.id, "wir");
  ledger.record(l, { conceptId: "scene.godot.tscn", kind: "scene", route: ledger.ROUTES.RECONSTRUCT, ruleId: "TRV-C3-TSCN-FRAGMENT", reason: "Godot text scene node headers are decomposed into a neutral WIR fragment.", via: "tools/recipes/tscn-fragment-to-wir.js", contractRef: "examples/contracts/scene.godot-tscn-fragment.scene.contract.json" });
  for (const r of review) ledger.record(l, { conceptId: `godot.node.${slug(r.node)}`, kind: "grammar.node", route: ledger.ROUTES.UNKNOWN, ruleId: "TRV-C3-TSCN-UNKNOWN-NODE", reason: r.reason });
  const eir = { format: "godot.tscn.fragment.v0", nodes, recognized, needs_human_review: review };
  const report = { eir, reviewCount: review.length, ledger: l, summary: ledger.summarize(l), coherence: T.checkCoherence(world) };
  fs.mkdirSync(path.dirname(outWir), { recursive: true });
  fs.writeFileSync(outWir, JSON.stringify(world, null, 2) + "\n");
  fs.writeFileSync(outEir, JSON.stringify(eir, null, 2) + "\n");
  fs.writeFileSync(outReport, JSON.stringify(report, null, 2) + "\n");
}

function parseNodes(text) {
  const nodes = [];
  const re = /^\[node\s+([^\]]+)\]/gm;
  let m;
  while ((m = re.exec(text))) {
    const attrs = parseAttrs(m[1]);
    if (attrs.name && attrs.type) nodes.push({ name: attrs.name, type: attrs.type, parent: attrs.parent || null });
  }
  return nodes;
}
function parseAttrs(s) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(s))) out[m[1]] = m[2];
  return out;
}
function slug(s) { return String(s).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "node"; }
function usage() {
  console.error("usage: tscn-fragment-to-wir <scene.tscn> <out.wir.json> <out.eir.json> <out.report.json>");
  process.exit(2);
}

if (require.main === module) main(process.argv.slice(2));
module.exports = { parseNodes };
