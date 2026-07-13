"use strict";

const fs = require("fs");
const path = require("path");
const { validatePlan } = require("../trivium-contracts");
const { resolveBellowsConfig, callBellows } = require("./bellows-client");

const MODULE_VERSION = "0.2.0";
const REQUEST_VERSION = "1.0.0";
const BUNDLE_VERSION = "1.0.0";
const SOURCE_KINDS = Object.freeze(["archive", "binary", "directory", "image-set", "video", "capture"]);
const MODES = Object.freeze(["faithful-remaster", "semantic-remake", "study"]);

function validateRequest(value) {
  const errors = [];
  const add = (message) => errors.push(message);
  if (!isObject(value)) return { ok: false, errors: ["request: object is required"] };
  if (value.schemaVersion !== REQUEST_VERSION) add(`request: schemaVersion must be '${REQUEST_VERSION}'`);
  if (!nonEmptyString(value.id)) add("request: id is required");
  if (!isObject(value.source)) add("request: source object is required");
  else {
    if (!SOURCE_KINDS.includes(value.source.kind)) add(`request: source.kind must be one of ${SOURCE_KINDS.join(", ")}`);
    if (!nonEmptyString(value.source.path)) add("request: source.path is required");
    if (value.source.ownershipConfirmed !== true) add("request: source.ownershipConfirmed must be true");
    if (!nonEmptyString(value.source.provenance)) add("request: source.provenance is required");
    if (value.source.manifestPath !== undefined && !nonEmptyString(value.source.manifestPath)) add("request: source.manifestPath must be a non-empty string");
    if (value.source.formatHint !== undefined && !nonEmptyString(value.source.formatHint)) add("request: source.formatHint must be a non-empty string");
  }
  if (value.ai !== undefined) {
    if (!isObject(value.ai)) add("request: ai must be an object");
    else {
      if (value.ai.gateway !== undefined && value.ai.gateway !== "bellows") add("request: ai.gateway must be bellows");
      for (const field of ["baseUrlEnv", "apiKeyEnv", "modelEnv"]) {
        if (value.ai[field] !== undefined && !nonEmptyString(value.ai[field])) add(`request: ai.${field} must be a non-empty string`);
      }
    }
  }
  if (!isObject(value.intent)) add("request: intent object is required");
  else {
    if (value.intent.target !== "shaded") add("request: LAB v0.2 currently supports intent.target='shaded'");
    if (!MODES.includes(value.intent.mode)) add(`request: intent.mode must be one of ${MODES.join(", ")}`);
    if (!Array.isArray(value.intent.preserve) || value.intent.preserve.some((x) => !nonEmptyString(x))) {
      add("request: intent.preserve must be an array of non-empty strings");
    }
  }
  return { ok: errors.length === 0, errors };
}

function normalizeRequest(input) {
  const result = validateRequest(input);
  if (!result.ok) throw new Error(result.errors.join("; "));
  const request = clone(input);
  request.title = request.title || request.id;
  request.ai = {
    gateway: "bellows",
    baseUrlEnv: "BELLOWS_BASE_URL",
    apiKeyEnv: "BELLOWS_API_KEY",
    modelEnv: "BELLOWS_MODEL",
    endpointPath: "/v1/chat/completions",
    requiredForModelCalls: true,
    ...(request.ai || {}),
  };
  request.options = request.options || {};
  request.options.extraction = {
    assets: true,
    behavior: true,
    audio: true,
    ...(request.options.extraction || {}),
  };
  request.options.actors = {
    enabled: true,
    width: 64,
    height: 64,
    colors: 16,
    fps: 12,
    smartCrop: true,
    autoScale: true,
    backgroundRemoval: "none",
    baselineNormalization: false,
    strictCapabilities: true,
    ...(request.options.actors || {}),
  };
  request.options.world = {
    act: "tag",
    params: {},
    freezeTime: true,
    ...(request.options.world || {}),
  };
  request.options.wizard = {
    resolveMissing: true,
    registerExtracted: true,
    registerGenerated: true,
    ...(request.options.wizard || {}),
  };
  return request;
}

function buildPlan(input) {
  const request = normalizeRequest(input);
  const prefix = `lab.${request.id}`;
  const plan = {
    planVersion: "0.1.0",
    id: `${prefix}.plan`,
    route: "reconstruct",
    source: {
      artifact: "sourceArtifact",
      contractRef: `${prefix}.source-contract`,
    },
    target: {
      runtime: "shaded",
      form: "interactive-2.5d-adventure-scene",
    },
    steps: [
      {
        id: "extract-evidence",
        tool: "decompile.legacy-evidence.v1",
        script: "DECOMPILE:lab.extract",
        inputs: ["sourceArtifact"],
        produces: ["evidenceGraph", "assetInventory", "behaviorObservations", "uncertaintyLedger"],
      },
      {
        id: "reconstruct-meaning",
        tool: "trivium.semantic-reconstruction.v1",
        script: "TRIVIUM:lab.reconstruct",
        inputs: ["evidenceGraph", "assetInventory", "behaviorObservations", "uncertaintyLedger"],
        produces: ["worldIR", "realizationContracts", "lossGainLedger", "assetNeeds"],
      },
      {
        id: "resolve-assets",
        tool: "wizard.asset-resolution.v1",
        script: "WIZARD:lab.resolve",
        inputs: ["assetInventory", "assetNeeds", "realizationContracts"],
        produces: ["assetBindings", "missingAssets", "productionBrief"],
      },
      {
        id: "realize-actors",
        tool: "swift.actor-realization.v1",
        script: "python integrations/lab_adapter.py",
        inputs: ["assetBindings", "behaviorObservations"],
        produces: ["actorSheets", "actorManifests", "actorEvidence"],
      },
      {
        id: "realize-scene",
        tool: "shaded.scene-realization.v1",
        script: "SHADED_LAB.apply",
        inputs: ["worldIR", "assetBindings", "actorSheets", "actorManifests", "realizationContracts"],
        produces: ["shadedSceneBundle", "runtimeHandles"],
      },
    ],
    verify: { contractRef: `${prefix}.evidence-contract` },
    fallbacks: [
      "retain uncertain behavior as needs_human_review",
      "use extracted assets without enhancement",
      "omit actors that cannot be realized without inventing motion",
    ],
  };
  const validation = validatePlan(plan);
  if (!validation.ok) throw new Error(`LAB generated invalid TRIVIUM plan: ${validation.errors.join("; ")}`);
  return plan;
}

