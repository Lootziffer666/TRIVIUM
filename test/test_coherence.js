"use strict";
// Coherence engine: consistency, coherence, replayability (adult_game lineage).
const assert = require("assert");
const T = require("../packages/trivium-core");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function baseWorld() {
  const w = T.createWorld({ id: "c" });
  T.addEntity(w, { id: "a", kind: "place" });
  T.addEntity(w, { id: "b", kind: "character" });
  return w;
}

t("dangling relation endpoint is an error", () => {
  const w = baseWorld();
  T.addRelation(w, { id: "r", type: "knows", from: "b", to: "ghost" });
  const c = T.checkCoherence(w);
  assert.strictEqual(c.consistent, false);
  assert.ok(c.issues.some((i) => i.code === "REL_DANGLING"));
});

t("rule referencing unknown state is an error", () => {
  const w = baseWorld();
  T.addRule(w, { id: "r1", when: { trigger: "t", conditions: [{ state: "nope", gte: 1 }] }, then: [], onFail: [{ hint: "x" }] });
  const c = T.checkCoherence(w);
  assert.ok(c.issues.some((i) => i.code === "RULE_COND_DANGLING"));
});

t("conflicting exclusive rules are an error", () => {
  const w = baseWorld();
  T.addRule(w, { id: "r1", when: { trigger: "t" }, then: [{ hint: "a" }], exclusiveGroup: "g", priority: 0 });
  T.addRule(w, { id: "r2", when: { trigger: "t" }, then: [{ hint: "b" }], exclusiveGroup: "g", priority: 0 });
  const c = T.checkCoherence(w);
  assert.ok(c.issues.some((i) => i.code === "RULE_EXCLUSIVE_CONFLICT"));
});

t("unreachable machine state is a warning, not an error", () => {
  const w = baseWorld();
  T.addMachine(w, { id: "m", states: ["x", "y", "z"], initial: "x", transitions: [{ from: "x", to: "y", on: "go" }] });
  const c = T.checkCoherence(w);
  assert.strictEqual(c.consistent, true);
  assert.ok(c.issues.some((i) => i.code === "MACHINE_UNREACHABLE" && i.severity === "warn"));
});

t("chore-loop risk: gated rule without onFail warns", () => {
  const w = baseWorld();
  T.addState(w, { id: "s" });
  T.addRule(w, { id: "r1", when: { trigger: "t", conditions: [{ state: "s", gte: 1 }] }, then: [{ hint: "win" }] });
  const c = T.checkCoherence(w);
  assert.ok(c.issues.some((i) => i.code === "CHORE_LOOP_RISK"));
  assert.strictEqual(c.replayability.learnability, 0);
});

t("hidden state without memory layer warns (unreadable world)", () => {
  const w = baseWorld();
  T.addState(w, { id: "s", visibility: "hidden" });
  const c = T.checkCoherence(w);
  assert.ok(c.issues.some((i) => i.code === "UNREADABLE_WORLD"));
});

t("dorf-sturmnacht is consistent and replayable", () => {
  const { build } = require("../examples/dorf-sturmnacht");
  const c = T.checkCoherence(build());
  assert.strictEqual(c.consistent, true, JSON.stringify(c.issues));
  assert.ok(c.replayability.hiddenReactivity >= 2, "rules must read hidden state");
  assert.strictEqual(c.replayability.learnability, 1, "every gated rule teaches on failure");
});

console.log(`test_coherence: ${n} passed`);
