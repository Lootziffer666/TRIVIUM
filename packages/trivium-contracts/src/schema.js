"use strict";

const CONTRACT_VERSION = "0.1.0";

const CONTRACT_KINDS = Object.freeze([
  "world", "asset", "function", "perception", "scene", "tool", "evidence",
]);

const COMMON_ARRAY_FIELDS = Object.freeze([
  "preserve", "project", "may_approximate", "must_not", "fallbacks", "verify",
]);

const KIND_FIELDS = Object.freeze({
  world: [],
  asset: ["role", "required", "optional", "acceptable_realizations"],
  function: ["inputs", "preconditions", "reads", "writes", "side_effects", "postconditions", "error_behavior"],
  perception: ["spatial_model", "primary_channels", "secondary_channels", "requirements", "visuals"],
  scene: ["runtime", "inputs", "outputs", "entry", "exit", "handoff"],
  tool: ["accepts", "produces", "capabilities", "unknown", "execution", "status"],
  evidence: ["checks", "artifacts"],
});

function validateContract(doc) {
  const errors = [];
  const add = (msg) => errors.push(msg);

  if (!isObject(doc)) return { ok: false, errors: ["contract: document object is required"] };

  if (doc.contractVersion !== CONTRACT_VERSION) add(`contract: contractVersion must be '${CONTRACT_VERSION}'`);
  if (!nonEmptyString(doc.id)) add("contract: id (non-empty string) is required");
  if (!nonEmptyString(doc.kind)) {
    add("contract: kind (non-empty string) is required");
  } else if (!CONTRACT_KINDS.includes(doc.kind)) {
    add(`contract ${doc.id || "<unknown>"}: unknown kind '${doc.kind}' — new contract kinds are added to CONTRACT_KINDS, never ad hoc`);
  }

  validateSource(doc, add);
  for (const field of COMMON_ARRAY_FIELDS) optionalStringArray(doc, field, add);

  if (CONTRACT_KINDS.includes(doc.kind)) validateKindFields(doc, add);

  return { ok: errors.length === 0, errors };
}

function loadContract(json) {
  const doc = typeof json === "string" ? JSON.parse(json) : clone(json);
  const normalized = normalizeContract(doc);
  const result = validateContract(normalized);
  if (!result.ok) throw new Error(`loadContract: ${result.errors.join("; ")}`);
  return deepFreeze(normalized);
}

function normalizeContract(doc) {
  if (!isObject(doc)) return doc;
  const out = clone(doc);
  if (out.kind === "tool" && out.status == null) out.status = "candidate";
  return out;
}

function validateSource(doc, add) {
  if (!isObject(doc.source)) {
    add(`contract ${doc.id || "<unknown>"}: source object is required`);
    return;
  }
  if (!nonEmptyString(doc.source.provenance)) {
    add(`contract ${doc.id || "<unknown>"}: source.provenance is required — provenance loss blocks production`);
  }
  if ((doc.kind === "asset" || doc.kind === "tool") && !nonEmptyString(doc.source.license)) {
    add(`contract ${doc.id || "<unknown>"}: source.license is required for ${doc.kind} contracts`);
  }
}

function validateKindFields(doc, add) {
  switch (doc.kind) {
    case "asset":
      requiredObject(doc, "role", add);
      requiredStringArray(doc, "required", add);
      optionalStringArray(doc, "optional", add);
      requiredStringArray(doc, "acceptable_realizations", add);
      break;
    case "function":
      for (const f of KIND_FIELDS.function) requiredStringArray(doc, f, add);
      break;
    case "perception":
      requiredString(doc, "spatial_model", add);
      requiredStringArray(doc, "primary_channels", add);
      optionalStringArray(doc, "secondary_channels", add);
      requiredStringArray(doc, "requirements", add);
      requiredObject(doc, "visuals", add);
      break;
    case "scene":
      requiredString(doc, "runtime", add);
      requiredStringArray(doc, "inputs", add);
      requiredStringArray(doc, "outputs", add);
      requiredObject(doc, "entry", add);
      requiredObject(doc, "exit", add);
      requiredObject(doc, "handoff", add);
      break;
    case "tool":
      requiredStringArray(doc, "accepts", add);
      requiredStringArray(doc, "produces", add);
      requiredStringArray(doc, "capabilities", add);
      optionalStringArray(doc, "unknown", add);
      requiredObject(doc, "execution", add);
      if (!nonEmptyString(doc.status)) add(`contract ${doc.id}: status is required`);
      else if (!["candidate", "verified", "rejected", "superseded"].includes(doc.status)) add(`contract ${doc.id}: unknown tool status '${doc.status}'`);
      if (doc.status === "verified" && !nonEmptyString(doc.evidence)) add(`contract ${doc.id}: verified tool contracts require evidence`);
      break;
    case "evidence":
      requiredStringArray(doc, "checks", add);
      requiredStringArray(doc, "artifacts", add);
      break;
  }
}

function requiredString(doc, field, add) { if (!nonEmptyString(doc[field])) add(`contract ${doc.id || "<unknown>"}: ${field} (non-empty string) is required`); }
function requiredObject(doc, field, add) { if (!isObject(doc[field])) add(`contract ${doc.id || "<unknown>"}: ${field} object is required`); }
function requiredStringArray(doc, field, add) { if (!Array.isArray(doc[field]) || doc[field].some((x) => !nonEmptyString(x))) add(`contract ${doc.id || "<unknown>"}: ${field}[] of non-empty strings is required`); }
function optionalStringArray(doc, field, add) { if (doc[field] != null) requiredStringArray(doc, field, add); }
function nonEmptyString(x) { return typeof x === "string" && x.trim().length > 0; }
function isObject(x) { return x && typeof x === "object" && !Array.isArray(x); }
function clone(x) { return JSON.parse(JSON.stringify(x)); }
function deepFreeze(obj) { if (isObject(obj) || Array.isArray(obj)) { Object.freeze(obj); for (const v of Object.values(obj)) deepFreeze(v); } return obj; }

module.exports = { CONTRACT_VERSION, CONTRACT_KINDS, COMMON_ARRAY_FIELDS, KIND_FIELDS, validateContract, loadContract };
