/*!
 * TRIVIUM adapter: Ren'Py
 *
 * Target language: a visual-novel engine — the native register of
 * adult_game's laboratory (lootziffer666/adult_game, docs/ssot/). Logic is
 * where Ren'Py shines, and the emitted scaffold mirrors adult_game's
 * four-layer architecture literally:
 *
 *   Context/Timing        → labels per moment (when/where an attempt lands)
 *   Hidden Relational     → default persistent-free vars, never shown raw
 *   World-Reaction        → trivium_trigger(): rules select the reaction
 *   Hint/Memory/Objective → trivium_memory + a hint screen (readable change
 *                           without quest markers)
 *
 * Rhetoric is APPROXIMATE by honesty: a VN voices atmosphere through
 * prose, scene images and audio — the intent axes become authoring notes
 * inside each moment label, not automatic visuals.
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

const adapter = {
  name: "renpy",
  engine: "Ren'Py 8 — visual novel engine, screens + labels + Python",
  dialect: "vn-label-flow",

  capabilities: {
    "grammar.entity.character": { route: ROUTES.NATIVE, via: "define Character(...)", gain: "voice, name color and dialogue history for free" },
    "grammar.entity.place": { route: ROUTES.BRIDGE, via: "scene statement per moment label", note: "a place is a background the flow visits" },
    "grammar.entity.evidence": { route: ROUTES.NATIVE, via: "inventory/flag vars + inspect menu", gain: "bounded evidence interaction is a VN home game (adult_game layer 5)" },
    "grammar.entity.*": { route: ROUTES.BRIDGE, via: "python data table" },
    "grammar.relation.*": { route: ROUTES.BRIDGE, via: "python relation table", note: "social relations gate dialogue choices" },
    "grammar.space.*": {
      route: ROUTES.PRESERVE,
      loss: "a VN has flow, not space — spatial anchors carried as data only",
    },

    "rhetoric.moment": {
      route: ROUTES.APPROXIMATE, via: "label per moment with authoring notes",
      loss: "intent axes become stage directions in comments; atmosphere must be written, drawn or scored by the author",
    },
    "rhetoric.arc": { route: ROUTES.NATIVE, via: "label flow (jump chain)", note: "an arc IS a VN" },
    "rhetoric.intent.*": {
      route: ROUTES.APPROXIMATE, via: "stage-direction comments",
      loss: "no parameterized weather; meaning survives as direction, not simulation",
    },

    "logic.state.hidden": { route: ROUTES.NATIVE, via: "default vars (never rendered raw)", gain: "hidden relational state is the engine's oldest muscle" },
    "logic.state.visible": { route: ROUTES.NATIVE, via: "default vars + screen" },
    "logic.rule": { route: ROUTES.NATIVE, via: "trivium_trigger() python runtime" },
    "logic.machine": { route: ROUTES.NATIVE, via: "python FSM dict" },
    "logic.memory": { route: ROUTES.NATIVE, via: "trivium_memory + hint screen", gain: "failed attempts leave readable traces — the anti-chore-loop hypothesis is testable here" },
  },

  gains: [
    "interpretation-based progression: dialogue choices interrogate the same rules the world reacts with",
    "rollback + save states give replayability instrumentation for free",
  ],

  realize(world, routed, ledger) {
    const chars = world.grammar.entities.filter((e) => e.kind === "character");
    const L = [];
    L.push(`# TRIVIUM → Ren'Py scaffold for '${world.meta.id}' (generated).`);
    L.push(`# The WIR (${world.meta.id}.wir.json) is the source of truth; regenerate, don't fork.`);
    L.push(`# Layering follows adult_game docs/ssot/SYSTEMS_OVERVIEW.md (four lab layers).`);
    L.push(``);
    for (const c of chars) {
      L.push(`define ${pyId(c.id)} = Character(${JSON.stringify(c.name)})`);
    }
    L.push(``);
    L.push(`# Layer 2 — hidden relational / world state (never shown raw)`);
    for (const s of world.logic.state) {
      L.push(`default trivium_${pyId(s.id)} = ${pyVal(s.initial)}  # ${s.visibility}, scope: ${s.scope}`);
    }
    L.push(`default trivium_memory = []`);
    for (const m of world.logic.machines) {
      L.push(`default trivium_machine_${pyId(m.id)} = ${JSON.stringify(m.initial)}`);
    }
    L.push(``);
    L.push(`init python:`);
    L.push(`    trivium_machines = ${py(Object.fromEntries(world.logic.machines.map((m) => [m.id, m.transitions])))}`);
    L.push(``);
    L.push(`    def trivium_advance(machine_id, event):`);
    L.push(`        var = "trivium_machine_" + machine_id.replace("-", "_")`);
    L.push(`        cur = getattr(store, var)`);
    L.push(`        for t in trivium_machines.get(machine_id, []):`);
    L.push(`            if t["from"] == cur and t["on"] == event:`);
    L.push(`                setattr(store, var, t["to"])`);
    L.push(`                break`);
    L.push(`        return getattr(store, var)`);
    L.push(``);
    L.push(`    trivium_rules = ${py(world.logic.rules.map((r) => ({
      id: r.id, trigger: r.when.trigger, conditions: r.when.conditions,
      then: r.then, on_fail: r.onFail, priority: r.priority, group: r.exclusiveGroup,
    })))}`);
    L.push(``);
    L.push(`    def trivium_get(state_id):`);
    L.push(`        return getattr(store, "trivium_" + state_id.replace("-", "_"))`);
    L.push(``);
    L.push(`    def trivium_set(state_id, value):`);
    L.push(`        setattr(store, "trivium_" + state_id.replace("-", "_"), value)`);
    L.push(``);
    L.push(`    def trivium_trigger(name):`);
    L.push(`        # Layer 3 — world reaction: rules select the meaningful response`);
    L.push(`        fired, groups = [], set()`);
    L.push(`        rules = sorted([r for r in trivium_rules if r["trigger"] == name],`);
    L.push(`                       key=lambda r: -r["priority"])`);
    L.push(`        for r in rules:`);
    L.push(`            if r["group"] and r["group"] in groups:`);
    L.push(`                continue`);
    L.push(`            ok = True`);
    L.push(`            for c in r["conditions"]:`);
    L.push(`                v = trivium_get(c["state"]) if "state" in c else None`);
    L.push(`                if "gte" in c and not (v >= c["gte"]): ok = False`);
    L.push(`                if "lte" in c and not (v <= c["lte"]): ok = False`);
    L.push(`                if "eq" in c and v != c["eq"]: ok = False`);
    L.push(`            effects = r["then"] if ok else r["on_fail"]  # failure still teaches`);
    L.push(`            for e in effects:`);
    L.push(`                if "set" in e:`);
    L.push(`                    trivium_set(e["set"], e.get("to", trivium_get(e["set"]) + e.get("add", 0)))`);
    L.push(`                if "hint" in e:`);
    L.push(`                    trivium_memory.append(e["hint"])  # Layer 4 — readable change`);
    L.push(`            if effects:`);
    L.push(`                fired.append((r["id"], ok))`);
    L.push(`            if ok and r["group"]:`);
    L.push(`                groups.add(r["group"])`);
    L.push(`        return fired`);
    L.push(``);
    L.push(`# Layer 4 — hint surface: readable change without quest markers`);
    L.push(`screen trivium_hints():`);
    L.push(`    if trivium_memory:`);
    L.push(`        frame align (0.98, 0.02):`);
    L.push(`            text trivium_memory[-1] size 20`);
    L.push(``);
    L.push(`# Layer 1 — context/timing: the arc as label flow`);
    const arc = world.rhetoric.arc;
    for (let i = 0; i < arc.length; i++) {
      const m = world.rhetoric.moments.find((mm) => mm.id === arc[i]);
      if (!m) continue;
      L.push(`label trivium_${pyId(m.id)}:`);
      L.push(`    # Stage directions (intent axes 0..1 — write/draw/score them):`);
      for (const [axis, v] of Object.entries(m.intents)) {
        L.push(`    #   ${axis}: ${v}`);
      }
      L.push(`    show screen trivium_hints`);
      L.push(`    "${m.label}"`);
      L.push(i + 1 < arc.length ? `    jump trivium_${pyId(arc[i + 1])}` : `    return`);
      L.push(``);
    }
    if (arc.length) {
      L.push(`label trivium_start:`);
      L.push(`    jump trivium_${pyId(arc[0])}`);
      L.push(``);
    }
    return [{ path: `${world.meta.id}_trivium.rpy`, content: L.join("\n") }];
  },
};

function pyId(id) { return id.replace(/[^A-Za-z0-9_]/g, "_"); }
function pyVal(v) { return typeof v === "boolean" ? (v ? "True" : "False") : JSON.stringify(v); }
function py(v) {
  return JSON.stringify(v)
    .replace(/\bnull\b/g, "None").replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False");
}

module.exports = { adapter };
