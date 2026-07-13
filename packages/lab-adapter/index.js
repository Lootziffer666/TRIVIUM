"use strict";

const { validatePlan } = require("../trivium-contracts");

const LAB_MODULE_ID = "trivium-lab";
const LAB_SCHEMA_VERSION = "1.0.0";
const CANONICAL_REPOSITORY = "Lootziffer666/LAB";

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function validateLabHandoff(value) {
  const errors = [];
  if (!isObject(value)) return { ok: false, errors: ["LAB handoff object is required"] };
  if (value.schemaVersion !== LAB_SCHEMA_VERSION) errors.push(`schemaVersion must be ${LAB_SCHEMA_VERSION}`);
  if (value.module !== LAB_MODULE_ID) errors.push(`module must be ${LAB_MODULE_ID}`);
  if (value.action !== "reconstruct-semantic-world") errors.push("action must be reconstruct-semantic-world");
  if (!nonEmptyString(value.jobId)) errors.push("jobId is required");
  if (!isObject(value.inputs)) errors.push("inputs object is required");
  else {
    for (const field of ["evidenceGraph", "assetInventory", "behaviorObservations", "uncertaintyLedger"]) {
      if (!nonEmptyString(value.inputs[field])) errors.push(`inputs.${field} is required`);
    }
  }
  if (!isObject(value.intent)) errors.push("intent object is required");
  if (!isObject(value.aiGateway) || value.aiGateway.gateway !== "bellows") {
    errors.push("aiGateway.gateway must be bellows");
  }
  return { ok: errors.length === 0, errors };
}

function acceptLabHandoff(value) {
  const validation = validateLabHandoff(value);
  if (!validation.ok) throw new Error(`Invalid LAB→TRIVIUM handoff: ${validation.errors.join("; ")}`);
  return Object.freeze(JSON.parse(JSON.stringify(value)));
}

function validateLabPlan(plan, toolRegistry) {
  const validation = validatePlan(plan, toolRegistry);
  const errors = [...validation.errors];
  if (plan?.route !== "reconstruct") errors.push("LAB plans must use route='reconstruct'");
  return { ok: errors.length === 0, errors };
}

module.exports = {
  LAB_MODULE_ID,
  LAB_SCHEMA_VERSION,
  CANONICAL_REPOSITORY,
  validateLabHandoff,
  acceptLabHandoff,
  validateLabPlan,
};
