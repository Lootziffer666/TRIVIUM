#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { ROUTES, createLedger, record, summarize } = require("../../packages/trivium-core/src/ledger");
const [atlasJson, tresOut, reportOut] = process.argv.slice(2);
if (!atlasJson || !tresOut || !reportOut) { console.error("usage: godot-sprite-resource <atlas.json> <out.tres> <report.json>"); process.exit(1); }
const atlas = JSON.parse(fs.readFileSync(atlasJson, "utf8"));
fs.mkdirSync(path.dirname(tresOut), { recursive: true });
fs.writeFileSync(tresOut, `[gd_resource type="SpriteFrames" format=3]\n[resource]\nanimations = [{"name":"idle","frames":${atlas.frameCount}}]\n`);
const ledger = createLedger("guard-fixture", "godot-sprite");
record(ledger, { conceptId: "asset.guard.animation", kind: "asset.animation.3d", route: ROUTES.BAKE, ruleId: "TRV-C2-BAKE-FRAMES", reason: "bake procedural guard orientation into fixed 2D frames", loss: "dynamics: continuous 3D pose and rotation reduced to eight static directional frames", gain: "performance: no skeletal runtime required", via: "trivium.render-eight-direction" });
record(ledger, { conceptId: "asset.guard.presentation", kind: "asset.mesh.glb", route: ROUTES.PROJECT, ruleId: "TRV-C2-PROJECT-SPRITE", reason: "project normalized 3D guard into 2D sprite atlas", contractRef: "examples/contracts/actor.guard.asset.contract.json", gain: "portability: PNG atlas plus JSON metadata", via: "trivium.atlas-pack" });
const summary = summarize(ledger);
const report = { atlas, tres: tresOut, ledger, summary, byRoute: summary.byRoute, losses: ledger.losses, gains: ledger.gains, manualRestaufwand: ["True silhouette scoring remains manual/research; automated check proves non-empty consistent bounding boxes."] };
fs.writeFileSync(reportOut, JSON.stringify(report, null, 2) + "\n");
console.log(tresOut);
