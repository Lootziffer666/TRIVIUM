"use strict";
// Adapters: the same meaning, four surface languages — each with an honest ledger.
const assert = require("assert");
const T = require("../packages/trivium-core");
const { build } = require("../examples/dorf-sturmnacht");
const shaded = require("../adapters/shaded/adapter");
const godot = require("../adapters/godot/adapter");
const love2d = require("../adapters/love2d/adapter");
const renpy = require("../adapters/renpy/adapter");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

const reg = T.createRegistry();
reg.register(shaded.adapter);
reg.register(godot.adapter);
reg.register(love2d.adapter);
reg.register(renpy.adapter);

t("all four adapters translate dorf-sturmnacht without review flags", () => {
  for (const target of ["shaded", "godot", "love2d", "renpy"]) {
    const res = T.translate(build(), target, reg);
    assert.strictEqual(res.summary.needsHumanReview, false,
      `${target}: unexpected UNKNOWN routes: ${JSON.stringify(res.ledger.review)}`);
    assert.ok(res.artifacts.length >= 2, `${target}: expected artifacts`);
  }
});

t("shaded: meaning maps to real engine params (precipitation→rain, warm world)", () => {
  const p = shaded.intentsToParams({ precipitation: 0.8, coldness: 0.3, timeOfDay: 1 });
  assert.strictEqual(p.rain, 0.8);
  assert.strictEqual(p.dayNight, 1);
  assert.strictEqual(p.snowfall, undefined);
});

t("shaded: one meaning, two surfaces — cold precipitation becomes snow", () => {
  const p = shaded.intentsToParams({ precipitation: 0.8, coldness: 0.9 });
  assert.strictEqual(p.rain, 0);
  assert.strictEqual(p.snowfall, 0.8);
  assert.ok(p.snow > 0.9);
  assert.ok(Math.abs(p.temperature - 0.1) < 1e-9, "temperature inverts coldness");
});

t("shaded: driver installs a playable storyboard and honors the API contract", () => {
  const res = T.translate(build(), "shaded", reg);
  const driver = res.artifacts.find((a) => a.path.endsWith(".shaded.driver.js"));
  assert.ok(driver, "driver artifact missing");
  // storyboard steps in SHADED's real {name, dur, p} shape
  assert.ok(driver.content.includes('"name": "Sturmnacht"'));
  assert.ok(driver.content.includes('"dur": 10'));
  assert.ok(driver.content.includes("S.story.board()"));
  assert.ok(driver.content.includes("S.setParams"));
  assert.ok(driver.content.includes("S.addActor"));
  // engine params only in the driver, never in the WIR
  assert.ok(driver.content.includes('"dayNight"'));
  const wir = res.artifacts.find((a) => a.path.endsWith(".wir.json"));
  assert.ok(!wir.content.includes("dayNight"), "engine vocabulary leaked into the WIR");
  // the driver is valid JS
  new Function(driver.content); // throws on syntax error
});

t("shaded: marker brief uses the canonical palette, window pink included", () => {
  const res = T.translate(build(), "shaded", reg);
  const brief = res.artifacts.find((a) => a.path.endsWith(".marker-brief.md"));
  assert.ok(brief.content.includes("#854D0E"), "wood suggestion for Fachwerk building");
  assert.ok(brief.content.includes("#FF00FF"), "window marker pink");
  assert.ok(!brief.content.includes("#F972E9"), "the historic typo palette color must not spread");
});

t("shaded: losses are documented — intimacy cannot be said", () => {
  const res = T.translate(build(), "shaded", reg);
  const loss = res.ledger.losses.find((l) => l.conceptId.includes("intimacy"));
  assert.ok(loss, "intimacy loss must be on the ledger");
  assert.ok(res.summary.gains > 0, "gains must be documented too");
});

t("godot: scene has one node per entity, script carries rules verbatim", () => {
  const res = T.translate(build(), "godot", reg);
  const scene = res.artifacts.find((a) => a.path.endsWith(".tscn"));
  const script = res.artifacts.find((a) => a.path.endsWith("_world.gd"));
  assert.ok(scene.content.includes('name="Waechterin"'));
  assert.ok(scene.content.includes('groups=["character"'));
  assert.ok(script.content.includes("func trigger(name: String)"));
  assert.ok(script.content.includes("laterne_auffindbar"));
  assert.ok(script.content.includes("failure still teaches"));
});

