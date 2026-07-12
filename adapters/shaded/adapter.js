/*!
 * TRIVIUM adapter: SHADED (lootziffer666/SHADED)
 *
 * Target language: a WebGL living-image engine. One 2D image becomes an
 * atmospheric scene; expression happens through 15 high-level parameters
 * (dayNight, storm, rain, wet, puddle, fog, wind, glow, decay, snow,
 * snowfall, temperature, autumn, bloom, bleach), a storyboard
 * ({name, dur, p} steps played via window.SHADED.story), and optical
 * actors (window.SHADED.addActor, sprites from SWIFT).
 *
 * This is the fluent-rhetoric target: SHADED speaks mood natively and
 * structure only approximately (everything is one image). The adapter
 * therefore translates:
 *   - rhetoric intents → param sets (MEANING mapped, e.g. precipitation
 *     becomes rain OR snowfall depending on coldness — one meaning,
 *     two surface forms, exactly like a natural language)
 *   - arc/moments      → a real storyboard installed into story.board()
 *   - characters       → addActor slots (sprite assets come from SWIFT)
 *   - places/things    → a marker brief in SHADED's canonical palette,
 *     so the author can teach analyze() where the entities live
 *   - logic            → a JS driver runtime around window.SHADED
 *     (SHADED itself has no game logic — Invariante 2 stays untouched;
 *     the driver never touches classGrid/getMaterialTypeAt)
 *
 * All API facts verified against SHADED/index.html and SHADED/CLAUDE.md.
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

// SHADED's canonical palette (CLAUDE.md Invariante 3) — copied values,
// index.html stays the truth.
const CANONICAL_PALETTE = {
  grass: "#16A34A", foliage: "#AA0EB7", roof: "#F97316", path: "#DC2626",
  wood: "#854D0E", window: "#0F766E", water: "#06B6D4", rock: "#475569",
};
const WINDOW_MARKER_PINK = "#FF00FF";

// ── meaning → surface: intent axes to SHADED params ─────────────────────
function intentsToParams(intents) {
  const p = {};
  const has = (k) => intents[k] != null;
  const cold = has("coldness") ? intents.coldness : 0.3;

  if (has("timeOfDay")) p.dayNight = intents.timeOfDay;
  if (has("turbulence")) p.storm = intents.turbulence;
  if (has("precipitation")) {
    // One meaning, two surface forms: cold worlds snow, warm worlds rain.
    if (cold >= 0.6) {
      p.snowfall = r3(intents.precipitation);
      p.snow = r3(Math.min(1, intents.precipitation * 1.2));
      p.rain = 0;
    } else {
      p.rain = intents.precipitation;
    }
  }
  if (has("wetness")) { p.wet = intents.wetness; p.puddle = r3(intents.wetness * 0.9); }
  if (has("visibility")) p.fog = intents.visibility;
  if (has("wind")) p.wind = intents.wind;
  if (has("warmthLight")) p.glow = intents.warmthLight;
  if (has("decay")) p.decay = intents.decay;
  if (has("coldness")) p.temperature = r3(1 - intents.coldness);
  if (has("seasonAutumn")) p.autumn = intents.seasonAutumn;
  if (has("seasonBloom")) p.bloom = intents.seasonBloom;
  if (has("tension")) {
    // approximation: SHADED has no tension param; dramatic pressure is
    // voiced through storm/wind lift (loss documented in the manifest)
    p.storm = r3(Math.max(p.storm || 0, intents.tension * 0.85));
    p.wind = r3(Math.max(p.wind || 0, intents.tension * 0.7));
  }
  // intimacy: routed PRESERVE — no SHADED surface form exists.
  return p;
}
function r3(x) { return Math.round(x * 1000) / 1000; }

const adapter = {
  name: "shaded",
  engine: "SHADED — WebGL living-image engine (single-file runtime, window.SHADED API)",
  dialect: "2d-living-image",

  capabilities: {
    // Grammatik — structure is SHADED's weak register
    "grammar.entity.place": {
      route: ROUTES.APPROXIMATE, via: "marker brief (canonical palette)",
      loss: "SHADED has one background image; a place has no node of its own — it becomes a painted region the analyzer learns",
      note: "author paints the region in the matching palette color",
    },
    "grammar.entity.character": {
      route: ROUTES.BRIDGE, via: "window.SHADED.addActor",
      note: "actors are purely optical overlays; sprite sheets + manifests come from SWIFT",
      gain: "characters inherit fog/dayNight lighting and depth layering for free",
    },
    "grammar.entity.thing": {
      route: ROUTES.APPROXIMATE, via: "marker brief (canonical palette)",
      loss: "things merge into the material segmentation; no per-thing handle",
    },
    "grammar.entity.zone": {
      route: ROUTES.APPROXIMATE, via: "marker brief / building zones (unit 7)",
      loss: "zones exist only as material masks, not addressable objects",
    },
    "grammar.entity.evidence": {
      route: ROUTES.PRESERVE,
      loss: "SHADED cannot make an object inspectable; evidence interaction has no surface form",
      note: "carried in the WIR copy; a driver UI could surface it later",
    },
    "grammar.relation.contains": { route: ROUTES.BRIDGE, via: "spatial anchors in the scene image", note: "containment is expressed by where regions are painted" },
    "grammar.relation.adjacent": { route: ROUTES.BRIDGE, via: "spatial anchors in the scene image", note: "adjacency is literal in a single image" },
    "grammar.relation.*": {
      route: ROUTES.PRESERVE,
      loss: "social relations (owns/knows/desires/fears/…) have no visual grammar in SHADED",
      note: "the driver keeps them as data for logic gating",
    },
    "grammar.space.2d": { route: ROUTES.NATIVE, via: "scene canvas", note: "SHADED is a 2D plane by construction" },
    "grammar.space.2.5d": { route: ROUTES.BRIDGE, via: "depth map (texture unit 6) + parallax", note: "upload a depth map for 2.5D parallax" },
    "grammar.space.3d": {
      route: ROUTES.APPROXIMATE, via: "depth map parallax",
      loss: "true 3D space flattens to one viewpoint with parallax — no free camera",
    },

    // Rhetorik — SHADED's native register
    "rhetoric.moment": { route: ROUTES.NATIVE, via: "storyboard step {name, dur, p}" },
    "rhetoric.arc": { route: ROUTES.NATIVE, via: "window.SHADED.story.board() + play()", gain: "smoothstep blending between moments comes free from tickStory" },
    "rhetoric.intent.timeOfDay": { route: ROUTES.NATIVE, via: "dayNight" },
    "rhetoric.intent.turbulence": { route: ROUTES.NATIVE, via: "storm" },
    "rhetoric.intent.precipitation": {
      route: ROUTES.NATIVE, via: "rain | snowfall+snow (chosen by coldness)",
      gain: "wet surfaces, puddle mirrors and river networks emerge from the material truth without being asked for",
    },
    "rhetoric.intent.wetness": { route: ROUTES.NATIVE, via: "wet + puddle" },
    "rhetoric.intent.visibility": { route: ROUTES.NATIVE, via: "fog", gain: "fog also layers smoke and dims actors — information filtering built in" },
    "rhetoric.intent.wind": { route: ROUTES.NATIVE, via: "wind" },
    "rhetoric.intent.warmthLight": { route: ROUTES.NATIVE, via: "glow", gain: "window light lands only in canon-detected frames (K-rules), never as glow blobs" },
    "rhetoric.intent.decay": { route: ROUTES.NATIVE, via: "decay", gain: "material fatigue, moss and rust accumulate per material class" },
    "rhetoric.intent.coldness": { route: ROUTES.NATIVE, via: "temperature (inverted)", gain: "frost, ice crystals and breath clouds emerge below the freezing band" },
    "rhetoric.intent.seasonAutumn": { route: ROUTES.NATIVE, via: "autumn" },
    "rhetoric.intent.seasonBloom": { route: ROUTES.NATIVE, via: "bloom" },
    "rhetoric.intent.tension": {
      route: ROUTES.APPROXIMATE, via: "storm/wind lift",
      loss: "tension is voiced only through weather pressure; a tense calm scene cannot be said",
    },
    "rhetoric.intent.intimacy": {
      route: ROUTES.PRESERVE,
      loss: "no camera, no framing, no distance — intimacy has no SHADED vocabulary",
    },

    // Logik — realized in the driver AROUND the engine, never inside it
    "logic.state.hidden": { route: ROUTES.BRIDGE, via: "driver runtime state (JS)", note: "SHADED stays logic-free; the driver owns hidden state" },
    "logic.state.visible": { route: ROUTES.BRIDGE, via: "driver runtime state + status line" },
    "logic.rule": {
      route: ROUTES.BRIDGE, via: "driver trigger functions → setParams/applyMoment",
      note: "world reactions become parameter shifts; Invariante 2 untouched — the driver never writes classGrid",
    },
    "logic.machine": { route: ROUTES.BRIDGE, via: "driver finite-state machine" },
    "logic.memory": { route: ROUTES.BRIDGE, via: "driver hint log (readable change, no quest markers)" },
  },

  gains: [
    "the whole world breathes unprompted: 31 Weltgesetze (footprints, drying, rust, smoke layering, moonlight, …) react to every parameter set",
    "material truth: one segmentation drives CPU queries and GPU masks — getMaterialTypeAt() gives the driver terrain answers for free",
    "marker overlay: authors correct the world's understanding by painting, not by coding",
  ],

  realize(world, routed, ledger) {
    const artifacts = [];
    const kinds = new Set(routed.map((c) => c.kind));

    // ── storyboard from moments + arc ──────────────────────────────────
    const momentById = new Map(world.rhetoric.moments.map((m) => [m.id, m]));
    const steps = world.rhetoric.arc
      .filter((id) => momentById.has(id))
      .map((id) => {
        const m = momentById.get(id);
        return { name: m.label, dur: m.durationSec, p: intentsToParams(m.intents) };
      });

    // ── actor slots for characters ─────────────────────────────────────
    const characters = world.grammar.entities.filter((e) => e.kind === "character");
    const anchors = Object.assign({}, ...world.grammar.spaces.map((s) => s.anchors));

    // ── driver runtime: logic around window.SHADED ─────────────────────
    if (kinds.has("rhetoric.arc") || kinds.has("rhetoric.moment") || kinds.has("logic.rule") || characters.length) {
      artifacts.push({
        path: `${world.meta.id}.shaded.driver.js`,
        content: buildDriver(world, steps, characters, anchors),
      });
    }

    // ── marker brief: teach analyze() where the entities live ─────────
    const paintable = world.grammar.entities.filter((e) => e.kind !== "character");
    if (paintable.length) {
      artifacts.push({
        path: `${world.meta.id}.marker-brief.md`,
        content: buildMarkerBrief(world, paintable),
      });
    }
    return artifacts;
  },
};

// suggest a canonical palette color from entity tags/kind
function suggestColor(e) {
  const tags = new Set(e.tags);
  for (const key of Object.keys(CANONICAL_PALETTE)) {
    if (tags.has(key)) return { name: key, hex: CANONICAL_PALETTE[key] };
  }
  if (e.kind === "zone") return { name: "rock", hex: CANONICAL_PALETTE.rock };
  if (tags.has("building") || tags.has("house")) return { name: "wood", hex: CANONICAL_PALETTE.wood };
  return null;
}

function buildMarkerBrief(world, entities) {
  const L = [];
  L.push(`# Marker-Brief — ${world.meta.title} → SHADED`);
  L.push("");
  L.push("SHADED lernt Struktur durch Malen: eine Kopie des Szenenbilds, in der nur");
  L.push("die Korrekturstellen in kanonischen Palettenfarben übermalt sind (Zweitbild,");
  L.push("Invariante 3). Marker sind eine Nutzer-Ansage und schlagen jede Heuristik.");
  L.push("");
  L.push("| Entity | Kind | Empfohlene Farbe | Hex | Hinweis |");
  L.push("|---|---|---|---|---|");
  for (const e of entities) {
    const c = suggestColor(e);
    L.push(`| ${e.name} | ${e.kind} | ${c ? c.name : "—"} | ${c ? `\`${c.hex}\`` : "frei wählen aus PALETTE"} | ${e.props.hint || ""} |`);
  }
  L.push("");
  L.push(`Fenster IMMER mit Marker-Pink \`${WINDOW_MARKER_PINK}\` nachrüsten, nie auf die`);
  L.push("Heuristik verlassen (sie ist bewusst konservativ, Bildkanon K1–K8).");
  L.push("");
  return L.join("\n");
}

function buildDriver(world, steps, characters, anchors) {
  const state = {};
  for (const s of world.logic.state) state[s.id] = s.initial;

  const L = [];
  L.push(`/* TRIVIUM → SHADED driver for '${world.meta.id}' (generated; the WIR is the source of truth).`);
  L.push(` * Load next to the SHADED iframe/page AFTER window.SHADED.isReady() is true.`);
  L.push(` * The driver only speaks the public API (setParams, story, addActor,`);
  L.push(` * getMaterialTypeAt). It never touches engine internals — Invariante 2. */`);
  L.push(`(function () {`);
  L.push(`  "use strict";`);
  L.push(`  const S = window.SHADED;`);
  L.push(`  if (!S) throw new Error("window.SHADED missing — load SHADED first");`);
  L.push(``);
  L.push(`  // Logik: hidden relational state (adult_game layer 2)`);
  L.push(`  const state = ${JSON.stringify(state, null, 2).replace(/\n/g, "\n  ")};`);
  L.push(`  const memory = []; // hint layer: readable change, no quest markers`);
  L.push(``);
  L.push(`  const MOMENTS = ${JSON.stringify(Object.fromEntries(steps.map((s) => [s.name, s.p])), null, 2).replace(/\n/g, "\n  ")};`);
  L.push(`  const STORYBOARD = ${JSON.stringify(steps, null, 2).replace(/\n/g, "\n  ")};`);
  L.push(``);
  L.push(`  function installArc() {`);
  L.push(`    const b = S.story.board();`);
  L.push(`    b.length = 0;`);
  L.push(`    for (const step of STORYBOARD) b.push(step);`);
  L.push(`  }`);
  L.push(``);
  L.push(`  // Logik: world-reaction rules (adult_game layer 3)`);
  L.push(`  const RULES = ${JSON.stringify(world.logic.rules, null, 2).replace(/\n/g, "\n  ")};`);
  L.push(`  function trigger(name, ctx) {`);
  L.push(`    const fired = [];`);
  L.push(`    const groups = new Set();`);
  L.push(`    const rules = RULES.filter((r) => r.when.trigger === name)`);
  L.push(`      .sort((a, b) => b.priority - a.priority);`);
  L.push(`    for (const r of rules) {`);
  L.push(`      if (r.exclusiveGroup && groups.has(r.exclusiveGroup)) continue;`);
  L.push(`      const ok = r.when.conditions.every((c) => {`);
  L.push(`        if (c.state != null) {`);
  L.push(`          const v = state[c.state];`);
  L.push(`          if (c.gte != null && !(v >= c.gte)) return false;`);
  L.push(`          if (c.lte != null && !(v <= c.lte)) return false;`);
  L.push(`          if (c.eq != null && v !== c.eq) return false;`);
  L.push(`        }`);
  L.push(`        return true;`);
  L.push(`      });`);
  L.push(`      const effects = ok ? r.then : r.onFail; // failure still teaches`);
  L.push(`      for (const e of effects) apply(e, ctx);`);
  L.push(`      if (effects.length) fired.push({ rule: r.id, ok });`);
  L.push(`      if (ok && r.exclusiveGroup) groups.add(r.exclusiveGroup);`);
  L.push(`    }`);
  L.push(`    return fired;`);
  L.push(`  }`);
  L.push(`  function apply(e, ctx) {`);
  L.push(`    if (e.set != null) state[e.set] = e.to != null ? e.to : (state[e.set] + (e.add || 0));`);
  L.push(`    if (e.moment != null && MOMENTS[momentLabel(e.moment)]) S.setParams(MOMENTS[momentLabel(e.moment)]);`);
  L.push(`    if (e.params) S.setParams(e.params);`);
  L.push(`    if (e.hint) memory.push({ t: Date.now(), hint: e.hint, ctx: ctx || null });`);
  L.push(`  }`);
  L.push(`  const MOMENT_LABELS = ${JSON.stringify(Object.fromEntries(world.rhetoric.moments.map((m) => [m.id, m.label])))};`);
  L.push(`  function momentLabel(id) { return MOMENT_LABELS[id] || id; }`);
  L.push(``);
  L.push(`  // Logik: finite-state machines (advance by event, invalid events are inert)`);
  L.push(`  const machines = ${JSON.stringify(Object.fromEntries(world.logic.machines.map((m) => [m.id, { state: m.initial, transitions: m.transitions }])), null, 2).replace(/\n/g, "\n  ")};`);
  L.push(`  function advance(machineId, event) {`);
  L.push(`    const m = machines[machineId]; if (!m) return null;`);
  L.push(`    const t = m.transitions.find((t) => t.from === m.state && t.on === event);`);
  L.push(`    if (t) m.state = t.to;`);
  L.push(`    return m.state;`);
  L.push(`  }`);
  L.push(``);
  L.push(`  // Grammatik: characters as optical actors (sprites come from SWIFT)`);
  L.push(`  const ACTOR_SLOTS = ${JSON.stringify(characters.map((c) => ({
    id: c.id, name: c.name,
    x: anchors[c.id] ? anchors[c.id].x : 0.5,
    y: anchors[c.id] ? anchors[c.id].y : 0.8,
    depthLayer: c.props.depthLayer || "mid",
    anim: c.props.anim || "idle",
    assets: { image: null, manifest: null, depthImage: null, emissiveImage: null },
  })), null, 2).replace(/\n/g, "\n  ")};`);
  L.push(`  const actors = {};`);
  L.push(`  async function spawnActors(assetResolver) {`);
  L.push(`    for (const slot of ACTOR_SLOTS) {`);
  L.push(`      const a = assetResolver ? await assetResolver(slot) : slot.assets;`);
  L.push(`      if (!a || !a.image || !a.manifest) { memory.push({ hint: "actor '" + slot.id + "' waits for SWIFT assets" }); continue; }`);
  L.push(`      actors[slot.id] = await S.addActor({ image: a.image, manifest: a.manifest,`);
  L.push(`        x: slot.x, y: slot.y, anim: a.anim || slot.anim, depthLayer: slot.depthLayer,`);
  L.push(`        depthImage: a.depthImage || undefined, emissiveImage: a.emissiveImage || undefined });`);
  L.push(`    }`);
  L.push(`    return actors;`);
  L.push(`  }`);
  L.push(``);
  L.push(`  window.TRIVIUM_DRIVER = {`);
  L.push(`    worldId: ${JSON.stringify(world.meta.id)},`);
  L.push(`    state, memory, actors, machines, trigger, advance, installArc, spawnActors,`);
  L.push(`    play() { installArc(); S.story.play(); },`);
  L.push(`    stop() { S.story.stop(); },`);
  L.push(`    moment(id) { const p = MOMENTS[momentLabel(id)]; if (p) S.setParams(p); return p; },`);
  L.push(`  };`);
  L.push(`})();`);
  L.push(``);
  return L.join("\n");
}

module.exports = { adapter, intentsToParams, CANONICAL_PALETTE };
