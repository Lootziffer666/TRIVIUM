/*!
 * TRIVIUM adapter: Godot 4
 *
 * Target language: a scene-tree engine. Structure is Godot's native
 * register (nodes, groups, signals); rhetoric must be composed from
 * WorldEnvironment/CanvasModulate/particles; logic is fluent GDScript.
 * The mirror image of SHADED: strong grammar, buildable rhetoric.
 *
 * Emitted artifacts are meaning-carrying scaffolds: a scene file with one
 * node per entity (grouped by kind, positioned from space anchors), and a
 * world script carrying state, rules, machines and the moment arc as data
 * + a small runtime. No engine syntax enters the TRIVIUM core.
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

const adapter = {
  name: "godot",
  engine: "Godot 4 — node/scene-tree engine, GDScript",
  dialect: "2d/3d-scene-tree",

  capabilities: {
    "grammar.entity.*": { route: ROUTES.NATIVE, via: "Node2D/Node3D per entity, kind as group", gain: "every entity is addressable, signalable and inspectable at runtime" },
    "grammar.relation.contains": { route: ROUTES.NATIVE, via: "scene-tree parenthood" },
    "grammar.relation.blocks": { route: ROUTES.BRIDGE, via: "collision layers", note: "blocking becomes physical" },
    "grammar.relation.*": { route: ROUTES.BRIDGE, via: "relation table in world script", note: "social relations become queryable data, not tree edges" },
    "grammar.space.2d": { route: ROUTES.NATIVE, via: "Node2D root" },
    "grammar.space.2.5d": { route: ROUTES.BRIDGE, via: "Node2D + z_index/Y-sort", note: "2.5D is a discipline, not a mode" },
    "grammar.space.3d": { route: ROUTES.NATIVE, via: "Node3D root" },

    "rhetoric.moment": { route: ROUTES.BRIDGE, via: "moment dictionary + apply_moment()", note: "intent axes land in a dictionary; wiring them to WorldEnvironment/particles is authored per project" },
    "rhetoric.arc": { route: ROUTES.BRIDGE, via: "arc array + play_arc() with Tween blending" },
    "rhetoric.intent.*": {
      route: ROUTES.APPROXIMATE, via: "moment dictionary values 0..1",
      loss: "Godot has no built-in living-world response; each axis needs authored VFX (particles, shaders, lights) to become visible",
      note: "the scaffold keeps the meaning; the visuals are project work",
    },

    "logic.state.hidden": { route: ROUTES.NATIVE, via: "world script vars (not exported)" },
    "logic.state.visible": { route: ROUTES.NATIVE, via: "world script vars + signal on change" },
    "logic.rule": { route: ROUTES.NATIVE, via: "rule table + trigger() runtime", gain: "rules can react to physics, input and timers — full engine reach" },
    "logic.machine": { route: ROUTES.NATIVE, via: "enum + match-based FSM" },
    "logic.memory": { route: ROUTES.NATIVE, via: "memory array + signal for hint UI" },
  },

  gains: [
    "full runtime interactivity: input, physics, UI, persistence",
    "entities become live objects — the translated world can grow systems TRIVIUM never described",
  ],

  realize(world, routed, ledger) {
    const is3d = world.meta.dims === "3d";
    const nodeBase = is3d ? "Node3D" : "Node2D";
    const anchors = Object.assign({}, ...world.grammar.spaces.map((s) => s.anchors));

    // scene: one node per entity, positioned from anchors (0..1 → 1024px plane)
    const S = [];
    S.push(`[gd_scene format=3]`);
    S.push(``);
    S.push(`[node name="${pas(world.meta.id)}" type="${nodeBase}"]`);
    for (const e of world.grammar.entities) {
      const a = anchors[e.id];
      S.push(``);
      S.push(`[node name="${pas(e.id)}" type="${nodeBase}" parent="." groups=["${e.kind}"${e.tags.map((t) => `, "${t}"`).join("")}]`);
      if (a && !is3d) S.push(`position = Vector2(${Math.round(a.x * 1024)}, ${Math.round(a.y * 1024)})`);
      if (a && is3d) S.push(`position = Vector3(${r2(a.x * 10)}, ${r2((a.z || 0) * 10)}, ${r2(a.y * 10)})`);
    }

    // world script: state + rules + machines + moments/arc
    const G = [];
    G.push(`## TRIVIUM → Godot world script for '${world.meta.id}' (generated scaffold).`);
    G.push(`## The WIR (${world.meta.id}.wir.json) is the source of truth; regenerate, don't fork.`);
    G.push(`extends ${nodeBase}`);
    G.push(``);
    G.push(`signal state_changed(key, value)`);
    G.push(`signal hint(text)`);
    G.push(``);
    G.push(`# Logik: hidden relational state`);
    G.push(`var state := ${gdDict(Object.fromEntries(world.logic.state.map((s) => [s.id, s.initial])))}`);
    G.push(`var memory: Array = []`);
    G.push(``);
    G.push(`# Rhetorik: moments carry MEANING (0..1 axes) — wire them to your`);
    G.push(`# WorldEnvironment/CanvasModulate/particles in apply_moment().`);
    G.push(`var moments := ${gdDict(Object.fromEntries(world.rhetoric.moments.map((m) => [m.id, m.intents])))}`);
    G.push(`var arc := ${JSON.stringify(world.rhetoric.arc)}`);
    G.push(``);
    G.push(`var rules := ${gdRules(world.logic.rules)}`);
    G.push(``);
    G.push(`func apply_moment(id: String) -> void:`);
    G.push(`\tvar intents: Dictionary = moments.get(id, {})`);
    G.push(`\t# TODO(project): map intent axes to your scene's atmosphere here.`);
    G.push(`\t# e.g. $CanvasModulate.color = day_color.lerp(night_color, intents.get("timeOfDay", 0.0))`);
    G.push(`\tprint("moment: ", id, " ", intents)`);
    G.push(``);
    G.push(`func play_arc() -> void:`);
    G.push(`\tfor id in arc:`);
    G.push(`\t\tapply_moment(id)`);
    G.push(`\t\tawait get_tree().create_timer(4.0).timeout`);
    G.push(``);
    G.push(`func trigger(name: String) -> Array:`);
    G.push(`\tvar fired: Array = []`);
    G.push(`\tvar groups := {}`);
    G.push(`\tvar candidates := rules.filter(func(r): return r.trigger == name)`);
    G.push(`\tcandidates.sort_custom(func(a, b): return a.priority > b.priority)`);
    G.push(`\tfor r in candidates:`);
    G.push(`\t\tif r.group != "" and groups.has(r.group):`);
    G.push(`\t\t\tcontinue`);
    G.push(`\t\tvar ok := true`);
    G.push(`\t\tfor c in r.conditions:`);
    G.push(`\t\t\tvar v = state.get(c.get("state", ""), null)`);
    G.push(`\t\t\tif c.has("gte") and not (v >= c.gte): ok = false`);
    G.push(`\t\t\tif c.has("lte") and not (v <= c.lte): ok = false`);
    G.push(`\t\t\tif c.has("eq") and v != c.eq: ok = false`);
    G.push(`\t\tvar effects: Array = r.then if ok else r.on_fail  # failure still teaches`);
    G.push(`\t\tfor e in effects:`);
    G.push(`\t\t\t_apply_effect(e)`);
    G.push(`\t\tif not effects.is_empty():`);
    G.push(`\t\t\tfired.append({"rule": r.id, "ok": ok})`);
    G.push(`\t\tif ok and r.group != "":`);
    G.push(`\t\t\tgroups[r.group] = true`);
    G.push(`\treturn fired`);
    G.push(``);
    G.push(`func _apply_effect(e: Dictionary) -> void:`);
    G.push(`\tif e.has("set"):`);
    G.push(`\t\tstate[e.set] = e.get("to", state[e.set] + e.get("add", 0))`);
    G.push(`\t\tstate_changed.emit(e.set, state[e.set])`);
    G.push(`\tif e.has("moment"):`);
    G.push(`\t\tapply_moment(e.moment)`);
    G.push(`\tif e.has("hint"):`);
    G.push(`\t\tmemory.append(e.hint)`);
    G.push(`\t\thint.emit(e.hint)`);
    G.push(``);
    for (const m of world.logic.machines) {
      G.push(`# Machine: ${m.id}${m.entity ? ` (entity ${m.entity})` : ""}`);
      G.push(`enum ${pas(m.id)} { ${m.states.map((s) => s.toUpperCase()).join(", ")} }`);
      G.push(`var ${m.id}_state := ${pas(m.id)}.${m.initial.toUpperCase()}`);
      G.push(`var ${m.id}_transitions := ${JSON.stringify(m.transitions)}`);
      G.push(``);
    }

    return [
      { path: `${world.meta.id}.tscn`, content: S.join("\n") + "\n" },
      { path: `${world.meta.id}_world.gd`, content: G.join("\n") + "\n" },
    ];
  },
};

function pas(id) { return id.replace(/(^|[_\-\s])(\w)/g, (_, __, c) => c.toUpperCase()); }
function r2(x) { return Math.round(x * 100) / 100; }
function gdDict(obj) { return JSON.stringify(obj).replace(/"([^"]+)":/g, '"$1": '); }
function gdRules(rules) {
  return JSON.stringify(rules.map((r) => ({
    id: r.id, trigger: r.when.trigger, conditions: r.when.conditions,
    then: r.then, on_fail: r.onFail, priority: r.priority, group: r.exclusiveGroup || "",
  })));
}

module.exports = { adapter };