function createHandoffs(input) {
  const request = normalizeRequest(input);
  const common = {
    schemaVersion: BUNDLE_VERSION,
    module: "trivium-lab",
    moduleVersion: MODULE_VERSION,
    jobId: request.id,
    title: request.title,
    provenance: request.source.provenance,
    aiGateway: request.ai,
  };
  return {
    decompile: {
      ...common,
      action: "extract-legacy-evidence",
      source: request.source,
      requestedEvidence: request.options.extraction,
      expectedOutputs: ["evidenceGraph", "assetInventory", "behaviorObservations", "uncertaintyLedger"],
    },
    trivium: {
      ...common,
      action: "reconstruct-semantic-world",
      inputs: {
        evidenceGraph: "decompile/evidence-graph.json",
        assetInventory: "decompile/asset-inventory.json",
        behaviorObservations: "decompile/behavior-observations.json",
        uncertaintyLedger: "decompile/uncertainty-ledger.json",
      },
      intent: request.intent,
      expectedOutputs: ["worldIR", "realizationContracts", "lossGainLedger", "assetNeeds"],
    },
    wizard: {
      ...common,
      action: "resolve-and-register-assets",
      inputs: {
        assetInventory: "decompile/asset-inventory.json",
        assetNeeds: "trivium/asset-needs.json",
        realizationContracts: "trivium/contracts/",
      },
      options: request.options.wizard,
      expectedOutputs: ["assetBindings", "missingAssets", "productionBrief"],
    },
    swift: {
      ...common,
      action: "plan-actor-jobs",
      inputs: {
        assetBindings: "wizard/asset-bindings.json",
        behaviorObservations: "decompile/behavior-observations.json",
      },
      options: request.options.actors,
      jobContract: {
        schemaVersion: BUNDLE_VERSION,
        module: "trivium-lab",
        action: "realize-actor",
        requiredFields: ["job.kind", "job.source", "job.output"],
      },
      expectedOutputs: ["actorSheets", "actorManifests", "actorEvidence"],
    },
    shaded: {
      ...common,
      action: "realize-scene",
      precondition: "The background image/material correction/depth inputs are already loaded in SHADED.",
      inputs: {
        worldIR: "trivium/world.wir.json",
        assetBindings: "wizard/asset-bindings.json",
        actorSheets: "swift/",
        actorManifests: "swift/",
      },
      scene: request.options.world,
      expectedOutputs: ["runtimeHandles", "visualEvidence"],
    },
  };
}

function buildBundle(input) {
  const request = normalizeRequest(input);
  return {
    schemaVersion: BUNDLE_VERSION,
    module: "trivium-lab",
    moduleVersion: MODULE_VERSION,
    request,
    plan: buildPlan(request),
    handoffs: createHandoffs(request),
    invariants: [
      "extracted syntax is evidence, never source truth",
      "uncertainty is preserved and never silently guessed",
      "SWIFT actors remain presentation-only in SHADED",
      "SHADED material truth comes from the background scene, not actors",
      "ownership or authorization must be confirmed before extraction",
      "all LLM/provider calls use BELLOWS; tools never call providers directly",
      "local deterministic runtimes such as rembg/ONNX remain local and are not routed through a chat gateway",
      "BELLOWS credentials are referenced by environment-variable names and never written into bundles",
    ],
  };
}

function writeBundle(input, outputDir) {
  const bundle = buildBundle(input);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "lab-bundle.json"), JSON.stringify(bundle, null, 2));
  fs.writeFileSync(path.join(outputDir, "plan.json"), JSON.stringify(bundle.plan, null, 2));
  const handoffDir = path.join(outputDir, "handoffs");
  fs.mkdirSync(handoffDir, { recursive: true });
  for (const [name, doc] of Object.entries(bundle.handoffs)) {
    fs.writeFileSync(path.join(handoffDir, `${name}.request.json`), JSON.stringify(doc, null, 2));
  }
  return bundle;
}

function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function isObject(value) { return value && typeof value === "object" && !Array.isArray(value); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

module.exports = {
  MODULE_VERSION,
  REQUEST_VERSION,
  BUNDLE_VERSION,
  SOURCE_KINDS,
  MODES,
  resolveBellowsConfig,
  callBellows,
  validateRequest,
  normalizeRequest,
  buildPlan,
  createHandoffs,
  buildBundle,
  writeBundle,
};
