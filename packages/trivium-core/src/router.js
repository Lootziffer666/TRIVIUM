/*!
 * TRIVIUM — Router (the compiler pipeline)
 *
 * Lineage: MANIFOLD Stage 0–3 (FLOW-SPIN-SMASH research/MANIFOLD_CANON_v0.7.md
 * §2.2) — an ordering of COMMITMENTS, not code passes. Each stage answers one
 * question, and a later stage may never undo an earlier stage's protections.
 *
 *   Stage 0 — PROTECT.   Is this a world we may touch? Validate the WIR,
 *                        deep-freeze the source. The source is never mutated.
 *   Stage 1 — STRUCTURE. What does it mean? Flatten to concepts (the
 *                        communication acts of world design), run the
 *                        coherence engine. Meaning before output.
 *   Stage 2 — ROUTE.     What may the target say? Classify every concept
 *                        against the adapter's capability manifest.
 *                        No capability → UNKNOWN → abstain. Passivity is
 *                        safety, not failure.
 *   Stage 3 — REALIZE.   Say it. The adapter emits artifacts for everything
 *                        routed speakable; the ledger already holds the
 *                        full trace before the adapter runs.
 *
 * "Erst klassifizieren, dann entscheiden ob interveniert werden darf."
 * Here: erst routen, dann entscheiden was emittiert werden darf.
 */
"use strict";

const { conceptsOf, deepFreeze, WIR_VERSION } = require("./wir");
const { ROUTES, createLedger, record, recordGain, summarize, formatReport } = require("./ledger");
const coherence = require("./coherence");

/**
 * translate(world, adapterName, registry, options?) →
 *   { artifacts, ledger, report, coherence, summary }
 *
 * options.strict (default true): refuse to realize an inconsistent world.
 *   strict=false still runs, but the report carries the errors — nothing
 *   is ever hidden.
 */
function translate(world, adapterName, registry, options = {}) {
  const strict = options.strict !== false;

  // ── Stage 0: PROTECT ────────────────────────────────────────────────
  if (!world || world.wirVersion !== WIR_VERSION) {
    throw new Error(`Stage 0: not a WIR ${WIR_VERSION} world — refuse, don't guess`);
  }
  const source = deepFreeze(JSON.parse(JSON.stringify(world)));

  // ── Stage 1: STRUCTURE ──────────────────────────────────────────────
  const concepts = conceptsOf(source);
  const cohere = coherence.check(source);
  if (strict && !cohere.consistent) {
    const errs = cohere.issues.filter((i) => i.severity === "error")
      .map((i) => `${i.code}: ${i.message}`).join("\n  ");
    throw new Error(`Stage 1: world '${source.meta.id}' is inconsistent — fix meaning, not output:\n  ${errs}`);
  }

  // ── Stage 2: ROUTE ──────────────────────────────────────────────────
  const adapter = registry.get(adapterName);
  const ledger = createLedger(source.meta.id, adapter.name);
  const routed = [];
  for (const concept of concepts) {
    const cap = registry.capabilityFor(adapter, concept.kind);
    if (!cap) {
      record(ledger, {
        conceptId: concept.id, kind: concept.kind, route: ROUTES.UNKNOWN,
        ruleId: "TRV-ROUTE-UNKNOWN",
        reason: `adapter '${adapter.name}' declares no capability for '${concept.kind}' — designed abstention`,
      });
      continue;
    }
    record(ledger, {
      conceptId: concept.id, kind: concept.kind, route: cap.route,
      ruleId: `TRV-CAP-${cap.key.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}`,
      reason: cap.note || `capability manifest of '${adapter.name}'`,
      via: cap.via || null,
      loss: cap.loss || null,
      gain: cap.gain || null,
      contractRef: cap.contractRef || null,
    });
    if (cap.route !== ROUTES.UNKNOWN && cap.route !== ROUTES.PRESERVE) {
      routed.push({ ...concept, route: cap.route, via: cap.via || null, contractRef: cap.contractRef || null });
    }
  }

  // adapter-level gains: what the target offers beyond the source's asking
  for (const gain of adapter.gains || []) {
    recordGain(ledger, `adapter.${adapter.name}`, gain);
  }

  // ── Stage 3: REALIZE ────────────────────────────────────────────────
  const artifacts = adapter.realize(source, routed, ledger) || [];
  for (const a of artifacts) {
    if (!a.path || typeof a.content !== "string") {
      throw new Error(`Stage 3: adapter '${adapter.name}' emitted a malformed artifact`);
    }
  }
  // The original travels with every translation — never only the projection.
  artifacts.push({
    path: `${source.meta.id}.wir.json`,
    content: JSON.stringify(source, null, 2) + "\n",
  });

  return {
    artifacts,
    ledger,
    coherence: cohere,
    summary: summarize(ledger),
    report: formatReport(ledger, cohere),
  };
}

module.exports = { translate };
