# Engine-Dolmetscher — semantische Realisierung über vorhandene Werkzeuge

**Status:** Kanonischer Entwurfsauftrag nach WIR v1.0.0 und TRIVIUM-Kanon v1.1. Die Tool Capability Registry v0.1 ist als JSON-Manifestbestand unter `registry/tools/` implementiert; das Code-Esperanto-Corpus-Schema v0.1 ist mit fünf Beweislemmata unter `corpus/lemmata/` implementiert. Planner und Ausführung folgen.

Dieses Dokument beschreibt die Erweiterung vom Welt-Compiler zum Dolmetscher
zwischen Engine-, Asset-, Code- und Wahrnehmungssprachen. TRIVIUM implementiert
nicht jeden Konverter selbst. Es plant, verkettet und überprüft vorhandene
Werkzeuge anhand neutraler Verträge.

## 1. Zielbild

TRIVIUM soll eine Idee, Szene, ein Asset, einen Shader oder ein Gameplay-Idiom
nicht als Dateiendung behandeln, sondern als Quelle mit Verpflichtungen.

Beispiele:

- Ein Unity-Prefab soll in Unreal, Godot oder als Sprite funktionieren.
- Eine Unreal-Szene darf als Unity-Kapitel bestehen bleiben, wenn eine
  Transkription unverhältnismäßig oder schlechter wäre.
- Ein 3D-Charakter darf zu 2D, Pixel Art, Voxel oder Audiohinweis werden, wenn
  seine benötigte Rolle erhalten bleibt.
- Ein Shader soll möglichst aus seiner visuellen und funktionalen Bedeutung
  rekonstruiert werden, nicht durch blinde Textsubstitution.
- Dekompilierter Code soll nach Beziehungen und Funktionen gruppiert werden,
  bevor ein LLM neuen Zielcode erzeugt.

Der zentrale Pfad lautet:

```text
Quelle
→ Inspect
→ semantische IRs und Contracts
→ Capability Graph
→ Toolchain Plan
→ Ausführung durch ANVIL/MYTHIC
→ Verifikation durch CUE
→ Zielartefakt + Ledger
```

## 2. Zwischenrepräsentationen

TRIVIUM behält WIR für Weltbedeutung. Für Realisierung und Rückgewinnung kommen
spezialisierte IRs hinzu.

| IR | Aufgabe | Beispiele |
|---|---|---|
| **WIR — World IR** | Weltstruktur, Wirkung und Kausalität | Entities, Beziehungen, Regeln, Gedächtnis, Momente |
| **AIR — Asset IR** | Rolle und technische Bestandteile eines Assets | Mesh, Skeleton, Animation, Materialslots, Collider, Pivot, LOD, Lizenz |
| **SIR — Shader IR** | Material- und Wahrnehmungsabsicht | PBR, UV-Räume, Vertexdeformation, Masken, Blend/Depth, Zeitfunktion |
| **EIR — Engine Idiom IR** | Enginekonzepte ohne Bindung an ihre Syntax | Prefab/Actor/Node, Component, Signal/Event, DataAsset, Scene Tree |
| **FIR — Function IR** | Codefunktion und Verhaltensvertrag | Inputs, State, Effects, Lifecycle, Invarianten, Fehlerpfade |
| **PIR — Perception IR** | Wahrnehmungskanäle und Lesbarkeit | visuell, Audio, Sprache, Haptik, Timing, räumliche Orientierung |
| **TIR — Toolchain IR** | ausführbarer Transformationsplan | Schritte, Inputs, Outputs, Versionen, Fallbacks, Evidence |

Diese IRs ersetzen keine glTF-, FBX-, `.uasset`-, `.prefab`-, Shader- oder
Quellcodedateien. Sie beschreiben, was diese Dateien bedeuten, welche Rolle sie
im Ziel erfüllen sollen und welche Route belegbar ist.

## 3. Tool Capability Registry

Jedes vorhandene Werkzeug wird als Capability-Manifest registriert.

```yaml
id: assetripper
source: github
license: GPL-3.0
execution:
  mode: cli-or-app
  headless: partial
accepts:
  - unity.assets
  - unity.assetbundle
produces:
  - unity.project
  - mesh
  - texture
  - animation
capabilities:
  - extract
  - reconstruct_dependencies
constraints:
  - unity_version_sensitive
  - rights_of_processed_assets_not_granted
status: candidate
```

Pflichtangaben:

