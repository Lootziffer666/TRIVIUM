/*!
 * TRIVIUM importer: SHADED → WIR (die Rückübersetzung)
 *
 * Ein Übersetzer, der nur in eine Richtung spricht, ist ein Emitter.
 * Dieser Importer liest SHADEDs Oberflächenform — Storyboards
 * ({name, dur, p} mit Engine-Parametern) — und hebt sie zurück auf
 * Bedeutung: WIR-Momente mit Intent-Achsen.
 *
 * Dieselben Gesetze wie beim Export, nur gespiegelt:
 *   - Bedeutung, nie Syntax: Parameter werden auf Achsen abgebildet
 *     (dayNight → timeOfDay, temperature → 1−coldness, snowfall/rain →
 *     precipitation), nie durchgereicht.
 *   - Verlust-Pflicht: Parameter ohne Bedeutungs-Gegenstück (flash,
 *     bleach, bleeding, …) werden NICHT geraten — sie landen dokumentiert
 *     im Import-Report. Enthaltung ist Sicherheit.
 *   - Absorption ist kein Verlust: puddle geht in wetness auf, snow
 *     (Decke) in precipitation+coldness — das wird als 'absorbed'
 *     ausgewiesen, damit nichts still verschwindet.
 */
"use strict";

const T = require("../../packages/trivium-core");

// Umkehrabbildung zu intentsToParams (adapter.js) — 1:1-Achsen zuerst
const PARAM_TO_AXIS = {
  dayNight: "timeOfDay",
  storm: "turbulence",
  wet: "wetness",
  fog: "visibility",
  wind: "wind",
  glow: "warmthLight",
  decay: "decay",
  autumn: "seasonAutumn",
  bloom: "seasonBloom",
};
// Parameter, die in anderen Achsen aufgehen (kein eigener Verlust)
const ABSORBED = {
  puddle: "wetness (Pfützen sind abgeleitete Nässe)",
  snow: "precipitation + coldness (Schneedecke folgt kaltem Niederschlag)",
  rain: "precipitation",
  snowfall: "precipitation",
  temperature: "coldness (invertiert)",
};

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function r3(x) { return Math.round(x * 1000) / 1000; }

/** Engine-Parameter → Intent-Achsen. Gibt { intents, losses, absorbed } zurück. */
function paramsToIntents(p) {
  const intents = {};
  const losses = [];
  const absorbed = [];

  for (const [param, axis] of Object.entries(PARAM_TO_AXIS)) {
    if (p[param] != null) intents[axis] = r3(clamp01(p[param]));
  }
  if (p.temperature != null) {
    intents.coldness = r3(clamp01(1 - p.temperature));
    absorbed.push({ param: "temperature", into: ABSORBED.temperature });
  }
  if (p.snowfall != null && p.snowfall > 0) {
    // kalte Oberflächenform: Schneefall IST Niederschlag bei Kälte
    intents.precipitation = r3(clamp01(p.snowfall));
    if (intents.coldness == null || intents.coldness < 0.6) intents.coldness = 0.7;
    absorbed.push({ param: "snowfall", into: ABSORBED.snowfall });
    if (p.rain != null) absorbed.push({ param: "rain", into: "precipitation (Schnee dominiert)" });
  } else if (p.rain != null) {
    intents.precipitation = r3(clamp01(p.rain));
    absorbed.push({ param: "rain", into: ABSORBED.rain });
  }
  if (p.puddle != null) absorbed.push({ param: "puddle", into: ABSORBED.puddle });
  if (p.snow != null) absorbed.push({ param: "snow", into: ABSORBED.snow });

  const known = new Set([...Object.keys(PARAM_TO_AXIS), "temperature", "rain", "snowfall", "puddle", "snow"]);
  for (const k of Object.keys(p)) {
    if (!known.has(k)) {
      losses.push({
        param: k, value: p[k],
        ruleId: "TRV-IMP-UNKNOWN-PARAM",
        reason: `'${k}' hat kein Bedeutungs-Gegenstück im Intent-Kanon — nicht geraten, dokumentiert ausgelassen`,
      });
    }
  }
  return { intents, losses, absorbed };
}

/**
 * importStoryboard(meta, steps) → { world, report }
 * steps: SHADED-Storyboard [{name, dur, p}] (z. B. live aus
 * window.SHADED.story.board()). Die Welt entsteht durch die normalen
 * Builder — alle WIR-Gesetze gelten auch für Importe.
 */
function importStoryboard(meta, steps) {
  const world = T.createWorld({ dims: "2d", ...meta });
  const report = { source: "shaded.storyboard", moments: steps.length, losses: [], absorbed: [] };
  const seen = new Map();

  for (const step of steps) {
    let id = slug(step.name);
    const count = (seen.get(id) || 0) + 1;
    seen.set(id, count);
    if (count > 1) id = `${id}_${count}`;

    const { intents, losses, absorbed } = paramsToIntents(step.p || {});
    T.addMoment(world, { id, label: step.name, durationSec: step.dur, intents });
    for (const l of losses) report.losses.push({ moment: id, ...l });
    for (const a of absorbed) report.absorbed.push({ moment: id, ...a });
  }
  T.setArc(world, [...world.rhetoric.moments.map((m) => m.id)]);
  return { world, report };
}

function slug(name) {
  const s = name
    .replace(/ä/gi, "ae").replace(/ö/gi, "oe").replace(/ü/gi, "ue").replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return s || "moment";
}

module.exports = { paramsToIntents, importStoryboard };
