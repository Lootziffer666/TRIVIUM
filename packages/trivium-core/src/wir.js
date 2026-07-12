/*!
 * TRIVIUM — World Intermediate Representation (WIR)
 *
 * The WIR is the engine-agnostic meaning of a game world. It has exactly
 * three strata, after the classical trivium:
 *
 *   GRAMMATIK — structure: entities, relations, spaces. What exists and
 *               how it is bound together. (Bindings before tokens.)
 *   RHETORIK  — expression: semantic intents (0..1 axes), moments, arc.
 *               How the world addresses the player. Never engine params.
 *   LOGIK     — rules: state, triggers, machines, memory. Why the world
 *               reacts, coheres, and stays worth replaying.
 *
 * No stratum may contain engine vocabulary. "rain: 0.7" is rhetoric only
 * because rain is a meaning; "u_rain" or "WorldEnvironment.fog_enabled"
 * would be syntax and is forbidden here. Adapters own syntax.
 *
 * Zero dependencies. Deterministic. The WIR a caller passes in is never
 * mutated by any TRIVIUM stage (see router.js Stage 0).
 */
"use strict";

const WIR_VERSION = "1.0.0";

// ── Rhetoric: the canonical semantic axes ────────────────────────────────
// These are meanings, not engine parameters. Every axis is 0..1.
// Adapters map them onto whatever their engine can express and must
// document the loss when they cannot.
const INTENT_AXES = Object.freeze({
  timeOfDay:     "0 = high day, 1 = deep night",
  turbulence:    "0 = calm air/sky, 1 = full storm",
  precipitation: "0 = dry, 1 = downpour (rain or snow, see coldness)",
  wetness:       "0 = dry surfaces, 1 = soaked world",
  visibility:    "0 = crystal clear, 1 = fully occluded (fog/smoke)",
  wind:          "0 = still, 1 = gale",
  warmthLight:   "0 = no artificial warm light, 1 = every window glows",
  decay:         "0 = pristine, 1 = ruin",
  coldness:      "0 = hot, 1 = deep frost (drives snow vs rain)",
  seasonAutumn:  "0 = none, 1 = full autumn foliage",
  seasonBloom:   "0 = none, 1 = full spring bloom",
  tension:       "0 = safe, 1 = maximum dramatic tension",
  intimacy:      "0 = public/open, 1 = private/close",
});

const ENTITY_KINDS = Object.freeze([
  "place", "character", "thing", "zone", "evidence",
]);

const RELATION_TYPES = Object.freeze([
  "contains", "adjacent", "owns", "knows", "blocks",
  "reveals", "remembers", "desires", "fears",
]);

const STATE_VISIBILITY = Object.freeze(["visible", "hidden"]);

// ── builders ─────────────────────────────────────────────────────────────

function createWorld(meta) {
  if (!meta || typeof meta.id !== "string" || !meta.id.length) {
    throw new Error("createWorld: meta.id (string) is required");
  }
  return {
    wirVersion: WIR_VERSION,
    meta: {
      id: meta.id,
      title: meta.title || meta.id,
      description: meta.description || "",
      dims: meta.dims || "2d", // '2d' | '2.5d' | '3d' — a hint, not a law
    },
    grammar: { entities: [], relations: [], spaces: [] },
    rhetoric: { moments: [], arc: [] },
    logic: { state: [], rules: [], machines: [], memories: [] },
  };
}

function addEntity(world, e) {
  requireId(e, "entity");
  if (!ENTITY_KINDS.includes(e.kind)) {
    throw new Error(`entity ${e.id}: unknown kind '${e.kind}' (allowed: ${ENTITY_KINDS.join(", ")})`);
  }
  world.grammar.entities.push({
    id: e.id, kind: e.kind, name: e.name || e.id,
    tags: e.tags ? [...e.tags] : [],
    props: e.props ? { ...e.props } : {},
  });
  return world;
}

function addRelation(world, r) {
  requireId(r, "relation");
  if (!RELATION_TYPES.includes(r.type)) {
    throw new Error(`relation ${r.id}: unknown type '${r.type}' (allowed: ${RELATION_TYPES.join(", ")})`);
  }
  if (!r.from || !r.to) throw new Error(`relation ${r.id}: needs from and to`);
  world.grammar.relations.push({
    id: r.id, type: r.type, from: r.from, to: r.to,
    props: r.props ? { ...r.props } : {},
  });
  return world;
}

function addSpace(world, s) {
  requireId(s, "space");
  world.grammar.spaces.push({
    id: s.id,
    dims: s.dims || world.meta.dims,
    topology: s.topology || "open", // open | rooms | graph
    anchors: s.anchors ? { ...s.anchors } : {}, // entityId -> {x,y[,z]} in 0..1 space
  });
  return world;
}

function addMoment(world, m) {
  requireId(m, "moment");
  const intents = {};
  for (const [axis, v] of Object.entries(m.intents || {})) {
    if (!(axis in INTENT_AXES)) {
      throw new Error(`moment ${m.id}: unknown intent axis '${axis}' — new meanings are added to INTENT_AXES, never ad hoc`);
    }
    if (typeof v !== "number" || v < 0 || v > 1) {
      throw new Error(`moment ${m.id}: intent '${axis}' must be a number in 0..1, got ${v}`);
    }
    intents[axis] = v;
  }
  world.rhetoric.moments.push({
    id: m.id, label: m.label || m.id,
    intents,
    durationSec: m.durationSec == null ? 8 : m.durationSec,
  });
  return world;
}

