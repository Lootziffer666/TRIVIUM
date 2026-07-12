"use strict";
// WIR builders: validation, intent axis law, concept flattening.
const assert = require("assert");
const T = require("../packages/trivium-core");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

t("createWorld requires id", () => {
  assert.throws(() => T.createWorld({}), /meta\.id/);
});

t("unknown entity kind is refused", () => {
  const w = T.createWorld({ id: "x" });
  assert.throws(() => T.addEntity(w, { id: "e", kind: "spaceship" }), /unknown kind/);
});

t("unknown relation type is refused", () => {
  const w = T.createWorld({ id: "x" });
  assert.throws(() => T.addRelation(w, { id: "r", type: "teleports", from: "a", to: "b" }), /unknown type/);
});

t("intent axes are a closed canon — no ad-hoc meanings", () => {
  const w = T.createWorld({ id: "x" });
  assert.throws(() => T.addMoment(w, { id: "m", intents: { u_rain: 0.5 } }), /unknown intent axis/);
});

t("intent values must be 0..1", () => {
  const w = T.createWorld({ id: "x" });
  assert.throws(() => T.addMoment(w, { id: "m", intents: { wind: 1.5 } }), /0\.\.1/);
});

t("gated rules carry onFail through the builder", () => {
  const w = T.createWorld({ id: "x" });
  T.addState(w, { id: "s1" });
  T.addRule(w, {
    id: "r1", when: { trigger: "try", conditions: [{ state: "s1", gte: 1 }] },
    then: [{ set: "s1", add: 1 }], onFail: [{ hint: "not yet" }],
  });
  assert.strictEqual(w.logic.rules[0].onFail.length, 1);
});

t("conceptsOf flattens all three strata with stable ids", () => {
  const { build } = require("../examples/dorf-sturmnacht");
  const w = build();
  const c = T.conceptsOf(w);
  const ids = new Set(c.map((x) => x.id));
  assert.ok(ids.has("grammar.entity.waechterin"));
  assert.ok(ids.has("rhetoric.intent.sturmnacht.turbulence"));
  assert.ok(ids.has("logic.rule.laterne_auffindbar"));
  assert.ok(ids.has("rhetoric.arc"));
  const kinds = new Set(c.map((x) => x.kind));
  assert.ok(kinds.has("grammar.space.2.5d"));
  assert.ok(kinds.has("logic.state.hidden"));
});

t("fromJSON round-trips a world losslessly", () => {
  const { build } = require("../examples/dorf-sturmnacht");
  const w = build();
  const w2 = T.fromJSON(JSON.stringify(w));
  assert.deepStrictEqual(w2, w);
});

t("fromJSON enforces the same laws as the builders", () => {
  assert.throws(() => T.fromJSON({ meta: { id: "x" }, rhetoric: { moments: [{ id: "m", intents: { u_rain: 0.5 } }] } }), /unknown intent axis/);
  assert.throws(() => T.fromJSON({ wirVersion: "0.1.0", meta: { id: "x" } }), /refuse/);
});

console.log(`test_wir: ${n} passed`);
