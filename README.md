# TRIVIUM

**Ein universeller Game Translation & Realization Compiler.**
Grammatik · Rhetorik · Logik — die drei Grundpfeiler des Triviums,
übertragen auf Spielwelten.

> Engines sind natürliche Sprachen und Brennöfen.
> Übersetze niemals bloß Syntax oder Dateiendungen.
> Berge Bedeutung, forme neu und beweise Funktion.

Eine Welt wird **einmal** als Bedeutung formuliert (WIR — World Intermediate
Representation) und anschließend in geeignete Zielsprachen und Projektionen
überführt: SHADED, Godot, LÖVE, Ren'Py, Unity, Unreal — 2D, 2.5D, 3D, Audio,
Text oder andere Formen.

TRIVIUMs erweiterte Richtung behandelt außerdem Assets, Shader, Code,
Legacy-Spiele und vorhandene Konverter als Quellen beziehungsweise Werkzeuge.
TRIVIUM soll nicht jeden Konverter neu bauen. Es beschreibt Verpflichtungen,
plant Toolchains, dokumentiert Verluste und lässt Ergebnisse durch Evidence
prüfen.

## Schnellstart

```bash
node tools/verify.js
# → 139 Tests, dann beide Beispielwelten in alle sechs Zielsprachen:
#   tools/verify-out/<welt>/{shaded,godot,love2d,renpy,unity,unreal}/
```

Kein `npm install`. Null Dependencies. Pures Node.

Oder direkt über das CLI:

```bash
node bin/trivium.js --list
node bin/trivium.js meine-welt.json --target shaded,godot
node bin/trivium.js examples/dorf-sturmnacht.js --out out/
# Exit 2 = Konzepte in needs_human_review — Enthaltung ist Sicherheit.
```

Live-Verifikation gegen eine echte SHADED-Instanz:

```bash
npm i --no-save playwright
node tools/verify-live.js
# → Verhaltens-Assertions + Screenshots + Roundtrip
```

## Die Idee in 20 Zeilen

```js
const T = require("./packages/trivium-core");

const w = T.createWorld({ id: "mein-dorf", dims: "2.5d" });
T.addEntity(w, { id: "waechterin", kind: "character", name: "Die Wächterin" });
T.addMoment(w, { id: "sturmnacht", label: "Sturmnacht", durationSec: 10,
  intents: { timeOfDay: 1, precipitation: 1, coldness: 0.48, tension: 1 } });
T.setArc(w, ["sturmnacht"]);
T.addState(w, { id: "vertrauen", visibility: "hidden" });
T.addRule(w, { id: "oeffnung",
  when: { trigger: "ansprechen", conditions: [{ state: "vertrauen", gte: 1 }] },
  then: [{ hint: "Sie nickt." }],
  onFail: [{ hint: "Noch nicht. Aber du lernst, woran es liegt." }] });

const reg = T.createRegistry();
reg.register(require("./adapters/shaded/adapter").adapter);
const { artifacts, report } = T.translate(w, "shaded", reg);
```

Dieselbe Welt wird unverändert durch Zieladapter übersetzt. Was eine
Zielsprache nicht sagen kann, sagt ihr Ledger.

## Drei Ebenen

| Pfeiler | In TRIVIUM | Stratum |
|---|---|---|
| **Grammatik** | Was existiert und wie es gebunden ist | Entities, Relationen, Räume |
| **Rhetorik** | Wie die Welt erfahrbar wird | Intents, Momente, Bogen, Wahrnehmung |
| **Logik** | Warum die Welt reagiert | State, Regeln, Maschinen, Gedächtnis |

## Erweiterte Architektur

```text
Quelle
Idea | Asset | Scene | Shader | Code | Legacy Game
                         │
                         ▼
WIR / AIR / SIR / EIR / FIR / PIR
                         │
                         ▼
Realization Contracts + Capability Graph
                         │
                         ▼
Existing Tools + Engine Adapters + ANVIL/MYTHIC
                         │
                         ▼
Unity | Unreal | Godot | 2D | 3D | Audio | Text
                         │
                         ▼
CUE Evidence + Loss/Gain Ledger
```

Der aktuelle Code implementiert den WIR-Kern, sechs Zieladapter, Routing,
Ledger und Kohärenz. Die Asset-, Toolchain-, Code-Esperanto-, Field-first- und
Engine-Federation-Schichten sind in den Dokumenten als nächste kanonische
Entwicklungsrichtung spezifiziert. Dokumentation unterscheidet ausdrücklich
zwischen implementiert und geplant.

## Architektur des aktuellen Codes

```text
packages/trivium-core/
  src/wir.js               WIR: drei Strata
  src/router.js            Protect → Structure → Route → Realize
  src/ledger.js            Verlust-/Gewinn-Rechenschaft
  src/coherence.js         Konsistenz und Lernbarkeit
  src/registry.js          Adapter-Registry
adapters/
  shaded/
  godot/
  love2d/
  renpy/
  unity/
  unreal/
examples/
test/
tools/verify.js
```

Der Router überträgt Manifolds Stage-0–3-Denken auf Weltendesign. Unbekannte
Konzepte werden nicht geraten. Die Kohärenz-Engine trägt adult_games
Anti-Chore-Loop-Hypothese: wiederholte Fehlversuche müssen lernbaren Fortschritt
erzeugen.

## Dokumente

- [`docs/trivium-canon.md`](docs/trivium-canon.md) — Kanon v1.1, Scope und Invarianten
- [`docs/architecture-v1.1.md`](docs/architecture-v1.1.md) — vollständige Realization-Pipeline
- [`docs/wir-spec.md`](docs/wir-spec.md) — WIR v1.0.0 und Anbindung der neuen IRs
- [`docs/realization-contracts.md`](docs/realization-contracts.md) — Asset-, Function-, Perception- und Scene-Contracts
- [`docs/loss-taxonomy.md`](docs/loss-taxonomy.md) — Routen, Verluste, Gewinne und Evidence
- [`docs/engine-dolmetscher.md`](docs/engine-dolmetscher.md) — Toolchain Planner, Code-Esperanto, Reverse Engineering und Engine Federation
- [`docs/tool-candidate-catalog.md`](docs/tool-candidate-catalog.md) — essenzieller Kandidatenkatalog aus der Converter-Recherche

## Verwandte Repos

- [`lootziffer666/SHADED`](https://github.com/lootziffer666/SHADED) — rhetorische und field-first Projektion
- [`lootziffer666/FLOW-SPIN-SMASH`](https://github.com/lootziffer666/FLOW-SPIN-SMASH) — MANIFOLD-Routing und Traceability
- [`lootziffer666/adult_game`](https://github.com/lootziffer666/adult_game) — relationale Weltreaktion und Anti-Chore-Loop

## Leitsatz

> Ein Nutzer soll ungefiltert sagen können: Dieses Asset, diese Idee oder dieses
> alte Spiel gefällt mir. Mach daraus diese kleine spielbare Form.
>
> Die Engine darf dabei Kosten und Fähigkeiten bestimmen — aber niemals der
> kreative Türsteher sein.
