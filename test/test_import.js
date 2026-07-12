"use strict";
// Rückübersetzung: SHADED-Oberflächenform → WIR-Bedeutung → andere Engine.
const assert = require("assert");
const T = require("../packages/trivium-core");
const { intentsToParams, adapter: shadedAdapter } = require("../adapters/shaded/adapter");
const { paramsToIntents, importStoryboard } = require("../adapters/shaded/importer");
const { adapter: renpyAdapter } = require("../adapters/renpy/adapter");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

t("paramsToIntents invertiert intentsToParams auf den 1:1-Achsen", () => {
  const intents = { timeOfDay: 0.45, turbulence: 0.8, wetness: 0.45, visibility: 0.25, wind: 0.85, warmthLight: 0.55, coldness: 0.44, precipitation: 0.45 };
  const back = paramsToIntents(intentsToParams(intents)).intents;
  for (const axis of Object.keys(intents)) {
    assert.ok(Math.abs(back[axis] - intents[axis]) < 0.002, `${axis}: ${intents[axis]} → ${back[axis]}`);
  }
});

t("kalte Oberflächenform wird zurück zu Bedeutung: snowfall → precipitation + coldness", () => {
  const { intents, absorbed } = paramsToIntents({ snowfall: 0.7, snow: 0.85, temperature: 0.24 });
  assert.strictEqual(intents.precipitation, 0.7);
  assert.ok(intents.coldness > 0.6);
  assert.ok(absorbed.some((a) => a.param === "snow"), "Schneedecke wird als absorbiert ausgewiesen");
});

t("unbekannte Parameter werden nicht geraten — dokumentierter Import-Verlust", () => {
  const { intents, losses } = paramsToIntents({ dayNight: 1, flash: 1, bleeding: 1 });
  assert.strictEqual(intents.timeOfDay, 1);
  assert.ok(!("flash" in intents) && !Object.values(intents).includes("flash"));
  const params = losses.map((l) => l.param).sort();
  assert.deepStrictEqual(params, ["bleeding", "flash"]);
  for (const l of losses) assert.ok(l.ruleId && l.reason, "Import-Verluste tragen ruleId + reason");
});

t("importStoryboard baut eine gültige, kohärente WIR-Welt", () => {
  const steps = [
    { name: "🌅 Dunkel → Hell Übergang", dur: 3, p: { dayNight: 0.95, storm: 0.08, rain: 0, wet: 0.7 } },
    { name: "⛈️ Sturmnacht", dur: 5, p: { dayNight: 1, storm: 1, rain: 1, wet: 1, puddle: 0.92, flash: 1 } },
    { name: "⛈️ Sturmnacht", dur: 2, p: { dayNight: 1 } }, // Duplikat-Name → eindeutige id
  ];
  const { world, report } = importStoryboard({ id: "import-test", title: "Import" }, steps);
  const c = T.checkCoherence(world);
  assert.strictEqual(c.consistent, true);
  assert.strictEqual(world.rhetoric.arc.length, 3);
  assert.deepStrictEqual(world.rhetoric.arc.slice(1), ["sturmnacht", "sturmnacht_2"]);
  assert.ok(report.losses.some((l) => l.param === "flash" && l.moment === "sturmnacht"));
});

t("voller Kreis: SHADED-Storyboard → WIR → Ren'Py — und wieder zurück nach SHADED", () => {
  const steps = [
    { name: "Goldener Tag", dur: 2, p: { dayNight: 0, storm: 0.03, rain: 0, wet: 0, fog: 0.05, wind: 0.3, glow: 0.1, temperature: 0.7 } },
    { name: "Sturmnacht", dur: 5, p: { dayNight: 1, storm: 1, rain: 1, wet: 1, fog: 0.4, wind: 1, glow: 1, temperature: 0.52 } },
  ];
  const { world } = importStoryboard({ id: "kreis", title: "Voller Kreis" }, steps);
  const reg = T.createRegistry();
  reg.register(renpyAdapter);
  reg.register(shadedAdapter);
  // Richtung 1: die fremde Engine spricht SHADEDs Erzählung
  const rpy = T.translate(world, "renpy", reg).artifacts.find((a) => a.path.endsWith(".rpy"));
  assert.ok(rpy.content.includes("label trivium_sturmnacht:"));
  assert.ok(rpy.content.includes("jump trivium_sturmnacht"));
  // Richtung 2: zurück nach SHADED — die Sturmnacht überlebt die Reise
  const drv = T.translate(world, "shaded", reg).artifacts.find((a) => a.path.endsWith(".driver.js"));
  assert.ok(drv.content.includes('"name": "Sturmnacht"'));
  const params = JSON.parse(drv.content.match(/const MOMENTS = ([\s\S]*?);\n/)[1].replace(/\n  /g, "\n"));
  assert.strictEqual(params["Sturmnacht"].dayNight, 1);
  assert.strictEqual(params["Sturmnacht"].rain, 1);
});

console.log(`test_import: ${n} passed`);
