# TRIVIUM Architecture v1.1 — Semantic Realization Pipeline

## 1. Systembild

```text
SOURCE LAYER
Idea | Asset | Scene | Shader | Code | Legacy Game | Text | Audio
                              │
                              ▼
MEANING RECOVERY
MANIFOLD routing + WIR/AIR/SIR/EIR/FIR/PIR
                              │
                              ▼
CONTRACT LAYER
World | Asset | Function | Perception | Scene | Evidence
                              │
                              ▼
PLANNING
Capability Graph + Tool Registry + Loss/Gain Ledger
                              │
                              ▼
REALIZATION
Existing converters | Blender | Engine editors | Scripts | Commercial tools
                              │
                              ▼
TARGET
Unity | Unreal | Godot | LÖVE | Ren'Py | Browser | Audio | 2D | 3D
                              │
                              ▼
EVIDENCE
CUE tests | screenshots | behavior traces | roundtrip reports
```

## 2. Kontrollfluss

1. WIZARD wählt Quellen nach Rolle und Wirkung, nicht nach Engine.
2. TRIVIUM rekonstruiert Bedeutung und erstellt Contracts.
3. Der Planner sucht einen Pfad im Capability Graph.
4. SWIFT übernimmt Formwechsel und visuelle/geometrische Verarbeitung.
5. SHADED oder andere Projektionen setzen Wahrnehmungszustände um.
6. ANVIL orchestriert den Produktionsjob oder mehrere Engine-Runner.
7. MYTHIC stellt Werkzeuge, Container und Buildumgebungen bereit.
8. CUE-AGENT prüft, ob der Vertrag erfüllt ist.

## 3. Komponenten

### `packages/trivium-core`

Bleibt enginefrei. Verantwortlich für:

- WIR,
- Routing,
- Kohärenz,
- Ledger,
- Registry,
- Contracts und Planner-Schnittstellen, sobald implementiert.

### Engine Adapter

Adapter sprechen Zielgrammatik. Sie dürfen:

- Code und Szenen erzeugen,
- Editorjobs beschreiben,
- Toolchains anfordern,
- Gains und Verluste melden.

Sie dürfen nicht:

- die Quelle mutieren,
- unbekannte Semantik erfinden,
- Enginebegriffe in die WIR zurückschreiben.

### Tool Registry

Enthält Capability-Manifeste. Ein Tool ist keine Architekturentscheidung,
sondern eine austauschbare Implementierung einer Transformationskante.

### Corpus

Belegte Mappings zwischen:

- neutralem Lemma,
- Quellidiom,
- Zielidiom,
- Vertrag,
- Test,
- Confidence.

### Planner

Das Planner-Skelett v0.1 ist in `packages/trivium-planner` implementiert: Capability-Graph-Suche über Format-Tokens, transparente Additivkosten und ehrliche Review-Meldungen bei fehlenden Pfaden. Es plant eine Route, ohne Werkzeugdetails in die Weltwahrheit zu mischen.

```text
requested outcome
+ source capabilities
+ target contract
+ available tools
+ license constraints
→ ranked plans
```

### Executor

Ein dünner Dry-Run-/Hashing-Executor ist als `tools/execute-plan.js` implementiert. Er ersetzt ANVIL/MYTHIC nicht: TRIVIUM emittiert und prüft Pläne, der lokale Executor beweist nur Planbarkeit, Tool-Auffindbarkeit und Hash-Protokollierung.

## 4. Planformat — implementiert als TIR v0.1

TIR v0.1 ist als JSON-Planformat (`*.plan.json`) mit Validator in `packages/trivium-contracts` implementiert. YAML unten bleibt die historische Entwurfsskizze.

```yaml
planVersion: 0.1
id: guard-unity-to-godot-sprite
source:
  artifact: sources/guard.unitypackage
  contract: contracts/guard.asset.yaml
target:
  runtime: godot
  form: sprite2d
steps:
  - id: extract
    tool: assetripper
    produces: work/guard-project
  - id: normalize
    tool: blender
    script: recipes/normalize-humanoid.py
    produces: work/guard.glb
  - id: render
    tool: blender
    script: recipes/render-eight-direction.py
    produces: work/frames
  - id: pack
    tool: atlas-packer
    produces: out/guard.png
  - id: import
    tool: godot-headless
    produces: out/guard.tres
verify:
  contract: evidence/guard-sprite.yaml
fallbacks:
  - use_four_directions
  - human_review_rig
```

## 5. Engine Hopping

ANVIL darf mehrere Zielruntimes als Kapitel-Runner behandeln.

```text
World State Service
├── Unreal chapter
├── Unity chapter
├── Godot chapter
├── Browser chapter
└── Audio-only chapter
```

Der World State Service hält nur neutrale Daten. Runtimes erhalten
Scene-Contract-Inputs und liefern deklarierte Outputs zurück.

### Früh zulässige Übergänge

- Kapitelende,
- Tür/Portal,
- Fahrstuhl,
- Traum/Erinnerung,
- Schwarzblende,
- Ladebereich,
- bewusstes Engine-Hopping.

### Nicht frühes Ziel

- ein physikalisches Objekt gleichzeitig in zwei Engines simulieren,
- framegenaue Cross-Engine-Kollision,
- gemeinsamer Multiplayer-Tick über heterogene Engines.

## 6. Field-first Runtime

Für verformbare Welten wird ein neutrales Feld oder State-Modell verwendet.
Mehrere Projektionen abonnieren denselben Zustand.

```text
World Field
├── visual shader
├── dynamic mesh
├── collision representation
├── navigation cost/topology
├── spatial audio
└── particles/haptics
```

Ein Vertexshader allein ist gültig, wenn der Vertrag nur visuelle Wirkung
fordert. Sobald Gameplaygeometrie betroffen ist, muss die Route weitere
Projektionen aktualisieren.

## 7. Reverse Engineering Pipeline

```text
Binary / decompiled source
→ syntax and resource extraction
→ call/data/control graphs
→ lifecycle and effect clustering
→ feature graph
→ FIR contracts
→ clean target implementation
→ differential behavior tests
```

Das LLM schreibt die neue Implementierung erst nach dem Clustering. Unbekannte
Teile bleiben markiert.

## 8. Entwicklungsreihenfolge

1. Dokumente und Schemas.
2. Candidate Tool Registry.
3. drei kleine Asset-Beweisrouten.
4. 25–50 Code-Lemmata.
5. Contract-generierte Tests.
6. ein Zwei-Engine-Handoff-Demonstrator.
7. field-first Korridor-Fixture.
8. kleine End-to-End-Spielidee aus WIZARD-Quellen.

## 9. Erfolgskriterium

TRIVIUM ist nicht erfolgreich, wenn es viele Zielcodezeilen erzeugt.

Es ist erfolgreich, wenn ein Nutzer ungefiltert sagen kann:

> Dieses Asset, diese Idee oder dieses alte Spiel gefällt mir. Mach daraus
> diese kleine spielbare Form.

Und das System anschließend:

- die relevante Bedeutung identifiziert,
- passende vorhandene Werkzeuge auswählt,
- Verluste ehrlich macht,
- ein funktionierendes Ziel erzeugt,
- die behauptete Gleichwertigkeit beweist.