- genaue Quelle und Version,
- Lizenz des Werkzeugs,
- Lizenz-/Provenienzanforderungen für Eingaben,
- akzeptierte und erzeugte Formate,
- semantische Fähigkeiten,
- CLI-, Headless- oder Editorbindung,
- Betriebssystem- und Engineversionen,
- bekannte Verluste,
- deterministische oder interaktive Ausführung,
- Evidenzstatus und Confidence.

TRIVIUM darf kostenlose, kommerzielle und lokale Werkzeuge führen. Ein
zuverlässiges 45-Euro-Plugin kann für eine konkrete Route günstiger und besser
sein als eine Woche Eigenentwicklung. Lizenz, Preis und Automatisierbarkeit
sind Planungsparameter, keine ideologischen Ausschlusskriterien.

## 4. Transformation Graph

Werkzeuge werden nicht als isolierte Favoritenliste geführt, sondern als Kanten
in einem gerichteten Graphen.

```text
Unity Prefab
→ Unity extractor
→ neutral mesh/texture/skeleton
→ Blender normalization
→ glTF/FBX
→ Unreal importer
→ material reconstruction
→ target fixture
```

Oder:

```text
Animated 3D character
→ rig inspection
→ animation selection
→ headless Blender render
→ trim/segment
→ atlas pack
→ engine sprite resource
```

Der Planner bewertet mögliche Pfade nach:

- Vertragserfüllung,
- Verlust und Confidence,
- Installations- und Laufzeitkosten,
- Lizenz,
- vorhandenen Werkzeugen,
- Headless-Fähigkeit,
- GPU-/RAM-Bedarf,
- Wartungszustand,
- Anzahl menschlicher Eingriffe,
- Beweisbarkeit.

## 5. Asset-Dolmetschen

AIR beschreibt nicht nur das Original, sondern die im Ziel benötigte Rolle.

```yaml
asset:
  id: guard
  role: humanoid_guard
source:
  engine: unity
  type: prefab
contains:
  mesh: true
  skeleton: humanoid
  animations: [idle, walk, attack]
  material_model: urp_pbr
required_by_target:
  - recognizable_silhouette
  - idle
  - walk
  - collision
optional:
  - facial_rig
  - cloth
```

Mögliche Routen:

- **direct:** vorhandenes neutrales Format direkt importieren.
- **normalize:** Units, Achsen, Pivot, Channels oder Benennung korrigieren.
- **reconstruct:** Prefab/Blueprint/Node-Komposition im Ziel neu erzeugen.
- **bake:** Shader, VFX oder Animation in Texturen, Frames oder Geometrie
  überführen.
- **project:** 3D nach 2D, Bild nach Audio, Szene nach Text oder umgekehrt.
- **federate:** Quelle bleibt in ihrer Runtime; nur der Weltvertrag wird
  übergeben.

## 6. Shader- und Field-Dolmetschen

Shader werden in SIR zerlegt:

1. Oberflächenmodell und Beleuchtungsannahmen.
2. Datenflüsse und Texturrollen.
3. Koordinatenräume.
4. Render-State.
5. Vertex-/Geometrieverformung.
6. Zeit-, Noise- und Zustandsfunktionen.
7. nicht portable Engine-Hooks.

Bei reiner visueller Wirkung darf gebacken oder approximiert werden. Wenn die
Verformung Weltfunktion trägt, muss der Vertrag auch Geometrie, Kollision,
Navigation, Audio und andere Projektionen umfassen.

```yaml
intent: corridor.disintegrate_under_stress
preserve:
  - stress_causality
  - reversibility
  - traversal_changes_with_geometry
project:
  - mesh
  - collision
  - navigation
  - audio
  - particles
forbidden:
  - visual_only_when_collision_remains_static
```

Der allgemeine Ansatz ist daher **field-first**. Shader sind eine besonders
leistungsfähige Ausgabe desselben Feldes, aber nicht automatisch die einzige
Wahrheit.

## 7. Code-Esperanto und FIR

Code wird nicht zeilenweise zwischen C#, C++, GDScript oder Blueprint
substituiert. Zuerst wird ein Funktionsvertrag rekonstruiert.

```yaml
function: door.deactivate
inputs:
  - door_state
preconditions:
  - door_exists
effects:
  - visual_presence_disabled
  - collision_disabled
  - processing_disabled
  - navigation_updated
postconditions:
  - passage_traversable
```

Quell- und Zielidiome werden als Corpus-Einträge verknüpft. Die Zielsprache
liefert anschließend korrekte Syntax und Lifecycle-Integration. CUE führt
äquivalente Szenarien gegen Quelle und Ziel aus.

## 8. Reverse Engineering

Reverse Engineering dient der Bedeutungsbergung, nicht der kosmetischen
Rückbenennung.

