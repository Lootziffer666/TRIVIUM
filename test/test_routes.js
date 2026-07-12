"use strict";
// Realization routes: mandatory evidence fields at ledger and registry level.
const assert = require("assert");
const { ROUTES, LOSSY_ROUTES, CONTRACT_ROUTES, createLedger, record, summarize } = require("../packages/trivium-core/src/ledger");
const { createRegistry } = require("../packages/trivium-core/src/registry");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

function event(route, extra = {}) {
  return { conceptId: `c.${route}`, kind: "test.kind", route, ruleId: "TEST", reason: "route test", ...extra };
}
function adapter(route, cap = {}) {
  return {
    name: `a_${route}_${Math.random()}`,
    engine: "test target",
    dialect: "test",
    capabilities: { "test.kind": { route, via: "x", ...cap } },
    gains: ["test gain"],
    realize() { return []; },
  };
}

for (const route of [ROUTES.RECONSTRUCT, ROUTES.NORMALIZE, ROUTES.PROJECT, ROUTES.FEDERATE]) {
  t(`${route}: ledger accepts non-empty contractRef`, () => {
    const l = createLedger("w", "t");
    const ev = record(l, event(route, { contractRef: `contracts/${route}.contract.json` }));
    assert.strictEqual(ev.contractRef, `contracts/${route}.contract.json`);
  });
  t(`${route}: contractRef is mandatory in ledger and registry`, () => {
    assert.throws(() => record(createLedger("w", "t"), event(route)), /contractRef/);
    assert.throws(() => createRegistry().register(adapter(route)), /contractRef/);
  });
}

for (const route of [ROUTES.BAKE, ROUTES.DEGRADE]) {
  t(`${route}: ledger and registry accept declared loss`, () => {
    const l = createLedger("w", "t");
    record(l, event(route, { loss: `${route} loses dynamics` }));
    assert.strictEqual(l.losses.length, 1);
    createRegistry().register(adapter(route, { loss: `${route} loses dynamics` }));
  });
  t(`${route}: loss is mandatory in ledger and registry`, () => {
    assert.throws(() => record(createLedger("w", "t"), event(route)), /loss description/);
    assert.throws(() => createRegistry().register(adapter(route)), /declares no loss/);
  });
}

t("enrich: ledger and registry accept declared gain", () => {
  const l = createLedger("w", "t");
  record(l, event(ROUTES.ENRICH, { gain: "adds observability" }));
  assert.strictEqual(l.gains.length, 1);
  createRegistry().register(adapter(ROUTES.ENRICH, { gain: "adds observability" }));
});

t("enrich: gain is mandatory in ledger and registry", () => {
  assert.throws(() => record(createLedger("w", "t"), event(ROUTES.ENRICH)), /gain description/);
  assert.throws(() => createRegistry().register(adapter(ROUTES.ENRICH)), /declares no gain/);
});

t("route vocabulary has thirteen routes and exports enforcement sets", () => {
  assert.strictEqual(Object.values(ROUTES).length, 13);
  assert.ok(LOSSY_ROUTES.has(ROUTES.BAKE));
  assert.ok(LOSSY_ROUTES.has(ROUTES.DEGRADE));
  assert.ok(CONTRACT_ROUTES.has(ROUTES.RECONSTRUCT));
  assert.ok(CONTRACT_ROUTES.has(ROUTES.FEDERATE));
});

t("new realization routes count as realized for fidelity", () => {
  const l = createLedger("w", "t");
  for (const route of [ROUTES.RECONSTRUCT, ROUTES.NORMALIZE, ROUTES.BAKE, ROUTES.PROJECT, ROUTES.DEGRADE, ROUTES.ENRICH, ROUTES.FEDERATE]) {
    const extra = CONTRACT_ROUTES.has(route) ? { contractRef: `contracts/${route}.contract.json` }
      : route === ROUTES.ENRICH ? { gain: "new affordance" }
      : { loss: "documented loss" };
    record(l, event(route, extra));
  }
  record(l, event(ROUTES.PRESERVE, { loss: "inert" }));
  record(l, event(ROUTES.UNKNOWN));
  assert.strictEqual(summarize(l).fidelity, 0.778);
});

console.log(`test_routes: ${n} passed`);
