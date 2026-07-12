# TRIVIUM

**Ein universeller Game Translation Compiler.**
Grammatik · Rhetorik · Logik — die drei Grundpfeiler des Triviums,
übertragen auf Spielwelten.

> Engines sind natürliche Sprachen. Übersetze niemals Syntax.
> Übersetze Bedeutung. Jede Übersetzung dokumentiert ihren Verlust.
> Jede Semantik bietet neue Möglichkeiten.

Eine Welt wird **einmal** als Bedeutung formuliert (WIR — World Intermediate
Representation) und in beliebige Engines übersetzt: SHADED, Godot, LÖVE,
Ren'Py, Unity, Unreal — heute; was auch immer — als weiteres Plugin. 2D,
2.5D, 3D. Windows, Linux, macOS. Die Kernbibliothek kennt keine Engine.
Es gibt keinen Architektur-Rassismus, nur Sprachen mit verschiedenen
Registern.

## Schnellstart

```bash
node tools/verify.js
# → 48 Tests, dann beide Beispielwelten in alle sechs Zielsprachen:
#   tools/verify-out/<welt>/{shaded,godot,love2d,renpy,unity,unreal}/ mit Artefakten + TRANSLATION_REPORT.md
```

Kein `npm install`. Null Dependencies. Pures Node.

Oder direkt über das CLI — eine Welt als reine JSON-Datei, kein
JavaScript nötig (dieselben Builder validieren beide Wege; das emittierte
`<id>.wir.json` ist selbst wieder gültige Eingabe, Round-Trip bitidentisch):

```bash
node bin/trivium.js --list                                   # Adapter zeigen
node bin/trivium.js meine-welt.json --target shaded,godot    # übersetzen
node bin/trivium.js examples/dorf-sturmnacht.js --out out/   # .js geht auch
# Exit 2 = übersetzt, aber Konzepte in needs_human_review — Enthaltung ist
# Sicherheit, kein Erfolg.
```

Und der Beweis, dass die Übersetzung nicht nur emittiert wird, sondern
**lebt** — der generierte Driver, ausgeführt im echten `window.SHADED`
(headless Chromium, Schwester-Repo `../SHADED`):

```bash
npm i --no-save playwright
node tools/verify-live.js
# → 16 Verhaltens-Assertions in der echten Engine: Storyboard installiert,
#   Momente setzen Parameter, Fehlversuche lehren, der Laternen-Fund
#   wechselt die Welt in 'Der Tag danach', die Wächterin betritt als
#   Actor sichtbar die Szene. Screenshots: tools/verify-out/live_*.png
#   VERIFY-LIVE: PASS
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
// artifacts: abspielbares SHADED-Storyboard + Logik-Driver + Marker-Brief
//            + die WIR selbst (das Original reist immer mit)
// report:    was nativ gesprochen, was überbrückt, was verloren, was gewonnen
```

Dieselbe Welt, unverändert, durch `godot`, `love2d` oder `renpy` übersetzt,
ergibt eine Godot-Szene + GDScript-Weltskript, ein lauffähiges
LÖVE-Scaffold oder einen Ren'Py-Flow mit verdeckter Beziehungslogik. Was
eine Zielsprache nicht sagen kann, sagt stattdessen ihr Ledger.

Und es geht auch **rückwärts** (`adapters/shaded/importer.js`): ein
SHADED-Storyboard — live aus `window.SHADED.story.board()` gezogen — wird
zurück auf Bedeutung gehoben (`paramsToIntents`: dayNight → timeOfDay,
temperature → 1−coldness, snowfall → precipitation bei Kälte) und dann in
jede andere Sprache übersetzt. Engine → WIR → Engine, der volle Kreis;
verify-live führt ihn bei jedem Lauf aus. Parameter ohne
Bedeutungs-Gegenstück (`flash`, `bleach`, …) werden nicht geraten, sondern
als Import-Verlust dokumentiert — Enthaltung gilt in beide Richtungen.

## Warum „Trivium"?

| Pfeiler | In TRIVIUM | Stratum |
|---|---|---|
| **Grammatik** | Was existiert, wie es gebunden ist | `grammar`: Entities, Relationen, Räume |
| **Rhetorik** | Wie die Welt den Spieler anspricht | `rhetoric`: Intent-Achsen (0..1), Momente, Bogen |
| **Logik** | Warum die Welt reagiert und kohärent bleibt | `logic`: State, Regeln, Maschinen, Gedächtnis |

## Architektur

```
packages/trivium-core/     der Kern — kennt KEINE Engine
  src/wir.js               WIR: drei Strata, geschlossener Intent-Kanon
  src/router.js            Stage 0–3: Protect → Structure → Route → Realize
  src/ledger.js            Routen + Verlust-/Gewinn-Rechenschaft (ruleId + reason)
  src/coherence.js         Konsistenz, Kohärenz, Wiederspielbarkeits-Metriken
  src/registry.js          Adapter = Plugins mit Capability-Manifesten
adapters/
  shaded/                  → window.SHADED: Storyboard, Params, Actors, Marker-Brief
  godot/                   → .tscn-Szene + GDScript-Weltskript
  love2d/                  → main.lua + Welt-Modul
  renpy/                   → .rpy mit adult_game-Vier-Schichten-Logik
  unity/                   → <Id>World.cs (MonoBehaviour baut die Welt zur Laufzeit)
  unreal/                  → <Id>World.h/.cpp (AActor, alles BlueprintCallable)
examples/                  zwei Welten (Dorf 2.5D, Turm 3D), sechs Sprachen
test/                      48 Tests, pures Node
tools/verify.js            alles in einem Lauf
```

Der Router ist Manifolds Stage-0–3-Denken (FLOW-SPIN-SMASH,
`research/MANIFOLD_CANON_v0.7.md`), übertragen aufs Weltendesign: erst
schützen, dann strukturieren, dann routen, dann erst sprechen. Unbekannte
Konzepte werden nicht geraten — sie routen `unknown` und verlangen
menschliche Prüfung. Passivität ist Sicherheit.

Die Kohärenz-Engine trägt adult_games Labor-Hypothese in sich: *wiederholte
Fehlversuche müssen lernbaren Fortschritt erzeugen.* Eine gated Rule ohne
`onFail` ist ein dokumentiertes Chore-Loop-Risiko.

## Dokumente

- [`docs/trivium-canon.md`](docs/trivium-canon.md) — Gründungskanon, Invarianten, Abstammung
- [`docs/wir-spec.md`](docs/wir-spec.md) — WIR-Format v1.0.0
- [`docs/loss-taxonomy.md`](docs/loss-taxonomy.md) — Routen, Verlust-Pflicht, Gewinn-Pflicht
- [`docs/engine-dolmetscher.md`](docs/engine-dolmetscher.md) — Roadmap für Assets, Shader und Engine-Sprech-Corpus

## Verwandte Repos

- [`lootziffer666/SHADED`](https://github.com/lootziffer666/SHADED) — erster fließend rhetorischer Zieladapter
- [`lootziffer666/FLOW-SPIN-SMASH`](https://github.com/lootziffer666/FLOW-SPIN-SMASH) — Manifold: Routing-Denken, Traceability-Gesetze
- [`lootziffer666/adult_game`](https://github.com/lootziffer666/adult_game) — Vier-Schichten-Logik, Anti-Chore-Loop-Hypothese
