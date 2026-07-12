"use strict";
// Code-Esperanto lemma corpus: semantic IDs, function contracts, idioms, tests.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const C = require("../packages/trivium-contracts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

const DIR = path.join(__dirname, "..", "corpus", "lemmata");

t("corpus contains the five proof lemmata", () => {
  const corpus = C.loadLemmaCorpus(DIR);
  for (const id of ["passage.make_traversable", "door.deactivate", "state.persist_across_scene", "interaction.gated_by_hidden_state", "trigger.zone_enter"]) assert.ok(corpus.has(id), id);
  assert.strictEqual(corpus.size, 5);
});

t("each lemma has at least three idioms and two abstract tests", () => {
  for (const lemma of C.loadLemmaCorpus(DIR).values()) {
    assert.ok(Object.keys(lemma.idioms).length >= 3, lemma.id);
    assert.ok(lemma.tests.length >= 2, lemma.id);
  }
});

t("embedded contracts are valid function contracts", () => {
  for (const lemma of C.loadLemmaCorpus(DIR).values()) assert.strictEqual(lemma.contract.kind, "function", lemma.id);
});

t("idiom confidence is bounded", () => {
  for (const lemma of C.loadLemmaCorpus(DIR).values()) for (const idiom of Object.values(lemma.idioms)) assert.ok(idiom.confidence >= 0 && idiom.confidence <= 1);
});

t("unknown lemma version is refused", () => {
  assert.throws(() => C.loadLemma({ lemmaVersion: "9", id: "x", intent: "x", contract: "contracts/x", idioms: {}, tests: [] }), /lemmaVersion/);
});

t("embedded non-function contract is refused", () => {
  const lemma = JSON.parse(fs.readFileSync(path.join(DIR, "door.deactivate.lemma.json"), "utf8"));
  lemma.contract.kind = "asset";
  assert.throws(() => C.loadLemma(lemma), /kind 'function'/);
});

t("lemma ids stay semantic and engine-free", () => {
  for (const lemma of C.loadLemmaCorpus(DIR).values()) assert.ok(!/(unity|unreal|godot|collider|actor|node)/i.test(lemma.id), lemma.id);
});

t("loaded lemmata are frozen", () => {
  const lemma = C.loadLemmaCorpus(DIR).get("passage.make_traversable");
  assert.ok(Object.isFrozen(lemma));
  assert.throws(() => { lemma.id = "changed"; }, /read only|Cannot assign/);
});

console.log(`test_corpus: ${n} passed`);
