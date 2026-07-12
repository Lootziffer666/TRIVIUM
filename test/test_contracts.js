"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const C = require("../packages/trivium-contracts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function base(kind, extra = {}) {
  return { contractVersion: "0.1.0", id: `${kind}.ok`, kind, source: { provenance: "test" }, ...extra };
}
function ok(doc) { assert.strictEqual(C.validateContract(doc).ok, true, C.validateContract(doc).errors.join("; ")); }
function bad(doc, re) { assert.throws(() => C.loadContract(doc), re); }

t("world contract validates common schema", () => ok(base("world", { preserve: ["meaning"], project: ["geometry"] })));
t("asset contract validates role and realization obligations", () => ok(base("asset", { source: { provenance: "test", license: "free" }, role: { semantic: "guard" }, required: ["idle"], optional: ["cloth"], acceptable_realizations: ["sprite"] })));
t("function contract validates data-flow fields", () => ok(base("function", { inputs: ["door"], preconditions: ["exists"], reads: ["a"], writes: ["b"], side_effects: ["emit"], postconditions: ["done"], error_behavior: ["report"] })));
t("perception contract validates channel fields", () => ok(base("perception", { spatial_model: "3d", primary_channels: ["audio"], secondary_channels: ["haptic"], requirements: ["readable"], visuals: { required: false } })));
t("scene contract validates federation boundary", () => ok(base("scene", { runtime: "external", inputs: ["player.health"], outputs: ["world.state"], entry: { semantic_anchor: "in" }, exit: { semantic_anchor: "out" }, handoff: { format: "trivium-world-state-v1" } })));
t("tool contract accepts first-class unknowns and defaults to candidate", () => { const c = C.loadContract(base("tool", { source: { provenance: "test", license: "unknown" }, accepts: ["gltf"], produces: ["png.frames"], capabilities: ["render"], unknown: ["collision_export"], execution: { headless: "unknown" } })); assert.strictEqual(c.status, "candidate"); });
t("evidence contract validates checks and artifacts", () => ok(base("evidence", { checks: ["silhouette"], artifacts: ["report.json"] })));

t("missing provenance is refused", () => bad({ contractVersion: "0.1.0", id: "x", kind: "world", source: {} }, /source\.provenance/));
t("asset contracts require source license", () => bad(base("asset", { role: {}, required: ["x"], acceptable_realizations: ["y"] }), /source\.license/));
t("tool contracts require source license", () => bad(base("tool", { accepts: ["x"], produces: ["y"], capabilities: ["z"], execution: {} }), /source\.license/));
t("contract kind canon is closed", () => bad(base("spell", {}), /unknown kind.*never ad hoc/));
t("verified tool contracts require evidence", () => bad(base("tool", { source: { provenance: "test", license: "unknown" }, accepts: ["x"], produces: ["y"], capabilities: ["z"], execution: {}, status: "verified" }), /verified.*evidence/));
t("common arrays contain only non-empty strings", () => bad(base("world", { preserve: [""] }), /preserve\[\]/));
t("loadContract freezes the accepted document", () => { const c = C.loadContract(base("world")); assert.ok(Object.isFrozen(c)); assert.throws(() => { c.id = "changed"; }, /read only|Cannot assign/); });
t("fixture contracts all validate", () => { const dir = path.join(__dirname, "..", "examples", "contracts"); for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".contract.json"))) C.loadContract(fs.readFileSync(path.join(dir, f), "utf8")); });
t("validateContract reports errors without throwing", () => { const r = C.validateContract({}); assert.strictEqual(r.ok, false); assert.ok(r.errors.length >= 3); });

console.log(`test_contracts: ${n} passed`);
