/*!
 * TRIVIUM — Translation Ledger
 *
 * Inherited law (FLOW/Manifold, verbatim in spirit):
 *   - every change is traceable: rule_id + non-empty reason
 *   - no hidden rewrite
 *   - the original is always preserved alongside any projection
 *
 * TRIVIUM extends the law in both directions:
 *   - every LOSS is documented (what the target cannot say, and why)
 *   - every GAIN is documented (what the target can say that the source
 *     never asked for — "jede Semantik muss neue Möglichkeiten bieten")
 *
 * A translation without a ledger is not a translation; it is a rumor.
 */
"use strict";

// Routing vocabulary — adapted from MANIFOLD's routing→action table
// (FLOW-SPIN-SMASH research/MANIFOLD_ROUTING_TAXONOMY_v0.7.md §2).
// Engines are languages; concepts route like communication acts:
const ROUTES = Object.freeze({
  NATIVE:      "native",      // target speaks this concept fluently
  BRIDGE:      "bridge",      // equivalent construct exists; mapping documented
  APPROXIMATE: "approximate", // lossy realization; loss entry REQUIRED
  DECOMPOSE:   "decompose",   // one concept becomes several target constructs
  RECONSTRUCT: "reconstruct", // rebuild target structure from a contract
  NORMALIZE:   "normalize",   // unify axes, units, channels, pivots, or names
  BAKE:        "bake",        // convert dynamic meaning to fixed output; loss REQUIRED
  PROJECT:     "project",     // change dimension or perception channel via contract
  DEGRADE:     "degrade",     // intentionally reduce capability; loss REQUIRED
  ENRICH:      "enrich",      // add a target capability; gain REQUIRED
  FEDERATE:    "federate",    // keep source in its runtime via scene/handoff contract
  PRESERVE:    "preserve",    // target cannot realize it; meaning carried as
                              // inert data so nothing is silently dropped
  UNKNOWN:     "unknown",     // designed abstention — a safety state, not an error
});

const LOSSY_ROUTES = new Set([ROUTES.APPROXIMATE, ROUTES.BAKE, ROUTES.DEGRADE, ROUTES.PRESERVE]);
const CONTRACT_ROUTES = new Set([ROUTES.RECONSTRUCT, ROUTES.NORMALIZE, ROUTES.PROJECT, ROUTES.FEDERATE]);

function createLedger(worldId, target) {
  return {
    worldId,
    target,
    startedAt: new Date().toISOString(),
    events: [],   // every routing decision, no exceptions
    losses: [],   // what did not survive, and why
    gains: [],    // what the target newly affords
    review: [],   // concepts routed UNKNOWN → needs_human_review
  };
}

function record(ledger, ev) {
  if (!ev.conceptId) throw new Error("ledger.record: conceptId required");
  if (!Object.values(ROUTES).includes(ev.route)) {
    throw new Error(`ledger.record: unknown route '${ev.route}'`);
  }
  if (!ev.ruleId || !ev.reason) {
    throw new Error(`ledger.record(${ev.conceptId}): ruleId and non-empty reason are mandatory — no hidden rewrite`);
  }
  const entry = {
    conceptId: ev.conceptId,
    kind: ev.kind || null,
    route: ev.route,
    ruleId: ev.ruleId,
    reason: ev.reason,
    via: ev.via || null, // the target construct used, if any
    contractRef: ev.contractRef || null,
  };

  if (CONTRACT_ROUTES.has(ev.route) && !ev.contractRef) {
    throw new Error(`ledger.record(${ev.conceptId}): route '${ev.route}' requires a contractRef`);
  }
  if (ev.route === ROUTES.ENRICH && !ev.gain) {
    throw new Error(`ledger.record(${ev.conceptId}): route '${ev.route}' requires a gain description`);
  }

  ledger.events.push(entry);

  if (LOSSY_ROUTES.has(ev.route)) {
    if (!ev.loss) {
      throw new Error(`ledger.record(${ev.conceptId}): route '${ev.route}' requires a loss description`);
    }
    ledger.losses.push({ conceptId: ev.conceptId, route: ev.route, loss: ev.loss });
  }
  if (ev.gain) {
    ledger.gains.push({ conceptId: ev.conceptId, gain: ev.gain });
  }
  if (ev.route === ROUTES.UNKNOWN) {
    ledger.review.push({ conceptId: ev.conceptId, kind: ev.kind || null, reason: ev.reason });
  }
  return entry;
}

function recordGain(ledger, conceptId, gain) {
  ledger.gains.push({ conceptId, gain });
}

function summarize(ledger) {
  const byRoute = {};
  for (const r of Object.values(ROUTES)) byRoute[r] = 0;
  for (const ev of ledger.events) byRoute[ev.route]++;
  const total = ledger.events.length;
  const realized = total - byRoute.unknown - byRoute.preserve;
  return {
    target: ledger.target,
    concepts: total,
    byRoute,
    fidelity: total ? Math.round((realized / total) * 1000) / 1000 : 0,
    losses: ledger.losses.length,
    gains: ledger.gains.length,
    needsHumanReview: ledger.review.length > 0,
  };
}

function formatReport(ledger, coherence) {
  const s = summarize(ledger);
  const lines = [];
  lines.push(`# Translation Report — ${ledger.worldId} → ${ledger.target}`);
  lines.push("");
  lines.push(`- concepts routed: ${s.concepts}`);
  lines.push(`- fidelity (realized routes except preserve/unknown / all): ${s.fidelity}`);
  lines.push(`- routes: ${Object.entries(s.byRoute).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  lines.push(`- needs_human_review: ${s.needsHumanReview}`);
  lines.push("");
  if (coherence) {
    lines.push(`## Coherence (source world)`);
    lines.push(`- consistent: ${coherence.consistent}`);
    lines.push(`- issues: ${coherence.issues.length ? "" : "none"}`);
    for (const i of coherence.issues) lines.push(`  - [${i.severity}] ${i.code}: ${i.message}`);
    if (coherence.replayability) {
      const r = coherence.replayability;
      lines.push(`- replayability: branching=${r.branchingFactor}, hiddenReactivity=${r.hiddenReactivity}, learnability=${r.learnability}`);
    }
    lines.push("");
  }
  lines.push(`## Losses (${ledger.losses.length})`);
  for (const l of ledger.losses) lines.push(`- ${l.conceptId} [${l.route}]: ${l.loss}`);
  if (!ledger.losses.length) lines.push("- none — the target speaks the whole world");
  lines.push("");
  lines.push(`## Gains (${ledger.gains.length})`);
  for (const g of ledger.gains) lines.push(`- ${g.conceptId}: ${g.gain}`);
  if (!ledger.gains.length) lines.push("- none documented — suspicious; a translation should open doors");
  lines.push("");
  lines.push(`## Needs human review (${ledger.review.length})`);
  for (const r of ledger.review) lines.push(`- ${r.conceptId}: ${r.reason}`);
  if (!ledger.review.length) lines.push("- none");
  lines.push("");
  lines.push(`## Full trace (${ledger.events.length} events)`);
  for (const ev of ledger.events) {
    lines.push(`- ${ev.conceptId} → ${ev.route}${ev.via ? ` via ${ev.via}` : ""}${ev.contractRef ? ` contract ${ev.contractRef}` : ""} (${ev.ruleId}: ${ev.reason})`);
  }
  return lines.join("\n") + "\n";
}

module.exports = { ROUTES, LOSSY_ROUTES, CONTRACT_ROUTES, createLedger, record, recordGain, summarize, formatReport };
