"use strict";

const fs = require("fs");

const PLAN_VERSION = "0.1.0";
const PLAN_ROUTES = Object.freeze([
  "native", "bridge", "approximate", "decompose", "reconstruct", "normalize",
  "bake", "project", "degrade", "enrich", "federate", "preserve", "unknown",
]);

function validatePlan(doc, toolRegistry) {
  const errors = [];
  const add = (msg) => errors.push(msg);
  if (!isObject(doc)) return { ok: false, errors: ["plan: document object is required"] };
  if (doc.planVersion !== PLAN_VERSION) add(`plan: planVersion must be '${PLAN_VERSION}'`);
  if (!nonEmptyString(doc.id)) add("plan: id (non-empty string) is required");
  if (!PLAN_ROUTES.includes(doc.route)) add(`plan ${doc.id || "<unknown>"}: route must be one of ${PLAN_ROUTES.join(", ")}`);
  validateSource(doc, add);
  validateTarget(doc, add);
  validateSteps(doc, toolRegistry, add);
  if (!isObject(doc.verify) || !nonEmptyString(doc.verify.contractRef)) add(`plan ${doc.id || "<unknown>"}: verify.contractRef is required`);
  if (doc.fallbacks != null) stringArray(doc.fallbacks, `plan ${doc.id || "<unknown>"}: fallbacks[]`, add, { allowEmpty: true });
  return { ok: errors.length === 0, errors };
}

function loadPlan(json, toolRegistry) {
  const doc = typeof json === "string" ? JSON.parse(json) : clone(json);
  const result = validatePlan(doc, toolRegistry);
  if (!result.ok) throw new Error(`loadPlan: ${result.errors.join("; ")}`);
  return deepFreeze(doc);
}

function loadPlanFile(file, toolRegistry) {
  return loadPlan(fs.readFileSync(file, "utf8"), toolRegistry);
}

function validateSource(doc, add) {
  if (!isObject(doc.source)) { add(`plan ${doc.id || "<unknown>"}: source object is required`); return; }
  if (!nonEmptyString(doc.source.artifact)) add(`plan ${doc.id || "<unknown>"}: source.artifact is required`);
  if (!nonEmptyString(doc.source.contractRef)) add(`plan ${doc.id || "<unknown>"}: source.contractRef is required`);
}

function validateTarget(doc, add) {
  if (!isObject(doc.target)) { add(`plan ${doc.id || "<unknown>"}: target object is required`); return; }
  if (!nonEmptyString(doc.target.runtime)) add(`plan ${doc.id || "<unknown>"}: target.runtime is required`);
  if (!nonEmptyString(doc.target.form)) add(`plan ${doc.id || "<unknown>"}: target.form is required`);
}

function validateSteps(doc, toolRegistry, add) {
  if (!Array.isArray(doc.steps) || doc.steps.length === 0) { add(`plan ${doc.id || "<unknown>"}: steps[] is required`); return; }
  const available = new Set();
  if (doc.source && nonEmptyString(doc.source.artifact)) available.add(doc.source.artifact);
  const ids = new Set();
  for (const [i, step] of doc.steps.entries()) {
    if (!isObject(step)) { add(`plan ${doc.id || "<unknown>"}: steps[${i}] must be an object`); continue; }
    if (!nonEmptyString(step.id)) add(`plan ${doc.id || "<unknown>"}: steps[${i}].id is required`);
    else if (ids.has(step.id)) add(`plan ${doc.id}: duplicate step id '${step.id}'`);
    else ids.add(step.id);
    if (!nonEmptyString(step.tool)) add(`plan ${doc.id || "<unknown>"}: steps[${i}].tool is required`);
    else if (toolRegistry && !toolRegistry.has(step.tool)) add(`plan ${doc.id || "<unknown>"}: step '${step.id || i}' references unknown tool '${step.tool}'`);
    if (step.script != null && !nonEmptyString(step.script)) add(`plan ${doc.id || "<unknown>"}: step '${step.id || i}'.script must be non-empty when present`);
    stringArray(step.inputs, `plan ${doc.id || "<unknown>"}: step '${step.id || i}'.inputs[]`, add);
    stringArray(step.produces, `plan ${doc.id || "<unknown>"}: step '${step.id || i}'.produces[]`, add);
    for (const input of step.inputs || []) if (!available.has(input)) add(`plan ${doc.id || "<unknown>"}: step '${step.id || i}' input '${input}' is not produced by source or an earlier step`);
    for (const produced of step.produces || []) available.add(produced);
  }
}

function stringArray(value, label, add, opts = {}) {
  if (!Array.isArray(value) || (!opts.allowEmpty && value.length === 0) || value.some((x) => !nonEmptyString(x))) add(`${label} of non-empty strings is required`);
}
function nonEmptyString(x) { return typeof x === "string" && x.trim().length > 0; }
function isObject(x) { return x && typeof x === "object" && !Array.isArray(x); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function deepFreeze(obj) { if (isObject(obj) || Array.isArray(obj)) { Object.freeze(obj); for (const v of Object.values(obj)) deepFreeze(v); } return obj; }

module.exports = { PLAN_VERSION, PLAN_ROUTES, validatePlan, loadPlan, loadPlanFile };
