"use strict";
// Router: Stage 0–3 commitments (Manifold lineage).
const assert = require("assert");
const T = require("../packages/trivium-core");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function tinyAdapter(overrides = {}) {
  return Object.assign({
    name: "tiny",
    engine: "test target",
    dialect: "test",
    capabilities: {
      "grammar.entity.*": { route: "native", via: "node" },
      "rhetoric.moment": { route: "native", via: "step" },
      "rhetoric.intent.*": { route: "approximate", via: "value", loss: "test loss" },
      "rhetoric.arc": { route: "native", via: "list" },
    },
    gains: ["test gain"],
    realize(world, routed) {
      return [{ path: "out.txt", content: `${routed.length} concepts realized\n` }];
    },
  }, overrides);
}

function world() {
  const w = T.createWorld({ id: "wtest" });
  T.addEntity(w, { id: "e1", kind: "place" });
  T.addMoment(w, { id: "m1", intents: { wind: 0.5 } });
  T.setArc(w, ["m1"]);
  T.addState(w, { id: "s1", visibility: "visible" });
  return w;
}

t("Stage 0: refuses non-WIR input", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter());
  assert.throws(() => T.translate({ some: "json" }, "tiny", reg), /Stage 0/);
});

t("Stage 0: the source world is never mutated", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter({
    realize(w2) {
      assert.throws(() => { w2.meta.title = "hacked"; }, TypeError); // frozen
      return [];
    },
  }));
  const w = world();
  const before = JSON.stringify(w);
  T.translate(w, "tiny", reg);
  assert.strictEqual(JSON.stringify(w), before);
});

t("Stage 1: strict mode refuses an inconsistent world", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter());
  const w = world();
  T.addRelation(w, { id: "r", type: "knows", from: "e1", to: "ghost" });
  assert.throws(() => T.translate(w, "tiny", reg), /inconsistent/);
  // non-strict still runs, errors stay visible in the report
  const res = T.translate(w, "tiny", reg, { strict: false });
  assert.ok(res.report.includes("REL_DANGLING"));
});

t("Stage 2: unknown concepts abstain and demand human review", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter());
  const res = T.translate(world(), "tiny", reg);
  // logic.state.s1 has no capability → unknown
  const ev = res.ledger.events.find((e) => e.conceptId === "logic.state.s1");
  assert.strictEqual(ev.route, "unknown");
  assert.ok(res.summary.needsHumanReview);
  assert.ok(res.ledger.review.some((r) => r.conceptId === "logic.state.s1"));
});

t("Stage 2: adapters never receive UNKNOWN/PRESERVE concepts", () => {
  const reg = T.createRegistry();
  let seen = null;
  reg.register(tinyAdapter({
    realize(w2, routed) { seen = routed.map((c) => c.id); return []; },
  }));
  T.translate(world(), "tiny", reg);
  assert.ok(!seen.includes("logic.state.s1"));
  assert.ok(seen.includes("grammar.entity.e1"));
});

t("every routing decision is a ledger event with ruleId + reason", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter());
  const res = T.translate(world(), "tiny", reg);
  const concepts = T.conceptsOf(res.artifacts ? world() : world());
  assert.strictEqual(res.ledger.events.length, T.conceptsOf(world()).length);
  for (const ev of res.ledger.events) {
    assert.ok(ev.ruleId && ev.reason, `event ${ev.conceptId} lacks trace`);
  }
});

t("approximate routes must document loss (registry refuses otherwise)", () => {
  const reg = T.createRegistry();
  assert.throws(() => reg.register(tinyAdapter({
    capabilities: { "rhetoric.intent.*": { route: "approximate", via: "x" } },
  })), /declares no loss/);
});

t("the original WIR travels with every translation", () => {
  const reg = T.createRegistry();
  reg.register(tinyAdapter());
  const res = T.translate(world(), "tiny", reg);
  const orig = res.artifacts.find((a) => a.path === "wtest.wir.json");
  assert.ok(orig, "wir.json artifact missing");
  assert.strictEqual(JSON.parse(orig.content).meta.id, "wtest");
});

console.log(`test_router: ${n} passed`);