function setArc(world, momentIds) {
  world.rhetoric.arc = [...momentIds];
  return world;
}

function addState(world, s) {
  requireId(s, "state");
  world.logic.state.push({
    id: s.id,
    scope: s.scope || "world", // 'world' or an entityId
    key: s.key || s.id,
    initial: s.initial == null ? 0 : s.initial,
    visibility: STATE_VISIBILITY.includes(s.visibility) ? s.visibility : "hidden",
  });
  return world;
}

/**
 * A rule follows the adult_game reaction layering:
 *   when.trigger    — what is attempted/happens (Context/Timing layer)
 *   when.conditions — gates on state/moment (Hidden Relational layer)
 *   then            — effects (World-Reaction layer)
 *   onFail          — effects when conditions fail; a failed attempt must
 *                     still teach (Hint/Memory layer, anti-chore-loop)
 */
function addRule(world, r) {
  requireId(r, "rule");
  if (!r.when || !r.when.trigger) throw new Error(`rule ${r.id}: needs when.trigger`);
  world.logic.rules.push({
    id: r.id,
    when: {
      trigger: r.when.trigger,
      conditions: (r.when.conditions || []).map((c) => ({ ...c })),
    },
    then: (r.then || []).map((e) => ({ ...e })),
    onFail: (r.onFail || []).map((e) => ({ ...e })),
    priority: r.priority == null ? 0 : r.priority,
    exclusiveGroup: r.exclusiveGroup || null,
  });
  return world;
}

function addMachine(world, m) {
  requireId(m, "machine");
  if (!Array.isArray(m.states) || m.states.length === 0) {
    throw new Error(`machine ${m.id}: needs states[]`);
  }
  world.logic.machines.push({
    id: m.id,
    entity: m.entity || null,
    states: [...m.states],
    initial: m.initial || m.states[0],
    transitions: (m.transitions || []).map((t) => ({ from: t.from, to: t.to, on: t.on })),
  });
  return world;
}

function addMemory(world, mem) {
  requireId(mem, "memory");
  world.logic.memories.push({
    id: mem.id,
    records: mem.records || "attempts", // what it accumulates
    surfaces: mem.surfaces || "hint",   // how it reaches the player: hint | objective | ambient
  });
  return world;
}

// ── concept flattening (used by the router's Stage 1) ────────────────────
// A "concept" is TRIVIUM's communication act: the routable unit of meaning.
// Routing decisions attach to concepts, never to raw JSON keys.
function conceptsOf(world) {
  const out = [];
  for (const e of world.grammar.entities) {
    out.push({ id: `grammar.entity.${e.id}`, kind: `grammar.entity.${e.kind}`, ref: e });
  }
  for (const r of world.grammar.relations) {
    out.push({ id: `grammar.relation.${r.id}`, kind: `grammar.relation.${r.type}`, ref: r });
  }
  for (const s of world.grammar.spaces) {
    out.push({ id: `grammar.space.${s.id}`, kind: `grammar.space.${s.dims}`, ref: s });
  }
  for (const m of world.rhetoric.moments) {
    out.push({ id: `rhetoric.moment.${m.id}`, kind: "rhetoric.moment", ref: m });
    for (const axis of Object.keys(m.intents)) {
      out.push({ id: `rhetoric.intent.${m.id}.${axis}`, kind: `rhetoric.intent.${axis}`, ref: { moment: m.id, axis, value: m.intents[axis] } });
    }
  }
  if (world.rhetoric.arc.length) {
    out.push({ id: "rhetoric.arc", kind: "rhetoric.arc", ref: world.rhetoric.arc });
  }
  for (const s of world.logic.state) {
    out.push({ id: `logic.state.${s.id}`, kind: `logic.state.${s.visibility}`, ref: s });
  }
  for (const r of world.logic.rules) {
    out.push({ id: `logic.rule.${r.id}`, kind: "logic.rule", ref: r });
  }
  for (const m of world.logic.machines) {
    out.push({ id: `logic.machine.${m.id}`, kind: "logic.machine", ref: m });
  }
  for (const mem of world.logic.memories) {
    out.push({ id: `logic.memory.${mem.id}`, kind: "logic.memory", ref: mem });
  }
  return out;
}

function requireId(obj, what) {
  if (!obj || typeof obj.id !== "string" || !obj.id.length) {
    throw new Error(`${what}: id (string) is required`);
  }
}

function deepFreeze(obj) {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) deepFreeze(obj[k]);
  }
  return obj;
}

module.exports = {
  WIR_VERSION, INTENT_AXES, ENTITY_KINDS, RELATION_TYPES,
  createWorld, addEntity, addRelation, addSpace,
  addMoment, setArc, addState, addRule, addMachine, addMemory,
  conceptsOf, deepFreeze,
};
