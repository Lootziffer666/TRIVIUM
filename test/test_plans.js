"use strict";
// TIR plan format: deterministic toolchain plans with tool and evidence checks.
const assert = require("assert");
const path = require("path");
const C = require("../packages/trivium-contracts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

const ROOT = path.join(__dirname, "..");
const tools = C.loadToolRegistry(path.join(ROOT, "registry", "tools"));
const fixture = path.join(ROOT, "examples", "plans", "guard-unity-to-godot-sprite.plan.json");
function basePlan() { return C.loadPlanFile(fixture, tools); }
function mutablePlan() { return JSON.parse(JSON.stringify(basePlan())); }

t("fixture plan validates against the real tool registry", () => {
  const plan = basePlan();
  assert.strictEqual(plan.id, "guard-unity-to-godot-sprite");
  assert.strictEqual(plan.steps.length, 5);
});

t("plan route uses the thirteen-route vocabulary", () => {
  const plan = basePlan();
  assert.ok(C.PLAN_ROUTES.includes(plan.route));
  assert.strictEqual(C.PLAN_ROUTES.length, 13);
});

t("unknown tool is refused", () => {
  const plan = mutablePlan();
  plan.steps[0].tool = "missing-tool";
  assert.throws(() => C.loadPlan(plan, tools), /unknown tool/);
});

t("broken step chain is refused", () => {
  const plan = mutablePlan();
  plan.steps[1].inputs = ["work/not-produced"];
  assert.throws(() => C.loadPlan(plan, tools), /not produced/);
});

t("missing evidence contractRef is refused", () => {
  const plan = mutablePlan();
  delete plan.verify.contractRef;
  assert.throws(() => C.loadPlan(plan, tools), /verify\.contractRef/);
});

t("source contractRef is mandatory", () => {
  const plan = mutablePlan();
  delete plan.source.contractRef;
  assert.throws(() => C.loadPlan(plan, tools), /source\.contractRef/);
});

t("duplicate step ids are refused", () => {
  const plan = mutablePlan();
  plan.steps[1].id = plan.steps[0].id;
  assert.throws(() => C.loadPlan(plan, tools), /duplicate step id/);
});

t("loaded plans are frozen", () => {
  const plan = basePlan();
  assert.ok(Object.isFrozen(plan));
  assert.throws(() => { plan.id = "changed"; }, /read only|Cannot assign/);
});

console.log(`test_plans: ${n} passed`);