Für dekompilierte APKs oder alte Spiele werden Fragmente gruppiert nach:

- Call Graph,
- Datenfluss,
- gemeinsamem State,
- UI-/Resource-IDs,
- Lifecycle,
- Events, Intents und Broadcasts,
- Endpoints und Datenbanktabellen,
- Threads/Coroutines,
- Fehler- und Retrypfaden,
- beobachtbarem Verhalten.

Ergebnis ist kein behaupteter Originalquellcode, sondern ein Featuregraph mit
Evidenzstufen:

- `verified`,
- `strongly_inferred`,
- `ambiguous`,
- `missing`.

Ein LLM darf aus `verified` und `strongly_inferred` neue Module erzeugen. Es darf
`ambiguous` nicht still als Wahrheit behandeln.

## 9. Engine Federation

Wenn Transkription nicht lohnt, kann eine Szene in ihrer ursprünglichen Engine
bleiben. ANVIL verwaltet den neutralen Weltzustand und startet passende
Kapitel-Runner.

```text
Unreal chapter
→ Scene Contract
→ Unity chapter
→ Scene Contract
→ Godot or audio-only chapter
```

Übertragbar sind insbesondere:

- Inventar,
- Beziehungen,
- Entscheidungen,
- Quest- und Weltzustände,
- semantische Orte,
- freigeschaltete Fähigkeiten,
- Stress, Wissen und Gedächtnis.

Nicht als Frühziel gelten:

- gemeinsame framegenaue Physik,
- laufende Partikelsimulation über Prozessgrenzen,
- native Objektreferenzen,
- deterministischer MMO-Netcode.

Engine Hopping darf bewusst Spielmechanik und Erzählgrammatik sein. Ein Portal
kann dieselbe Welt in einer anderen Engine- oder Wahrnehmungsgrammatik zeigen.

## 10. Zuständigkeiten im Ökosystem

| System | Verantwortung |
|---|---|
| **WIZARD** | findet Quellen nach Rollen, Stil, Atmosphäre und Erfüllbarkeit |
| **TRIVIUM** | beschreibt Bedeutung, plant Routen, führt Corpus und Ledger |
| **SWIFT** | formt visuelle und geometrische Materialien um |
| **SHADED** | projiziert Zustände, Materialität und Felder wahrnehmbar |
| **ANVIL** | orchestriert Produktion und Enginekapitel |
| **MYTHIC** | provisioniert Werkzeuge und führt Pipelines aus |
| **CUE-AGENT** | prüft Ergebnisse und erzeugt Evidence |

## 11. Roadmap

### Phase A — Verträge und Register

1. Realization-Contract-Schema.
2. Tool-Manifest-Schema.
3. Corpus-Schema für Engine-Lemmata.
4. Lizenz- und Provenienzfelder.
5. Candidate-Registry aus `docs/tool-candidate-catalog.md`.

### Phase B — drei Beweisrouten

1. Unity-3D-Asset → Unreal-3D-Asset.
2. Unity-3D-Asset → 2D-Spritesheet → Godot/Unity/Unreal-Ressource.
3. Unreal- oder Godot-Szene → neutrale Scene-/Assetbeschreibung → andere
   Zielprojektion.

Jede Route braucht:

- Fixture,
- deterministischen Plan,
- Quell- und Zielartefakte,
- Ledger,
- Screenshot-/Verhaltensbeweis,
- dokumentierten manuellen Restaufwand.

### Phase C — Code-Esperanto

1. 25–50 kleine Gameplay-Lemmata.
2. Unity-, Unreal- und Godot-Realisierungen.
3. aus Contracts generierte Tests.
4. Rückanalyse eines kleinen Beispiels in FIR.

### Phase D — Engine Federation

1. gemeinsames World-State-Schema.
2. Scene Contracts.
3. zwei minimale Kapitel in unterschiedlichen Runtimes.
4. Übergabe über Datei oder lokalen IPC-Kanal.
5. sichtbarer Engine-Hop als Demonstrator.

## 12. Unverhandelbare Regeln

- Kein Nachbau vorhandener Konverter ohne belegte Lücke.
- Keine Behauptung von Verlustfreiheit ohne Test und Ledger.
- Keine Übersetzung allein über Dateiendungen.
- Keine proprietäre Semantik erraten.
- Kein Tool ohne Lizenz-, Versions- und Provenienzdaten in Production.
- Kein Erfolg nur weil das Ziel kompiliert.
- Keine Enginewahl vor Rollen- und Wirkungsanalyse.
- Kleine Spiele und klar begrenzte Assets zuerst.
