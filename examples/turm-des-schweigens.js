/*!
 * Example world: "Turm des Schweigens"
 *
 * Das Gegenstück zum Dorf: 3D statt 2.5D, innen statt außen, Intimität
 * statt Wetter, Evidenz statt Sturm. Absichtlich so gebaut, dass jede
 * Zielsprache ANDERS verliert:
 *   - SHADED verliert den Raum (3D → Parallaxe) und die Intimität,
 *     spricht aber Nacht/Nebel/Warmlicht fließend
 *   - Ren'Py verliert den Raum ganz, spricht aber Beichte, Schuld und
 *     Tagebuch-Evidenz wie eine Muttersprache
 *   - LÖVE muss den 3D-Raum inert mitführen (preserve)
 *   - Godot spricht fast alles — und gewinnt Physik, die niemand bestellte
 * Zwei Welten, vier Sprachen, acht verschiedene Verlustprofile:
 * genau das ist der Beweis, dass Übersetzung stattfindet.
 */
"use strict";

const T = require("../packages/trivium-core");

function build() {
  const w = T.createWorld({
    id: "turm-des-schweigens",
    title: "Turm des Schweigens",
    description: "Ein Mönch, ein versiegeltes Tagebuch, eine Mitternachtsbeichte hoch über dem Nebel.",
    dims: "3d",
  });

  // ── Grammatik ─────────────────────────────────────────────────────────
  T.addEntity(w, { id: "turm", kind: "place", name: "Der Turm", tags: ["rock"], props: { hint: "Fels, kein Fachwerk" } });
  T.addEntity(w, { id: "skriptorium", kind: "zone", name: "Skriptorium", tags: [], props: { hint: "oberste Kammer" } });
  T.addEntity(w, { id: "bruder_alwin", kind: "character", name: "Bruder Alwin", tags: [], props: { anim: "idle", depthLayer: "mid" } });
  T.addEntity(w, { id: "tagebuch", kind: "evidence", name: "Das versiegelte Tagebuch", tags: [], props: { hint: "erst nach der Beichte lesbar" } });
  T.addEntity(w, { id: "siegel", kind: "thing", name: "Wachssiegel", tags: [], props: {} });

  T.addRelation(w, { id: "t_turm_skript", type: "contains", from: "turm", to: "skriptorium" });
  T.addRelation(w, { id: "t_skript_buch", type: "contains", from: "skriptorium", to: "tagebuch" });
  T.addRelation(w, { id: "t_alwin_buch", type: "owns", from: "bruder_alwin", to: "tagebuch" });
  T.addRelation(w, { id: "t_alwin_siegel", type: "fears", from: "bruder_alwin", to: "siegel" });
  T.addRelation(w, { id: "t_siegel_blockt", type: "blocks", from: "siegel", to: "tagebuch" });
  T.addRelation(w, { id: "t_buch_offenbart", type: "reveals", from: "tagebuch", to: "bruder_alwin" });

  T.addSpace(w, {
    id: "turminneres", dims: "3d", topology: "rooms",
    anchors: {
      skriptorium: { x: 0.5, y: 0.15, z: 0.9 },
      bruder_alwin: { x: 0.45, y: 0.2, z: 0.9 },
      tagebuch: { x: 0.6, y: 0.18, z: 0.92 },
      siegel: { x: 0.6, y: 0.17, z: 0.92 },
    },
  });

  // ── Rhetorik: Innenwelt statt Wetter ──────────────────────────────────
  T.addMoment(w, {
    id: "daemmerstunde", label: "Dämmerstunde", durationSec: 6,
    intents: { timeOfDay: 0.6, visibility: 0.5, warmthLight: 0.3, coldness: 0.55, tension: 0.3, intimacy: 0.4, wind: 0.15 },
  });
  T.addMoment(w, {
    id: "mitternachtsbeichte", label: "Mitternachtsbeichte", durationSec: 12,
    intents: { timeOfDay: 1, visibility: 0.3, warmthLight: 0.7, coldness: 0.6, tension: 0.65, intimacy: 1 },
  });
  T.addMoment(w, {
    id: "bruch_des_siegels", label: "Der Bruch des Siegels", durationSec: 8,
    intents: { timeOfDay: 1, visibility: 0.1, warmthLight: 0.9, tension: 0.9, intimacy: 0.8, decay: 0.2 },
  });
  T.setArc(w, ["daemmerstunde", "mitternachtsbeichte", "bruch_des_siegels"]);

  // ── Logik: Schuld ist verdeckt, Schweigen ist ein Zustand ─────────────
  T.addState(w, { id: "beichte_gehoert", scope: "world", initial: false, visibility: "hidden" });
  T.addState(w, { id: "schuld_alwin", scope: "bruder_alwin", initial: 3, visibility: "hidden" });
  T.addState(w, { id: "tagebuch_gelesen", scope: "world", initial: false, visibility: "visible" });

  T.addRule(w, {
    id: "beichte_hoeren",
    when: { trigger: "warte_bei_alwin", conditions: [{ state: "schuld_alwin", gte: 3 }] },
    then: [
      { set: "beichte_gehoert", to: true },
      { set: "schuld_alwin", add: -1 },
      { moment: "mitternachtsbeichte" },
      { hint: "Alwin beginnt zu sprechen, ohne dich anzusehen." },
    ],
    onFail: [
      { hint: "Alwin schweigt. Seine Schuld ist noch nicht schwer genug, um sich Bahn zu brechen." },
    ],
  });
  T.addRule(w, {
    id: "siegel_brechen",
    when: { trigger: "oeffne_tagebuch", conditions: [{ state: "beichte_gehoert", eq: true }] },
    then: [
      { set: "tagebuch_gelesen", to: true },
      { moment: "bruch_des_siegels" },
      { hint: "Das Wachs gibt nach. Die erste Seite trägt deinen Namen." },
    ],
    onFail: [
      { hint: "Das Siegel hält. Wer lesen will, muss erst zuhören." },
    ],
    exclusiveGroup: "tagebuch",
    priority: 1,
  });
  T.addRule(w, {
    id: "schuld_waechst_nachts",
    when: { trigger: "moment_mitternachtsbeichte" },
    then: [{ set: "schuld_alwin", add: 1 }],
  });

  T.addMachine(w, {
    id: "siegelzustand",
    entity: "siegel",
    states: ["intakt", "angebrochen", "gebrochen"],
    initial: "intakt",
    transitions: [
      { from: "intakt", to: "angebrochen", on: "beichte_gehoert" },
      { from: "angebrochen", to: "gebrochen", on: "tagebuch_geoeffnet" },
    ],
  });

  T.addMemory(w, { id: "nachtprotokoll", records: "attempts", surfaces: "hint" });

  return w;
}

module.exports = { build };
