"use strict";

const C = require("../../trivium-contracts");

function plan(sourceDesc, targetDesc, contracts, toolRegistry, opts = {}) {
  const source = normalizeEndpoint(sourceDesc, "source");
  const target = normalizeEndpoint(targetDesc, "target");
  const maxDepth = opts.maxDepth || 6;
  const edges = buildEdges(toolRegistry);
  const queue = [{ format: source.format, artifact: source.artifact || `source.${source.format}`, steps: [], seen: new Set([source.format]) }];
  const candidates = [];
  const needs = [];

  while (queue.length) {
    const state = queue.shift();
    if (state.steps.length >= maxDepth) continue;
    for (const edge of edges.filter((e) => e.accept === state.format)) {
      const stepId = `step_${state.steps.length + 1}_${safeId(edge.tool.id)}`;
      for (const out of edge.produces) {
        const producedArtifact = out === target.format ? target.artifact || `target.${out}` : `work/${state.steps.length + 1}.${out}`;
        const step = { id: stepId, tool: edge.tool.id, inputs: [state.artifact], produces: [producedArtifact] };
        const steps = [...state.steps, step];
        if (out === target.format) {
          candidates.push(makePlan(source, target, steps, opts));
        } else if (!state.seen.has(out)) {
          const seen = new Set(state.seen);
          seen.add(out);
          queue.push({ format: out, artifact: producedArtifact, steps, seen });
        }
      }
    }
  }

  if (!candidates.length) needs.push(`no tool path from '${source.format}' to '${target.format}' within depth ${maxDepth}`);

  const rankedPlans = candidates.map((tir) => ({ tir, cost: rankPlan(tir, toolRegistry) }))
    .sort(compareRanked)
    .map(({ tir, cost }, i) => ({ rank: i + 1, cost, plan: C.loadPlan(tir, toolRegistry) }));
  return { rankedPlans, needs_human_review: needs, contracts: contracts || [] };
}

function buildEdges(toolRegistry) {
  const edges = [];
  for (const tool of toolRegistry.values()) {
    for (const accept of tool.accepts || []) edges.push({ accept, produces: tool.produces || [], tool });
  }
  return edges.sort((a, b) => `${a.accept}:${a.tool.id}`.localeCompare(`${b.accept}:${b.tool.id}`));
}

function makePlan(source, target, steps, opts) {
  return {
    planVersion: C.PLAN_VERSION,
    id: opts.id || `plan-${safeId(source.format)}-to-${safeId(target.format)}-${steps.length}`,
    route: opts.route || inferRoute(source.format, target.format),
    source: { artifact: source.artifact || `source.${source.format}`, contractRef: source.contractRef || opts.sourceContractRef || "contracts/source.contract.json" },
    target: { runtime: target.runtime || target.format.split(".")[0] || "unknown", form: target.form || target.format },
    steps,
    verify: { contractRef: target.contractRef || opts.verifyContractRef || "contracts/target.evidence.contract.json" },
    fallbacks: opts.fallbacks || ["needs_human_review_if_candidate_chain_fails"],
  };
}

function rankPlan(tir, toolRegistry) {
  const components = { steps: tir.steps.length, knownLosses: 0, confidencePenalty: 0, headlessPenalty: 0, statusPenalty: 0, licenseFlags: [] };
  for (const step of tir.steps) {
    const tool = toolRegistry.get(step.tool);
    components.knownLosses += (tool.known_losses || []).length;
    components.confidencePenalty += 1 - (typeof tool.confidence === "number" ? tool.confidence : 0);
    if (tool.headless !== true) components.headlessPenalty += tool.headless === "partial" ? 0.5 : 1;
    if (tool.status !== "verified") components.statusPenalty += 1;
    if (tool.license === "unknown" || /gpl/i.test(tool.license)) components.licenseFlags.push(`${tool.id}:${tool.license}`);
  }
  const total = components.steps + components.knownLosses + components.confidencePenalty + components.headlessPenalty + components.statusPenalty;
  return { total: Math.round(total * 1000) / 1000, components };
}

function compareRanked(a, b) {
  if (a.cost.total !== b.cost.total) return a.cost.total - b.cost.total;
  return a.tir.steps.map((s) => s.tool).join("/").localeCompare(b.tir.steps.map((s) => s.tool).join("/"));
}

function inferRoute(from, to) {
  if (from === to) return "native";
  if (from.split(".")[0] !== to.split(".")[0]) return "project";
  return "normalize";
}

function normalizeEndpoint(desc, label) {
  if (typeof desc === "string") return { format: desc };
  if (!desc || typeof desc.format !== "string" || !desc.format) throw new Error(`planner: ${label}.format is required`);
  return desc;
}
function safeId(x) { return String(x).replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase(); }

module.exports = { plan, buildEdges, rankPlan };