t("love2d: emits runnable-shaped lua with arc playback and rules", () => {
  const res = T.translate(build(), "love2d", reg);
  const main = res.artifacts.find((a) => a.path === "main.lua");
  const worldLua = res.artifacts.find((a) => a.path.endsWith("_world.lua"));
  assert.ok(main.content.includes('require("dorf-sturmnacht_world")'));
  assert.ok(worldLua.content.includes("function world.trigger(name)"));
  assert.ok(worldLua.content.includes("goldener_tag"));
  assert.ok(!worldLua.content.includes("undefined"), "no JS leakage into Lua");
});

t("renpy: four adult_game layers are present, arc becomes label flow", () => {
  const res = T.translate(build(), "renpy", reg);
  const rpy = res.artifacts.find((a) => a.path.endsWith("_trivium.rpy"));
  assert.ok(rpy.content.includes("default trivium_vertrauen_waechterin = 0"));
  assert.ok(rpy.content.includes("def trivium_trigger(name):"));
  assert.ok(rpy.content.includes("screen trivium_hints():"));
  assert.ok(rpy.content.includes("label trivium_sturmnacht:"));
  assert.ok(rpy.content.includes("jump trivium_der_tag_danach"));
  assert.ok(rpy.content.includes('define waechterin = Character("Die Wächterin")'));
});

t("declared machine capability is really emitted — the ledger must not lie", () => {
  const { build: buildTurm } = require("../examples/turm-des-schweigens");
  const shadedDrv = T.translate(buildTurm(), "shaded", reg).artifacts.find((a) => a.path.endsWith(".driver.js"));
  assert.ok(shadedDrv.content.includes('"siegelzustand"') && shadedDrv.content.includes("function advance("));
  new Function(shadedDrv.content);
  const lua = T.translate(buildTurm(), "love2d", reg).artifacts.find((a) => a.path.endsWith("_world.lua"));
  assert.ok(lua.content.includes("world.machines") && lua.content.includes("function world.advance("));
  const rpy = T.translate(buildTurm(), "renpy", reg).artifacts.find((a) => a.path.endsWith(".rpy"));
  assert.ok(rpy.content.includes('default trivium_machine_siegelzustand = "intakt"'));
  assert.ok(rpy.content.includes("def trivium_advance(machine_id, event):"));
  const gd = T.translate(buildTurm(), "godot", reg).artifacts.find((a) => a.path.endsWith("_world.gd"));
  assert.ok(gd.content.includes("enum Siegelzustand"));
});

t("two worlds, opposite loss profiles — translation is happening", () => {
  const { build: buildTurm } = require("../examples/turm-des-schweigens");
  const dorfShaded = T.translate(build(), "shaded", reg);
  const turmShaded = T.translate(buildTurm(), "shaded", reg);
  const turmRenpy = T.translate(buildTurm(), "renpy", reg);
  // SHADED loses the tower's 3D space and its intimacy…
  assert.ok(turmShaded.ledger.losses.some((l) => l.conceptId === "grammar.space.turminneres"));
  assert.ok(turmShaded.ledger.losses.some((l) => l.conceptId.includes("intimacy")));
  // …the village never presented those losses to SHADED at 3D severity
  assert.ok(!dorfShaded.ledger.losses.some((l) => l.conceptId === "grammar.space.dorfplatz"));
  // Ren'Py loses ALL space but speaks the diary evidence natively
  assert.ok(turmRenpy.ledger.losses.some((l) => l.conceptId === "grammar.space.turminneres" && l.route === "preserve"));
  const evEvent = turmRenpy.ledger.events.find((e) => e.conceptId === "grammar.entity.tagebuch");
  assert.strictEqual(evEvent.route, "native");
  // and the same evidence is unspeakable for SHADED
  const evShaded = turmShaded.ledger.events.find((e) => e.conceptId === "grammar.entity.tagebuch");
  assert.strictEqual(evShaded.route, "preserve");
});

t("fidelity differs by target — engines are different languages", () => {
  const f = {};
  for (const target of ["shaded", "godot", "love2d", "renpy"]) {
    f[target] = T.translate(build(), target, reg).summary.fidelity;
  }
  // godot (structure-fluent) must not lose more than love2d loses vs itself;
  // the point is only: fidelity is a measured property, not a constant.
  const values = new Set(Object.values(f));
  assert.ok(values.size > 1, `fidelity should differ across targets, got ${JSON.stringify(f)}`);
});

console.log(`test_adapters: ${n} passed`);
