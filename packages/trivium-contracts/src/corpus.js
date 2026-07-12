"use strict";

const fs = require("fs");
const path = require("path");
const { validateContract, loadContract } = require("./schema");

const LEMMA_VERSION = "0.1.0";

function validateLemma(doc) {
  const errors = [];
  const add = (msg) => errors.push(msg);
  if (!isObject(doc)) return { ok: false, errors: ["lemma: document object is required"] };
  if (doc.lemmaVersion !== LEMMA_VERSION) add(`lemma: lemmaVersion must be '${LEMMA_VERSION}'`);
  if (!nonEmptyString(doc.id)) add("lemma: id (non-empty string) is required");
  if (!nonEmptyString(doc.intent)) add(`lemma ${doc.id || "<unknown>"}: intent is required`);
  validateContractRef(doc, add);
  validateIdioms(doc, add);
  validateTests(doc, add);
  return { ok: errors.length === 0, errors };
}

function loadLemma(json) {
  const doc = typeof json === "string" ? JSON.parse(json) : clone(json);
  const result = validateLemma(doc);
  if (!result.ok) throw new Error(`loadLemma: ${result.errors.join("; ")}`);
  return deepFreeze(doc);
}

function loadLemmaCorpus(dir) {
  const corpus = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".lemma.json")).sort()) {
    const lemma = loadLemma(fs.readFileSync(path.join(dir, file), "utf8"));
    if (corpus.has(lemma.id)) throw new Error(`lemma corpus: duplicate id '${lemma.id}'`);
    corpus.set(lemma.id, lemma);
  }
  return corpus;
}

function validateContractRef(doc, add) {
  if (!doc.contract) {
    add(`lemma ${doc.id || "<unknown>"}: contract is required`);
    return;
  }
  if (typeof doc.contract === "string") {
    if (!nonEmptyString(doc.contract)) add(`lemma ${doc.id || "<unknown>"}: contract reference must be non-empty`);
    return;
  }
  if (!isObject(doc.contract)) {
    add(`lemma ${doc.id || "<unknown>"}: contract must be an object or string reference`);
    return;
  }
  const result = validateContract(doc.contract);
  if (!result.ok) add(`lemma ${doc.id || "<unknown>"}: embedded contract invalid: ${result.errors.join("; ")}`);
  if (doc.contract.kind && doc.contract.kind !== "function") add(`lemma ${doc.id || "<unknown>"}: embedded contract must be kind 'function'`);
}

function validateIdioms(doc, add) {
  if (!isObject(doc.idioms) || Object.keys(doc.idioms).length < 3) {
    add(`lemma ${doc.id || "<unknown>"}: idioms{} with at least three target languages is required`);
    return;
  }
  for (const [target, idiom] of Object.entries(doc.idioms)) {
    if (!isObject(idiom)) { add(`lemma ${doc.id}: idiom '${target}' must be an object`); continue; }
    stringArray(idiom.constructs, `lemma ${doc.id}: idiom '${target}'.constructs[]`, add);
    if (!nonEmptyString(idiom.lifecycle)) add(`lemma ${doc.id}: idiom '${target}'.lifecycle is required`);
    if (!nonEmptyString(idiom.notes)) add(`lemma ${doc.id}: idiom '${target}'.notes is required`);
    optionalStringArray(idiom.losses, `lemma ${doc.id}: idiom '${target}'.losses[]`, add);
    optionalStringArray(idiom.gains, `lemma ${doc.id}: idiom '${target}'.gains[]`, add);
    if (typeof idiom.confidence !== "number" || idiom.confidence < 0 || idiom.confidence > 1) add(`lemma ${doc.id}: idiom '${target}'.confidence must be 0..1`);
  }
}

function validateTests(doc, add) {
  if (!Array.isArray(doc.tests) || doc.tests.length < 2) {
    add(`lemma ${doc.id || "<unknown>"}: at least two abstract tests are required`);
    return;
  }
  for (const [i, test] of doc.tests.entries()) {
    if (!isObject(test)) { add(`lemma ${doc.id}: tests[${i}] must be an object`); continue; }
    stringArray(test.given, `lemma ${doc.id}: tests[${i}].given[]`, add);
    stringArray(test.when, `lemma ${doc.id}: tests[${i}].when[]`, add);
    stringArray(test.then, `lemma ${doc.id}: tests[${i}].then[]`, add);
  }
}

function stringArray(value, label, add) { if (!Array.isArray(value) || value.length === 0 || value.some((x) => !nonEmptyString(x))) add(`${label} of non-empty strings is required`); }
function optionalStringArray(value, label, add) { if (value != null) stringArray(value, label, add); }
function nonEmptyString(x) { return typeof x === "string" && x.trim().length > 0; }
function isObject(x) { return x && typeof x === "object" && !Array.isArray(x); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function deepFreeze(obj) { if (isObject(obj) || Array.isArray(obj)) { Object.freeze(obj); for (const v of Object.values(obj)) deepFreeze(v); } return obj; }

module.exports = { LEMMA_VERSION, validateLemma, loadLemma, loadLemmaCorpus };
