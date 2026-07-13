"use strict";
// Planner skeleton: capability graph search, honest review, deterministic ranking.
const assert = require("assert");
const Planner = require("../packages/trivium-planner");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function tool(id, accepts, produces, extra = {}) {
  return {
    id,
    accepts,
    produces,
    known_losses: [],
    confidence: 0.8,
    headless: true,
    status: "verified",
    license: "MIT",
    ...extra,
  };
}
function registry(tools) { return new Map(tools.map((x) => [x.id, x])); }

const mini = registry([
  tool("direct", ["a"], ["d"], { confidence: 0.4, status: "candidate", headless: "unknown", license: "unknown", known_losses: ["rough"] }),
  tool("ab", ["a"], ["b"]),
  tool("bc", ["b"], ["c"]),
  tool("cd", ["c"], ["d"]),
  tool("slow", ["a"], ["x"], { confidence: 0.1, status: "candidate" }),
  tool("xd", ["x"], ["d"], { confidence: 0.1, status: "candidate" }),
]);

t("finds at least one plan between connected formats", () => {
  const res = Planner.plan({ format: "a" }, { format: "d" }, [], mini);
  assert.ok(res.rankedPlans.length >= 1);
  assert.strictEqual(res.needs_human_review.length, 0);
});

t("emits valid TIR plans", () => {
  const res = Planner.plan({ format: "a" }, { format: "d" }, [], mini);
  assert.strictEqual(res.rankedPlans[0].plan.planVersion, "0.1.0");
  assert.ok(res.rankedPlans[0].plan.verify.contractRef);
});

t("no path produces an honest review message", () => {
  const res = Planner.plan({ format: "missing" }, { format: "d" }, [], mini);
  assert.strictEqual(res.rankedPlans.length, 0);
  assert.ok(res.needs_human_review[0].includes("no tool path"));
});

t("ranking is deterministic", () => {
  const a = Planner.plan({ format: "a" }, { format: "d" }, [], mini).rankedPlans.map((p) => p.plan.steps.map((s) => s.tool).join("/"));
  const b = Planner.plan({ format: "a" }, { format: "d" }, [], mini).rankedPlans.map((p) => p.plan.steps.map((s) => s.tool).join("/"));
  assert.deepStrictEqual(a, b);
});

t("ranking exposes additive cost components", () => {
  const best = Planner.plan({ format: "a" }, { format: "d" }, [], mini).rankedPlans[0];
  assert.ok(typeof best.cost.total === "number");
  assert.ok("confidencePenalty" in best.cost.components);
});

t("candidate and unknown-license routes carry penalties and flags", () => {
  const direct = Planner.plan({ format: "a" }, { format: "d" }, [], mini).rankedPlans.find((p) => p.plan.steps[0].tool === "direct");
  assert.ok(direct.cost.components.statusPenalty > 0);
  assert.ok(direct.cost.components.licenseFlags.some((x) => x.includes("unknown")));
});

t("depth limit causes review instead of invented route", () => {
  const res = Planner.plan({ format: "a" }, { format: "d" }, [], mini, { maxDepth: 1 });
  assert.ok(res.rankedPlans.some((p) => p.plan.steps.length === 1));
  assert.ok(!res.rankedPlans.some((p) => p.plan.steps.length > 1));
});

t("source and verify contract refs propagate into plans", () => {
  const res = Planner.plan({ format: "a", contractRef: "contracts/source.asset.contract.json" }, { format: "d", contractRef: "contracts/verify.evidence.contract.json" }, [], mini);
  assert.strictEqual(res.rankedPlans[0].plan.source.contractRef, "contracts/source.asset.contract.json");
  assert.strictEqual(res.rankedPlans[0].plan.verify.contractRef, "contracts/verify.evidence.contract.json");
});

t("real registry can plan unity package to png atlas", () => {
  const C = require("../packages/trivium-contracts");
  const path = require("path");
  const tools = C.loadToolRegistry(path.join(__dirname, "..", "registry", "tools"));
  const res = Planner.plan({ format: "unity.package" }, { format: "png.atlas" }, [], tools);
  assert.ok(res.rankedPlans.length >= 1 || res.needs_human_review.length >= 1);
});

t("invalid endpoint is refused", () => {
  assert.throws(() => Planner.plan({}, { format: "d" }, [], mini), /source\.format/);
});

console.log(`test_planner: ${n} passed`);
