/*!
 * TRIVIUM — Coherence Engine
 *
 * Lineage: adult_game docs/ssot/SYSTEMS_OVERVIEW.md — the four-layer lab
 * architecture (Context/Timing, Hidden Relational State, World-Reaction
 * Trigger, Hint/Memory/Objective) and its core validation question:
 * "repeated failed attempts still produce learnable progress instead of
 * chore loops."
 *
 * The coherence engine answers three questions about a WIR world, before
 * any engine ever sees it:
 *
 *   CONSISTENCY  — does the world contradict itself? (dangling references,
 *                  conflicting exclusive rules, unreachable machine states)
 *   COHERENCE    — do the strata agree? (arc references real moments,
 *                  rules gate on real state, relations bind real entities)
 *   REPLAYABILITY— is there a reason to come back? (branching, hidden-state
 *                  reactivity, learnability of failure)
 *
 * These checks are engine-agnostic on purpose: a world that is incoherent
 * in the WIR is incoherent in every engine. Fix meaning, not output.
 */
"use strict";

function check(world) {
  const issues = [];
  const entityIds = new Set(world.grammar.entities.map((e) => e.id));
  const stateIds = new Set(world.logic.state.map((s) => s.id));
  const momentIds = new Set(world.rhetoric.moments.map((m) => m.id));

  // ── consistency: grammar ──────────────────────────────────────────────
  for (const r of world.grammar.relations) {
    for (const end of ["from", "to"]) {
      if (!entityIds.has(r[end])) {
        issues.push(iss("error", "REL_DANGLING",
          `relation ${r.id}: ${end}='${r[end]}' is not a declared entity`));
      }
    }
  }
  for (const s of world.grammar.spaces) {
    for (const anchorId of Object.keys(s.anchors)) {
      if (!entityIds.has(anchorId)) {
        issues.push(iss("error", "ANCHOR_DANGLING",
          `space ${s.id}: anchor '${anchorId}' is not a declared entity`));
      }
    }
  }

  // ── coherence: rhetoric ───────────────────────────────────────────────
  for (const id of world.rhetoric.arc) {
    if (!momentIds.has(id)) {
      issues.push(iss("error", "ARC_DANGLING", `arc references unknown moment '${id}'`));
    }
  }

  // ── consistency: logic ────────────────────────────────────────────────
  for (const st of world.logic.state) {
    if (st.scope !== "world" && !entityIds.has(st.scope)) {
      issues.push(iss("error", "STATE_SCOPE_DANGLING",
        `state ${st.id}: scope '${st.scope}' is neither 'world' nor a declared entity`));
    }
  }
  for (const rule of world.logic.rules) {
    for (const c of rule.when.conditions) {
      if (c.state && !stateIds.has(c.state)) {
        issues.push(iss("error", "RULE_COND_DANGLING",
          `rule ${rule.id}: condition references unknown state '${c.state}'`));
      }
      if (c.moment && !momentIds.has(c.moment)) {
        issues.push(iss("error", "RULE_MOMENT_DANGLING",
          `rule ${rule.id}: condition references unknown moment '${c.moment}'`));
      }
    }
    for (const eff of [...rule.then, ...rule.onFail]) {
      if (eff.set && !stateIds.has(eff.set)) {
        issues.push(iss("error", "RULE_EFFECT_DANGLING",
          `rule ${rule.id}: effect sets unknown state '${eff.set}'`));
      }
      if (eff.moment && !momentIds.has(eff.moment)) {
        issues.push(iss("error", "RULE_EFFECT_MOMENT_DANGLING",
          `rule ${rule.id}: effect jumps to unknown moment '${eff.moment}'`));
      }
    }
  }

  // conflicting exclusives: same trigger, same exclusiveGroup, same priority
  const seen = new Map();
  for (const rule of world.logic.rules) {
    if (!rule.exclusiveGroup) continue;
    const key = `${rule.when.trigger}::${rule.exclusiveGroup}::${rule.priority}`;
    if (seen.has(key)) {
      issues.push(iss("error", "RULE_EXCLUSIVE_CONFLICT",
        `rules ${seen.get(key)} and ${rule.id} share trigger '${rule.when.trigger}', group '${rule.exclusiveGroup}' and priority ${rule.priority} — the world cannot decide`));
    } else {
      seen.set(key, rule.id);
    }
  }

  // machines: unreachable states, dangling transitions
  for (const m of world.logic.machines) {
    if (m.entity && !entityIds.has(m.entity)) {
      issues.push(iss("error", "MACHINE_ENTITY_DANGLING",
        `machine ${m.id}: entity '${m.entity}' is not declared`));
    }
    const stateSet = new Set(m.states);
    for (const t of m.transitions) {
      if (!stateSet.has(t.from) || !stateSet.has(t.to)) {
        issues.push(iss("error", "MACHINE_TRANSITION_DANGLING",
          `machine ${m.id}: transition ${t.from}→${t.to} uses undeclared state`));
      }
    }
    const reachable = new Set([m.initial]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of m.transitions) {
        if (reachable.has(t.from) && !reachable.has(t.to)) { reachable.add(t.to); grew = true; }
      }
    }
    for (const st of m.states) {
      if (!reachable.has(st)) {
        issues.push(iss("warn", "MACHINE_UNREACHABLE",
          `machine ${m.id}: state '${st}' is unreachable from '${m.initial}'`));
      }
    }
  }

  // ── replayability (adult_game hypothesis, made measurable) ────────────
  const hiddenStates = world.logic.state.filter((s) => s.visibility === "hidden");
  const hiddenIds = new Set(hiddenStates.map((s) => s.id));
  const rules = world.logic.rules;

  // branching: distinct outcomes per trigger
  const byTrigger = new Map();
  for (const r of rules) {
    byTrigger.set(r.when.trigger, (byTrigger.get(r.when.trigger) || 0) + 1);
  }
  const branchingFactor = byTrigger.size
    ? round3([...byTrigger.values()].reduce((a, b) => a + b, 0) / byTrigger.size)
    : 0;

  // hidden reactivity: rules whose conditions read hidden state
  const hiddenReactivity = rules.filter((r) =>
    r.when.conditions.some((c) => c.state && hiddenIds.has(c.state))).length;

  // learnability: gated rules must teach on failure (anti-chore-loop).
  // A rule with conditions but an empty onFail is a dead attempt.
  const gated = rules.filter((r) => r.when.conditions.length > 0);
  const teaching = gated.filter((r) => r.onFail.length > 0);
  for (const r of gated) {
    if (r.onFail.length === 0) {
      issues.push(iss("warn", "CHORE_LOOP_RISK",
        `rule ${r.id}: gated but teaches nothing on failure (empty onFail) — repeated failed attempts become a chore loop`));
    }
  }
  const learnability = gated.length ? round3(teaching.length / gated.length) : 1;

  // memory surfacing: hidden state without any memory is unreadable change
  if (hiddenStates.length > 0 && world.logic.memories.length === 0) {
    issues.push(iss("warn", "UNREADABLE_WORLD",
      `world has ${hiddenStates.length} hidden state(s) but no memory/hint layer — change must be readable without quest markers`));
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    consistent: errors.length === 0,
    issues,
    replayability: { branchingFactor, hiddenReactivity, learnability },
  };
}

function iss(severity, code, message) { return { severity, code, message }; }
function round3(x) { return Math.round(x * 1000) / 1000; }

module.exports = { check };
