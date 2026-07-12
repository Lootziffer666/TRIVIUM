/*!
 * Example world: "Dorf in der Sturmnacht"
 *
 * SHADED's own founding story (Akte tag → aufzug → sturmnacht → danach),
 * expressed once as MEANING — and therefore translatable to every adapter.
 * The same file compiles to a SHADED storyboard+driver, a Godot scene,
 * a LÖVE game and a Ren'Py flow. What each target cannot say, its ledger
 * says instead.
 */
"use strict";

const T = require("../packages/trivium-core");

function build() {
  const w = T.createWorld({
    id: "dorf-sturmnacht",
    title: "Dorf in der Sturmnacht",
    description: "Ein Fachwerkdorf durchlebt einen Sturm: goldener Tag, Aufzug, Sturmnacht, der Tag danach.",
    dims: "2.5d",
  });

  // ── Grammatik ─────────────────────────────────────────────────────────
  T.addEntity(w, { id: "dorf", kind: "place", name: "Das Dorf", tags: ["village"], props: { hint: "Gesamtszene" } });
  T.addEntity(w, { id: "haus_baecker", kind: "thing", name: "Haus des Bäckers", tags: ["building", "wood"], props: { hint: "Fachwerk, Fenster pink markieren" } });
  T.addEntity(w, { id: "dorfweg", kind: "thing", name: "Dorfweg", tags: ["path"], props: { hint: "Senken sammeln Pfützen" } });
  T.addEntity(w, { id: "brunnen", kind: "thing", name: "Alter Brunnen", tags: ["water", "rock"], props: {} });
  T.addEntity(w, { id: "waechterin", kind: "character", name: "Die Wächterin", tags: [], props: { anim: "idle", depthLayer: "mid" } });
  T.addEntity(w, { id: "zerbrochene_laterne", kind: "evidence", name: "Zerbrochene Laterne", tags: [], props: { hint: "erst nach dem Sturm auffindbar" } });

  T.addRelation(w, { id: "r_dorf_haus", type: "contains", from: "dorf", to: "haus_baecker" });
  T.addRelation(w, { id: "r_dorf_weg", type: "contains", from: "dorf", to: "dorfweg" });
  T.addRelation(w, { id: "r_dorf_brunnen", type: "contains", from: "dorf", to: "brunnen" });
  T.addRelation(w, { id: "r_weg_haus", type: "adjacent", from: "dorfweg", to: "haus_baecker" });
  T.addRelation(w, { id: "r_waechterin_dorf", type: "knows", from: "waechterin", to: "dorf" });
  T.addRelation(w, { id: "r_laterne_sturm", type: "reveals", from: "zerbrochene_laterne", to: "waechterin" });

  T.addSpace(w, {
    id: "dorfplatz", dims: "2.5d", topology: "open",
    anchors: {
      haus_baecker: { x: 0.62, y: 0.55 },
      dorfweg: { x: 0.45, y: 0.85 },
      brunnen: { x: 0.30, y: 0.70 },
      waechterin: { x: 0.40, y: 0.80 },
      zerbrochene_laterne: { x: 0.55, y: 0.82 },
    },
  });

  // ── Rhetorik ──────────────────────────────────────────────────────────
  T.addMoment(w, {
    id: "goldener_tag", label: "Goldener Tag", durationSec: 6,
    intents: { timeOfDay: 0.0, turbulence: 0.05, precipitation: 0, wetness: 0, visibility: 0.05, wind: 0.3, warmthLight: 0.1, decay: 0, coldness: 0.3, tension: 0.05 },
  });
  T.addMoment(w, {
    id: "sturm_zieht_auf", label: "Sturm zieht auf", durationSec: 8,
    intents: { timeOfDay: 0.45, turbulence: 0.8, precipitation: 0.45, wetness: 0.45, visibility: 0.25, wind: 0.85, warmthLight: 0.55, coldness: 0.44, tension: 0.6 },
  });
  T.addMoment(w, {
    id: "sturmnacht", label: "Sturmnacht", durationSec: 10,
    intents: { timeOfDay: 1, turbulence: 1, precipitation: 1, wetness: 1, visibility: 0.4, wind: 1, warmthLight: 1, coldness: 0.48, tension: 1 },
  });
  T.addMoment(w, {
    id: "der_tag_danach", label: "Der Tag danach", durationSec: 8,
    intents: { timeOfDay: 0.04, turbulence: 0.08, precipitation: 0, wetness: 0.75, visibility: 0.02, wind: 0.35, warmthLight: 0.12, coldness: 0.38, tension: 0.15, intimacy: 0.4 },
  });
  T.setArc(w, ["goldener_tag", "sturm_zieht_auf", "sturmnacht", "der_tag_danach"]);

  // ── Logik (adult_game layering) ───────────────────────────────────────
  T.addState(w, { id: "vertrauen_waechterin", scope: "waechterin", initial: 0, visibility: "hidden" });
  T.addState(w, { id: "sturmschaden", scope: "world", initial: 0, visibility: "hidden" });
  T.addState(w, { id: "laterne_gefunden", scope: "world", initial: false, visibility: "visible" });

  T.addRule(w, {
    id: "sturm_beschaedigt_dorf",
    when: { trigger: "moment_sturmnacht" },
    then: [
      { set: "sturmschaden", add: 2 },
      { hint: "Der Wind reißt an den Dächern." },
    ],
  });
  T.addRule(w, {
    id: "waechterin_oeffnet_sich",
    when: {
      trigger: "anspreche_waechterin",
      conditions: [{ state: "sturmschaden", gte: 2 }],
    },
    then: [
      { set: "vertrauen_waechterin", add: 1 },
      { hint: "Die Wächterin nickt: 'Du warst also auch draußen, in jener Nacht.'" },
    ],
    onFail: [
      { hint: "Die Wächterin mustert dich nur. Vielleicht, wenn ihr etwas gemeinsam erlebt habt." },
    ],
  });
  T.addRule(w, {
    id: "laterne_auffindbar",
    when: {
      trigger: "untersuche_dorfweg",
      conditions: [{ state: "sturmschaden", gte: 2 }],
    },
    then: [
      { set: "laterne_gefunden", to: true },
      { moment: "der_tag_danach" },
      { hint: "Zwischen den Pfützen: eine zerbrochene Laterne. Wessen?" },
    ],
    onFail: [
      { hint: "Der Weg liegt ruhig da. Noch verrät er nichts." },
    ],
    exclusiveGroup: "dorfweg_fund",
    priority: 1,
  });

  T.addMachine(w, {
    id: "wetterlage",
    states: ["ruhe", "aufzug", "sturm", "nachwehen"],
    initial: "ruhe",
    transitions: [
      { from: "ruhe", to: "aufzug", on: "druck_faellt" },
      { from: "aufzug", to: "sturm", on: "front_erreicht" },
      { from: "sturm", to: "nachwehen", on: "front_durch" },
      { from: "nachwehen", to: "ruhe", on: "abgetrocknet" },
    ],
  });

  T.addMemory(w, { id: "dorfchronik", records: "attempts", surfaces: "hint" });

  return w;
}

module.exports = { build };
