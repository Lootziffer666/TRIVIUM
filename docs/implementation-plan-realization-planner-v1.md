# TRIVIUM — Implementierungsplan: Realization Planner v1

**Status:** Verbindlicher, codegenauer Implementierungsplan für den nächsten
Entwicklungslauf. Nur Planung — es wurde kein Code geschrieben, keine Datei
außer diesem Plan verändert. Grundlage: vollständige Codeinspektion des
Stands `ff1d6f7` (alle Dateien unter `packages/`, `adapters/`, `bin/`,
`test/`, `tools/`, `examples/`, `docs/`).

**Scope des nächsten Laufs (exakt fünf Bausteine + drei Beweisrouten):**
1. Tool Registry · 2. Capability Graph · 3. Realization Request/Constraints ·
4. Realization Planner · 5. versionierter Execution Plan mit Evidence Contract.
Beweisrouten: (A) 3D-Charakter → SWIFT → SHADED · (B) Unity-Asset →
normalisierte Zwischenformen → Godot/Unreal · (C) WIZARD Production
Assessment → konkurrierende Pläne.

**Produktgrenze:** TRIVIUM plant, dokumentiert und deklariert Evidence.
TRIVIUM führt keine Tools aus (ANVIL/MYTHIC), macht keine QA (CUE-AGENT),
rendert nicht (SWIFT), baut keine Runtime nach (SHADED).

---

## 1. Executive Code Assessment

1. **Existiert und trägt:** `packages/trivium-core` — WIR v1.0.0
   (`src/wir.js`: 13 `INTENT_AXES`, 5 `ENTITY_KINDS`, 9 `RELATION_TYPES`,
   Builder, `conceptsOf`, `fromJSON`, `deepFreeze`), Router
   (`src/router.js`: `translate()` mit Stage 0–3), Ledger (`src/ledger.js`:
   6 `ROUTES`, `record()` erzwingt `ruleId`+`reason`, `loss` bei
   approximate/preserve), Kohärenz (`src/coherence.js`: `check()`),
   Adapter-Registry (`src/registry.js`: `createRegistry()`).
2. **Existiert:** 6 Adapter (`adapters/{shaded,godot,love2d,renpy,unity,unreal}/adapter.js`),
   alle mit identischem Vertrag `{name, engine, dialect, capabilities, gains, realize}`;
   ein Importer (`adapters/shaded/importer.js`: `paramsToIntents`, `importStoryboard`).
3. **Existiert:** CLI `bin/trivium.js` (Positionsargument Welt, `--target`,
   `--out`, `--no-strict`, `--list`; Exit 0/1/2), `tools/verify.js`
   (Tests werden per `readdirSync(testDir).filter(f => f.startsWith("test_"))`
   **automatisch entdeckt** — neue Testdateien brauchen keine verify-Änderung),
   `tools/verify-live.js` (echter `window.SHADED`-Beweisritt).
4. **Modulmodus:** durchgehend CommonJS, `"use strict"`, Factory-Funktionen
   (keine Klassen), `module.exports = { … }`, Validierung wirft `Error` mit
   erklärendem Text. Null Runtime-Dependencies (`package.json` hat weder
   `dependencies` noch `devDependencies`).
5. **Fehlt vollständig (nur Doku, kein Code):** Contracts jeder Art
   (`docs/realization-contracts.md`), Tool-Manifeste/Tool-Registry
   (`docs/engine-dolmetscher.md` §3, `docs/tool-candidate-catalog.md` §12),
   Capability Graph (§4), Planner, TIR/Planformat (`docs/architecture-v1.1.md` §4),
   Evidence-Runner, IRs AIR/SIR/EIR/FIR/PIR.
6. **Fehlt:** die sieben Realisierungsrouten `reconstruct, normalize, bake,
   project, degrade, enrich, federate` (`docs/loss-taxonomy.md` §2) sind
   nicht in `ROUTES` (`src/ledger.js` Zeile 21–29).
7. **Doku-Behauptung ohne Code, korrekt gekennzeichnet:** loss-taxonomy
   Status-Kopf und wir-spec §8 markieren Geplantes ehrlich — der neue Code
   muss diese Statuszeilen im selben Commit nachziehen.
8. **Adapter-Registry ist NICHT die Tool-Registry:** `createRegistry()`
   verlangt `REQUIRED_FIELDS = ["name","engine","dialect","capabilities","realize"]`
   und matcht Concept-Kinds exakt/per `*`-Präfix. Tool-Manifeste haben weder
   `realize()` noch Concept-Kinds → getrennte Registry (Begründung §6/Ebene 6).
9. **Wiederverwendbar für den Planner:** `ROUTES`-Vokabular und
   Ledger-Eintragsform (`conceptId/route/ruleId/reason/loss/gain`) aus
   `src/ledger.js`; `needs_human_review`-Semantik (Ledger `review[]`,
   CLI-Exit 2); Report-Stil `formatReport()`.
10. **Bewiesene Cross-Repo-Fakten aus DIESEM Repo:** SHADED-API =
    `setParams, getParams, story.board()/play()/stop(), addActor({image,
    manifest, x, y, anim, depthLayer, depthImage, emissiveImage}),
    getMaterialTypeAt, isReady` (aus `adapters/shaded/adapter.js` +
    `tools/verify-live.js`); Storyboard-Step = `{name, dur, p}`; 15 Parameter
    (dayNight, storm, rain, wet, puddle, fog, wind, glow, decay, snow,
    snowfall, temperature, autumn, bloom, bleach). SWIFT-Actor-Asset-Form =
    `{image, manifest, depthImage, emissiveImage}` (adapter.js Zeile 309,
    316–318).
11. **NICHT aus diesem Repo verifizierbar:** WIZARD Production-Assessment-
    Format, SWIFT-CLI-Argumente, CUE-Befehle, ANVIL/MYTHIC-Schnittstellen.
    Der Plan definiert dafür versionierte Import-/Manifest-Verträge mit
    hartem Versions-Gate und expliziten Verifikationsschritten gegen die
    Schwester-Repos (§8, §10 Schritt 12/13) — nichts wird geraten.
12. **Beispielwelten:** `examples/dorf-sturmnacht.js`, `examples/turm-des-schweigens.js`,
    beide `module.exports = { build }`. `dorf-sturmnacht` enthält den
    Charakter `waechterin` mit `props: { anim: "idle", depthLayer: "mid" }` —
    das ist die Quelle für Beispielplan A.
13. **Tests:** 48 Tests in 6 Dateien, Muster: `const assert = require("assert");
    let n = 0; function t(name, fn) { fn(); n++; console.log("  ok " + name); }`
    — neue Tests folgen exakt diesem Muster.
14. **Fidelity-Formel** (`summarize()` in `src/ledger.js`):
    `(total − unknown − preserve) / total`. Der Planner-Score (§7) ist davon
    getrennt; die Formel wird NICHT angefasst.
15. **Stage-0-Schutz:** `translate()` friert eine Kopie ein und hängt selbst
    `<id>.wir.json` an — der Planner übernimmt dasselbe Prinzip: Request
    wird deep-gefroren, das Original reist im Plan mit (`sourceArtifacts`
    + `requestRef`).
16. **Inkonsistenz gefunden (klein, nicht blockierend):** `README.md` nennt
    „48 Tests" auch in `CLAUDE.md` — jede Testerweiterung muss beide Zahlen
    nachziehen. Katalog führt `KvesDev` und `KevesDev/RuntimeStaticMeshImporter`
    als markierte Dublette (tool-candidate-catalog §1 P1) — Dedup-Regel in
    der Registry nötig.
17. **CLI-Erweiterbarkeit:** `bin/trivium.js` parst Argumente in einer
    flachen Schleife (Zeile 36–48); ein Subcommand `plan` als erstes
    Positionsargument ist rückwärtskompatibel einbaubar, weil bisher das
    erste Positionsargument immer ein Dateipfad ist (Kollision nur, wenn
    eine Datei exakt `plan` hieße — akzeptiertes, dokumentiertes Verhalten:
    Subcommand gewinnt).
18. **Null-Dependency-Konsequenz:** alle neuen Formate sind JSON
    (`*.tool.json`, `*.request.json`, `*.plan.json`). Die YAML-Blöcke der
    Docs bleiben Illustration.
19. **verify.js-Anbindung:** neuer Abschnitt „3. planner smoke" wird in
    `tools/verify.js` ergänzt (Manifest-Validierung + drei Beispiel-Requests
    planen); Testdateien selbst werden automatisch entdeckt (Punkt 3).
20. **Kern bleibt unangetastet:** `packages/trivium-core/**` wird in diesem
    Lauf in KEINER Datei geändert. Neues Paket `packages/trivium-plan/`
    importiert Core nur lesend (`ROUTES`), nie umgekehrt.

---

## 2. Current Call Graph (Ist, verifiziert)

```text
bin/trivium.js
  ├─ opts-Parsing (Zeile 36–48)
  ├─ T.createRegistry()                        packages/trivium-core/src/registry.js
  ├─ reg.register(require("adapters/<n>/adapter").adapter)   ×6 (BUILTIN_ADAPTERS, Zeile 29)
  ├─ Welt laden:
  │    .js  → mod.build()                      examples/*.js
  │    .json→ T.fromJSON(fs.readFileSync(p))   src/wir.js  (alles durch Builder)
  └─ T.translate(world, target, reg, {strict}) src/router.js
       ├─ Stage 0: wirVersion-Gate + deepFreeze(JSON-Kopie)      src/wir.js
       ├─ Stage 1: conceptsOf(source) + coherence.check(source)  src/wir.js, src/coherence.js
       │            strict && !consistent → throw
       ├─ Stage 2: registry.capabilityFor(adapter, kind) je Konzept
       │            kein Match → record(route:"unknown") → ledger.review[]
       │            Match     → record({route, ruleId:"TRV-CAP-…", via, loss, gain})
       │            recordGain(ledger, "adapter.<name>", gain) je adapter.gains
       ├─ Stage 3: adapter.realize(source, routed, ledger) → [{path, content}]
       │            + push {path: "<id>.wir.json", content: JSON(source)}
       └─ return { artifacts, ledger, coherence, summary: summarize(), report: formatReport() }
  → Dateien schreiben, TRANSLATION_REPORT.md, Exit 0/1/2 (2 = needsHumanReview)
```

`tools/verify.js`: gleicher Weg für beide Beispielwelten × alle 6 Adapter;
FAIL bei `needsHumanReview`. `tools/verify-live.js`: `translate(...,"shaded")`
→ Driver-Artefakt → headless Chromium gegen echtes `window.SHADED`.

---

## 3. Target Call Graph (Soll, dieser Lauf)

```text
bin/trivium.js  ("plan"-Subcommand)                          [geändert]
  ├─ loadToolManifests(registryDir)          packages/trivium-plan/src/toolRegistry.js
  ├─ createToolRegistry() + registerTool(…)  je Manifest
  ├─ importProductionAssessment(doc)?        packages/trivium-plan/src/wizard.js   (nur bei --from-wizard)
  ├─ normalizeRealizationRequest(raw)        packages/trivium-plan/src/request.js
  ├─ planRealization(request, registry, options)   packages/trivium-plan/src/planner.js
  │    ├─ validateRequest(request)                 src/request.js
  │    ├─ deriveCapabilities(request)              src/planner.js (intern)
  │    ├─ buildCapabilityGraph(registry, constraints)   src/capabilityGraph.js
  │    ├─ enumeratePaths(graph, startStates, goalState, maxPathLength)  src/capabilityGraph.js
  │    ├─ scoreCandidate(path, request, registry)  src/scoring.js
  │    ├─ buildPlanLedger(path, request)           src/planner.js (intern, ROUTES aus trivium-core)
  │    ├─ deriveHumanReview(path, request)         src/planner.js (intern)
  │    ├─ createEvidenceContract(request, plan)    src/evidence.js
  │    ├─ createExecutionPlan(candidate, …)        src/executionPlan.js
  │    └─ rankCandidates(candidates)               src/scoring.js
  └─ PlanningResult → <out>/<requestId>/plan-*.json + PLANNING_REPORT.md
                       Exit 0 planned · 2 needs_human_review · 4 unavailable · 1 Fehler
```

Alle neuen Funktionen sind **synchron** (wie der gesamte Bestand) und —
mit Ausnahme der Datei-Loader — **reine Funktionen** ohne I/O.

---

## 4. File-by-File Implementation Plan

### 4.1 Ist-Inventar der berührten/benutzten Module (Ebene 1)

**`packages/trivium-core/src/ledger.js`** — Exports: `ROUTES, LOSSY_ROUTES,
createLedger, record, recordGain, summarize, formatReport`. Datenform:
Ledger `{worldId, target, startedAt, events[], losses[], gains[], review[]}`.
Aufrufer: `src/router.js`, `src/registry.js`, alle 6 Adapter (nur `ROUTES`),
`index.js`. Abhängigkeiten: keine. **Wiederverwendet:** `ROUTES` (als Basis
des Planrouten-Vokabulars), Eintragsform. **Geändert: nichts.**

**`packages/trivium-core/src/registry.js`** — Exports: `createRegistry`
(Closure mit `register, get, list, capabilityFor`). Aufrufer: `index.js` →
`bin/trivium.js`, `tools/verify.js`, Tests. **Wiederverwendet:** als
Stilvorbild (Factory + Map + Validierung beim Registrieren). **Geändert:
nichts** (Begründung Ebene 6).

**`packages/trivium-core/src/router.js`** — Export: `translate`. Aufrufer:
`index.js` → CLI/verify/Tests. **Wiederverwendet:** Stage-Disziplin als
Muster; `translate` selbst bleibt der Welt-Emissionsweg und wird vom Planner
NICHT aufgerufen (Planen ≠ Emittieren). **Geändert: nichts.**

**`packages/trivium-core/src/wir.js`** — Exports: `WIR_VERSION, INTENT_AXES,
ENTITY_KINDS, RELATION_TYPES, createWorld, addEntity, addRelation, addSpace,
addMoment, setArc, addState, addRule, addMachine, addMemory, conceptsOf,
deepFreeze, fromJSON`. **Wiederverwendet:** `deepFreeze` (Request-Schutz)
via `require("../../trivium-core/src/wir")`. **Geändert: nichts.**

**`packages/trivium-core/src/coherence.js`**, **`packages/trivium-core/index.js`**,
**alle `adapters/*/adapter.js`**, **`adapters/shaded/importer.js`**,
**`examples/*.js`**, **`test/test_{wir,router,coherence,adapters,cli,import}.js`**,
**`tools/verify-live.js`** — nur lesen, nicht ändern. Erkenntnisquellen für
Manifest-Fakten (SHADED-Params, SWIFT-Asset-Form, `waechterin`-Props).

**`bin/trivium.js`** — Exports: keine (Skript). Aufrufer: Nutzer,
`test/test_cli.js` via `execFileSync`. **Geändert:** `plan`-Subcommand
(Details §5.14). Bestehende Pfade byte-identisch unverändert (Round-Trip-Test
`test_cli.js` Zeile 39–50 schützt das).

**`tools/verify.js`** — **Geändert:** neuer Abschnitt 3 „planner smoke"
(Details §10 Schritt 11).

### 4.2 Exakte Dateiliste (Ebene 2)

| # | Datei | Aktion | Exakter Zweck | Abhängigkeiten |
|---|---|---|---|---|
| 1 | `packages/trivium-plan/src/errors.js` | neu | zentrale Fehlercodes `ERR`, `fail()`, `PlanningDiagnostic`-Fabrik `diag()` | keine |
| 2 | `packages/trivium-plan/src/routes.js` | neu | `REALIZATION_ROUTES` = Core-`ROUTES` + 7 Realisierungsrouten; `ROUTE_OBLIGATIONS` (Pflichtnachweis je Route) | `trivium-core/src/ledger` |
| 3 | `packages/trivium-plan/src/artifactState.js` | neu | Format-Token-Kanon `ARTIFACT_STATES`, `normalizeState()`, `isKnownState()` | 1 |
| 4 | `packages/trivium-plan/src/toolManifest.js` | neu | `validateToolManifest(doc)` gegen `trivium.tool-manifest/v1` | 1, 3 |
| 5 | `packages/trivium-plan/src/toolRegistry.js` | neu | `createToolRegistry`, `registerTool`, `getTool`, `listTools`, `findToolsForCapability`, `loadToolManifests` | 1, 4 |
| 6 | `packages/trivium-plan/src/request.js` | neu | `normalizeRealizationRequest`, `validateRequest`, `PLANNING_CONSTRAINT_DEFAULTS` | 1, 3 |
| 7 | `packages/trivium-plan/src/capabilityGraph.js` | neu | `buildCapabilityGraph`, `enumeratePaths` | 1, 3, 5 |
| 8 | `packages/trivium-plan/src/scoring.js` | neu | `SCORE_WEIGHTS`, `scoreCandidate`, `rankCandidates` | 1 |
| 9 | `packages/trivium-plan/src/evidence.js` | neu | `createEvidenceContract`, `EVIDENCE_CATEGORIES`, `validateEvidenceContract` | 1 |
| 10 | `packages/trivium-plan/src/executionPlan.js` | neu | `createExecutionPlan`, `validateExecutionPlan`, `PLAN_VERSION` | 1, 2, 3, 9 |
| 11 | `packages/trivium-plan/src/planner.js` | neu | `planRealization` (Pipeline §7.4) | 1–10 |
| 12 | `packages/trivium-plan/src/wizard.js` | neu | `importProductionAssessment` → RealizationRequest | 1, 6 |
| 13 | `packages/trivium-plan/index.js` | neu | öffentliche API-Re-Exports (Muster: `trivium-core/index.js`) | 1–12 |
| 14 | `registry/tools/swift.tool.json` | neu | SWIFT-Manifest (Beweisroute A) | Schema 4 |
| 15 | `registry/tools/shaded-target.tool.json` | neu | SHADED-Ziel-Manifest (Actor-Bundle-Konsum, Scene-Project) | Schema 4 |
| 16 | `registry/tools/trivium-shaded-adapter.tool.json` | neu | TRIVIUMs eigene Emission `wir.world → shaded.scene-project` als Kante | Schema 4 |
| 17 | `registry/tools/assetripper.tool.json` | neu | Unity-Extraktion (Beweisroute B), `status:"candidate"` | Schema 4 |
| 18 | `registry/tools/blender-headless.tool.json` | neu | Normalisierung/Render (`mesh.* → mesh.glb`, `mesh.glb → sprite.frames`) | Schema 4 |
| 19 | `registry/tools/godot-headless-import.tool.json` | neu | `mesh.glb → godot.resource`, `status:"candidate"` | Schema 4 |
| 20 | `registry/tools/unreal-glb-import.tool.json` | neu | `mesh.glb → unreal.staticmesh` (Kandidat `Mansoor1619/UE-RuntimeGLBLoader` aus Katalog §1 P1) | Schema 4 |
| 21 | `registry/tools/atlas-packer.tool.json` | neu | `sprite.frames → sprite.atlas`, `status:"candidate"` | Schema 4 |
| 22 | `examples/requests/waechterin-to-shaded.request.json` | neu | Beispielroute A als Request | Schema §6.4 |
| 23 | `examples/requests/unity-guard-to-engine.request.json` | neu | Beispielroute B als Request | Schema §6.4 |
| 24 | `examples/requests/wizard-assessment-dorf.request.json` | neu | Beispielroute C: WIZARD-Assessment-Fixture (`assessment`-Feld) | Schema §8.1 |
| 25 | `test/test_toolregistry.js` | neu | Manifest-Validierung, Dedupe, Lookup, Laden | 1–5 |
| 26 | `test/test_capability_graph.js` | neu | Graphaufbau, Pfad-Enumeration, Zyklen, maxPathLength | 7 |
| 27 | `test/test_planner.js` | neu | Pipeline, 3 Statusfälle, Determinismus, Beispielrequests | 11 |
| 28 | `test/test_execution_plan.js` | neu | Planschema, Step-Pflichtfelder, Evidence-Contract, Serialisierung | 9, 10 |
| 29 | `test/test_wizard_import.js` | neu | Versions-Gate, fehlende Rollen, Mehrfachkandidaten | 12 |
| 30 | `bin/trivium.js` | ändern | `plan`-Subcommand | 13 |
| 31 | `tools/verify.js` | ändern | Abschnitt „planner smoke" | 13 |
| 32 | `README.md` | ändern | Planner-Abschnitt + Testzahl | — |
| 33 | `CLAUDE.md` | ändern | Testzahl + eine Zeile Planner-Invariante | — |
| 34 | `docs/loss-taxonomy.md` | ändern | Status: 7 Routen „implementiert auf Plan-Ebene (`trivium-plan/src/routes.js`), Ledger-Kern unverändert" | — |

Nur lesen (nie ändern): alles unter `packages/trivium-core/`,
`adapters/`, `examples/*.js` (bestehende), `test/test_*.js` (bestehende),
`tools/verify-live.js`, `docs/*` (außer 34).

---

## 5. Function Specifications (Ebene 3)

Alle Funktionen: CommonJS-Export, synchron, `"use strict"`. Fehler = `Error`
mit `err.code` (String aus `ERR`) und Klartext-Message, geworfen via `fail()`.

### 5.1 `errors.js`

```js
ERR  // Object.freeze — der EINZIGE Ort für Fehlercodes:
{
  ERR_TOOL_MANIFEST_INVALID, ERR_TOOL_DUPLICATE, ERR_TOOL_NOT_FOUND,
  ERR_CAPABILITY_UNKNOWN, ERR_ARTIFACT_STATE_UNKNOWN,
  ERR_REQUEST_INVALID, ERR_CONTRACT_UNSUPPORTED, ERR_CONSTRAINT_UNSATISFIED,
  ERR_NO_REALIZATION_PATH, ERR_PLAN_VERSION_UNSUPPORTED,
  ERR_EVIDENCE_INVALID, ERR_ASSESSMENT_VERSION_UNSUPPORTED,
  ERR_ASSESSMENT_INVALID
}
fail(code, message) → throws Error   // e = new Error(`${code}: ${message}`); e.code = code
diag(severity, code, message, ref)   // → PlanningDiagnostic (§6.15); severity ∈ "error"|"warn"|"info"
```
Aufrufer: alle anderen `trivium-plan`-Module. Seiteneffekte: keine.

### 5.2 `routes.js`

```js
REALIZATION_ROUTES  // Object.freeze: { ...ROUTES (6 aus trivium-core/src/ledger),
                    //   RECONSTRUCT:"reconstruct", NORMALIZE:"normalize", BAKE:"bake",
                    //   PROJECT:"project", DEGRADE:"degrade", ENRICH:"enrich", FEDERATE:"federate" }
ROUTE_OBLIGATIONS   // Object.freeze: route → { requiresLoss:bool, requiresGain:bool, requiresContractRef:bool }
                    //   approximate/preserve/bake/degrade → requiresLoss
                    //   enrich → requiresGain
                    //   reconstruct/normalize/project/federate → requiresContractRef
```
Der Core-Ledger bleibt unverändert; diese Routen existieren nur auf
Plan-Ebene (loss-taxonomy §2: „beeinflussen Planner, Toolauswahl, Evidence").

### 5.3 `artifactState.js`

```js
ARTIFACT_STATES  // Object.freeze([...]) — geschlossener v1-Kanon (§6.1)
normalizeState(token) → string
  // trim, toLowerCase; Alias-Map: {"gltf":"mesh.gltf","glb":"mesh.glb","fbx":"mesh.fbx","png":"texture.png"}
  // unbekanntes Token → fail(ERR_ARTIFACT_STATE_UNKNOWN, …) — kein Raten (Kanon-Invariante 5)
isKnownState(token) → boolean   // wirft nie
```

### 5.4 `toolManifest.js`

```js
validateToolManifest(doc) → { ok: boolean, errors: PlanningDiagnostic[], warnings: PlanningDiagnostic[] }
```
Reine Funktion, wirft nie. Regeln (Ebene 5): `manifestVersion` muss exakt
`"trivium.tool-manifest/v1"` sein, sonst error `ERR_PLAN_VERSION_UNSUPPORTED`.
Pflichtfelder fehlend → error `ERR_TOOL_MANIFEST_INVALID`. Jede Capability:
`accepts`/`produces` durch `isKnownState` prüfen (unbekannt → error).
`route` ∉ `REALIZATION_ROUTES` → error. `ROUTE_OBLIGATIONS`-Verletzung
(z. B. `route:"bake"` ohne `expectedLosses`) → error. Unbekannte
Top-Level-Felder → **warning** `TRV-PLAN-W-UNKNOWN-FIELD` (behalten, nie
still verwerfen, nie deuten). `confidence` außerhalb 0..1 → error.
`status:"verified"` ohne `evidenceRef` → error (Katalog §12: „Ein Link
allein ist kein Tooladapter").

### 5.5 `toolRegistry.js`

```js
createToolRegistry(options = {}) → registry
  // Closure (Muster src/registry.js). Interna:
  //   byId        = new Map()            // toolId → manifest (deep-frozen)
  //   byCapability= new Map()            // capabilityId → [toolId]
  //   byProduces  = new Map()            // stateToken → [toolId]
  //   byAccepts   = new Map()            // stateToken → [toolId]
  //   diagnostics = []
registerTool(registry, manifest) → manifest
  // validateToolManifest; !ok → fail(ERR_TOOL_MANIFEST_INVALID, erste error-Message)
  // Duplikat-id → fail(ERR_TOOL_DUPLICATE, …)  (Katalog-Dublette KvesDev/KevesDev wird so erzwungen manuell aufgelöst)
  // deepFreeze(manifest) (aus trivium-core/src/wir) und alle Indizes füllen
getTool(registry, toolId) → manifest         // fehlt → fail(ERR_TOOL_NOT_FOUND, mit vorhandenen ids — Muster registry.get())
removeTool(registry, toolId) → boolean       // Indizes bereinigen; false wenn unbekannt (wirft nicht)
listTools(registry, filter = {}) → manifest[]
  // filter: { status?, capability?, accepts?, produces?, headless?, executor? } — UND-verknüpft; deterministisch nach id sortiert
findToolsForCapability(registry, capabilityId, constraints = {}) → manifest[]
  // byCapability-Lookup; constraints (§6.5) hart anwenden:
  //   deniedLicenses (match → raus), requireDeterministic, requireHeadless,
  //   maxMoneyCents (tool.costModel.perRunCents > max → raus), allowNetwork=false → networkPolicy!=="none" raus,
  //   minConfidence (default 0) — Ergebnis nach id sortiert; capabilityId unbekannt in ALLEN Manifesten → []
loadToolManifests(directory) → { manifests: object[], diagnostics: PlanningDiagnostic[] }
  // fs.readdirSync(directory).filter(f => f.endsWith(".tool.json")).sort()
  // JSON.parse-Fehler oder validateToolManifest.ok===false → Manifest ÜBERSPRINGEN
  //   + error-Diagnostic (Datei bleibt liegen, Ladeprozess fällt nicht) — „abgelehnt, nicht deaktiviert":
  //   ein ungültiges Manifest existiert für die Registry schlicht nicht, der Report sagt warum.
  // Einzige I/O-Funktion des Pakets neben executionPlan-Serialisierung im CLI.
```

### 5.6 `request.js`

```js
PLANNING_CONSTRAINT_DEFAULTS  // §6.5, Object.freeze
normalizeRealizationRequest(raw) → request
  // requestVersion fehlt → "trivium.realization-request/v1" setzen; ≠ v1 → fail(ERR_PLAN_VERSION_UNSUPPORTED)
  // id fehlt → fail(ERR_REQUEST_INVALID); sourceArtifacts[].state per normalizeState;
  // target.state per normalizeState; constraints mit Defaults mergen (flach);
  // contract.preserve/project/mayApproximate/mustNot/verify je [] default;
  // Ergebnis: deepFreeze(JSON.parse(JSON.stringify(merged)))  — Stage-0-Prinzip
validateRequest(request) → PlanningDiagnostic[]
  // rein; errors[] leer = gültig. Prüft: ≥1 sourceArtifact; target.state bekannt;
  // contract.preserve nicht leer ODER target.form === "exploratory" (sonst error
  //   ERR_CONTRACT_UNSUPPORTED: ein Vertrag ohne preserve ist kein Vertrag);
  // Engine-Vokabular-Sperre: contract.*-Strings dürfen keine Tokens aus
  //   ENGINE_TOKEN_BLOCKLIST = ["gameobject","aactor","node2d","node3d","monobehaviour",
  //   "blueprint","prefab","collider","tscn","uasset","shadergraph"] enthalten
  //   (case-insensitive Substring) → error ERR_CONTRACT_UNSUPPORTED
  //   (Kanon-Invariante 2: Bedeutung, nie Engine-Syntax in neutralen Verträgen).
```

### 5.7 `capabilityGraph.js`

```js
buildCapabilityGraph(registry, constraints = {}) → graph
  // graph = { nodes: Set<stateToken>, edges: Map<stateToken, CapabilityEdge[]>, diagnostics: [] }
  // Für jedes Tool, jede Capability, jedes accepts×produces-Paar eine gerichtete Kante.
  // Harte Constraints filtern Kanten SCHON HIER (findToolsForCapability-Logik inline auf Manifestebene).
  // Kanten deterministisch sortiert: (from, to, toolId, capabilityId).
enumeratePaths(graph, startStates, goalState, maxPathLength = 8) → CapabilityEdge[][]
  // erschöpfende, azyklische Tiefensuche (Begründung §7.2). onPath:Set verhindert Zyklen.
  // Abbruch je Ast bei Länge > maxPathLength. Ergebnis deterministisch
  // (Kantensortierung) — KEIN Zufall, KEINE Zeitabhängigkeit.
  // [] wenn kein Pfad — wirft NICHT (der Planner macht daraus "unavailable").
```

### 5.8 `scoring.js`

```js
SCORE_WEIGHTS      // §7.3, Object.freeze — Summe exakt 1.0
scoreCandidate(pathEdges, request, registry) → { total: number, axes: { <axis>: {penalty, weight, weighted} } }
  // rein, deterministisch; alle Achsenformeln in §7.3. total auf 4 Nachkommastellen
  // gerundet (Math.round(x*10000)/10000) — reproduzierbare Serialisierung.
rankCandidates(scored) → scored[]
  // sort: total asc, dann steps.length asc, dann plan.id lexikographisch — totale Ordnung, keine Instabilität.
```

### 5.9 `evidence.js`

```js
EVIDENCE_CATEGORIES  // Object.freeze(["playable","temporal","audio","interaction_flow","visual_state","human_visual_review"])
createEvidenceContract(request, planId, pathEdges) → EvidenceContract (§6.13)
  // deterministisch: Assertions aus request.contract.verify[] (1:1, Kategorie aus
  //   Mapping-Tabelle §8.4; unmappbare verify-Einträge → Kategorie "human_visual_review",
  //   automatable:false — Enthaltung statt erfundener Automatisierung)
  // + je Kante mit ROUTE_OBLIGATIONS.requiresLoss eine Assertion "declared loss is acceptable"
  //   (Kategorie visual_state bzw. temporal bei Animationsverlust, severity "major").
validateEvidenceContract(doc) → { ok, errors }   // Versions-Gate + Pflichtfelder je Assertion (§6.14)
```

### 5.10 `executionPlan.js`

```js
PLAN_VERSION = "trivium.execution-plan/v1"
createExecutionPlan({ request, pathEdges, registry, score, ledger, reviewItems, evidenceContract, fallbackPlanIds, createdAt }) → ExecutionPlan
  // createdAt wird INJIZIERT (Determinismus-Testbarkeit); CLI übergibt new Date().toISOString().
  // Baut ExecutionStep je Kante (§6.9): inputs/outputs als ArtifactRef mit
  //   deterministischen ids `art-<n>`; invocation aus manifest.execution.invocationTemplate
  //   (argumentBindings: Platzhalter "${input.<role>}", "${output.<role>}", "${param.<name>}" — reine Datenbindung,
  //   NIE String-Konkatenation zu einer Shellzeile);
  //   cacheKeyBasis = { toolId, toolVersion: manifest.version, capabilityId, parameterHashFields: Object.keys(parameters).sort(), inputArtifactIds }
  // plan.id = `plan-${request.id}-${zeroPad(laufindex,2)}`
validateExecutionPlan(plan) → { ok, errors }
  // planVersion-Gate → ERR_PLAN_VERSION_UNSUPPORTED; Step-Kette: jeder input muss
  //   sourceArtifact oder Output eines FRÜHEREN Steps sein → sonst error;
  //   evidenceContract Pflicht (leeres checks[] verboten — „kompiliert ist nicht fertig").
```

### 5.11 `planner.js`

```js
planRealization(request, registry, options = {}) → PlanningResult
  // options: { maxCandidates = 3, maxPathLength = 8, now = () => new Date().toISOString() }
  // Pipeline und Statusregeln exakt §7.4. Wirft NUR bei ERR_REQUEST_INVALID /
  // ERR_PLAN_VERSION_UNSUPPORTED (kaputte Eingabe = Programmierfehler des Aufrufers);
  // alle fachlichen Probleme werden Result-Status + diagnostics — Enthaltung ist ein Ergebnis, kein Crash.
```
`PlanningResult` (exakt):
```js
{
  resultVersion: "trivium.planning-result/v1",
  status: "planned" | "needs_human_review" | "unavailable",
  requestId: string,
  candidates: ExecutionPlan[],          // gerankt, max maxCandidates
  selectedPlanId: string | null,        // candidates[0].id bei status "planned", sonst null
  reviewItems: HumanReviewItem[],       // request-weite Items (plan-lokale stehen im Plan)
  diagnostics: PlanningDiagnostic[]
}
```

### 5.12 `wizard.js`

```js
importProductionAssessment(doc) → { request: rawRequest, reviewItems: HumanReviewItem[], diagnostics: PlanningDiagnostic[] }
  // doc.assessmentVersion !== "wizard.production-assessment/v1"
  //   → fail(ERR_ASSESSMENT_VERSION_UNSUPPORTED, "…nicht raten — WIZARD-Vertrag zuerst verifizieren")
  // Mapping-Tabelle §8.1. Fehlende Rolle → HumanReviewItem (blocking). Mehrere
  // Assetkandidaten je Rolle → ALLE als sourceArtifacts mit candidateGroup:"<rolle>",
  // Auswahl ist Planner-/Mensch-Sache, nie Import-Sache. userIntent wörtlich
  // (unverändert!) nach request.intent.userStatement.
```

### 5.13 `index.js` (trivium-plan)

Re-Exportiert exakt: `ERR, REALIZATION_ROUTES, ARTIFACT_STATES, normalizeState,
validateToolManifest, createToolRegistry, registerTool, getTool, removeTool,
listTools, findToolsForCapability, loadToolManifests,
normalizeRealizationRequest, validateRequest, buildCapabilityGraph,
enumeratePaths, SCORE_WEIGHTS, scoreCandidate, rankCandidates,
createEvidenceContract, validateEvidenceContract, PLAN_VERSION,
createExecutionPlan, validateExecutionPlan, planRealization,
importProductionAssessment`.

### 5.14 `bin/trivium.js` (Änderung)

Nach Zeile 36 (`const args = process.argv.slice(2);`): wenn `args[0] === "plan"`,
Verzweigung in `runPlanCommand(args.slice(1))` (Funktion am Dateiende, gleiche
flache Parse-Schleife):
```text
trivium plan <request.json> [--registry registry/tools] [--out trivium-out] [--from-wizard] [--max-candidates 3]
Exit: 0 planned · 2 needs_human_review · 4 unavailable · 1 Fehler
```
Schreibt `<out>/<requestId>/plan-<id>.json` je Kandidat +
`PLANNING_REPORT.md` (Stil: `formatReport()`-Anlehnung — Score-Tabelle,
Review-Liste, Diagnostics, volle Trace). Bestehender Weltpfad: unverändert.

---

## 6. Data Schemas (Ebene 4)

Gemeinsame Regeln: JSON, UTF-8, deterministische Feldreihenfolge wie hier
dokumentiert; alle Versionen als `"<name>/v1"`-String; Stabilitätsgarantie:
v1-Felder werden nie umgedeutet, nur additive optionale Felder bis v2;
Serialisierung `JSON.stringify(x, null, 2) + "\n"` (Bestandsmuster
`router.js` Zeile 98). Beziehungen: `ledgerEntry.route` benutzt
`REALIZATION_ROUTES` (Obermenge von Core-`ROUTES`); `ArtifactRef.state`
benutzt `ARTIFACT_STATES`; keine Struktur referenziert Engine-Objekte,
nur Tokens und Pfade (wir-spec §7).

### 6.1 `ARTIFACT_STATES` v1 (geschlossener Kanon, `artifactState.js`)

```text
wir.world · character.model-3d · unity.package · unity.project ·
mesh.fbx · mesh.gltf · mesh.glb · texture.png · material.desc ·
skeleton.rig · anim.clips · sprite.frames · sprite.atlas ·
swift.actor-bundle · shaded.scene-project · shaded.storyboard ·
godot.resource · godot.scene · unreal.staticmesh · unreal.skeletal-asset ·
logic.fir-notes · audio.wav
```
Erweiterung nur per Commit, der Token + mindestens ein Manifest + Test
zusammen einführt (Muster `INTENT_AXES`).

### 6.2 `ToolManifest` (`trivium.tool-manifest/v1`)

Pflicht: `manifestVersion, id, name, version, provenance{origin, repositoryOrVendor},
license{spdx|"unknown", inputRightsNote}, execution{mode:"cli"|"editor"|"service"|"library"|"manual",
headless:true|false|"partial"|"unknown", invocationTemplate|null}, availability{status:"declared"|"installed"|"unavailable"},
capabilities[≥1], confidence:0..1, status:"candidate"|"verified"|"rejected"|"superseded"`.
Optional: `costModel{perRunCents:0, estimatedSecondsPerRun}, networkPolicy:"none"(default)|"fetch-source-only"|"unrestricted",
hardware{gpu:false, minRamMb}, deterministic:true|false|"unknown"(default),
knownLosses[], manualSteps[], evidenceRef:null, notes`.
`Capability` (eingebettet, Pflicht): `capabilityId, route (∈ REALIZATION_ROUTES),
accepts[≥1], produces[≥1]`; optional `expectedLosses[](LossEntry-Kurzform {type, detail}),
expectedGains[], contractRefRequired:false, parametersSchema{<name>:{type,required,default}}`.

Beispiel (zugleich Datei 14, gekürzt um Kommentare — die echte Datei ist
vollständig; SWIFT-CLI-Bindung trägt `"unverified": true` bis §10 Schritt 12):

```json
{
  "manifestVersion": "trivium.tool-manifest/v1",
  "id": "swift",
  "name": "SWIFT sprite/actor former",
  "version": "0.0.0-unverified",
  "provenance": { "origin": "sister-repo", "repositoryOrVendor": "lootziffer666/SWIFT" },
  "license": { "spdx": "unknown", "inputRightsNote": "eigene Assets des Nutzers" },
  "execution": {
    "mode": "cli", "headless": "unknown",
    "invocationTemplate": {
      "kind": "cli", "executable": "node", "args": ["${swiftRepo}/cli.js", "bake-actor"],
      "argumentBindings": [
        { "flag": "--model", "from": "input.model" },
        { "flag": "--directions", "from": "param.directions" },
        { "flag": "--anims", "from": "param.animations" },
        { "flag": "--out", "from": "output.bundleDir" }
      ],
      "workingDirectory": "${workDir}", "stdoutContract": "diagnostics",
      "stderrContract": "diagnostics", "successExitCodes": [0], "unverified": true
    }
  },
  "availability": { "status": "declared" },
  "capabilities": [
    {
      "capabilityId": "bake.actor-bundle.eight-direction",
      "route": "bake",
      "accepts": ["character.model-3d", "mesh.glb"],
      "produces": ["swift.actor-bundle"],
      "expectedLosses": [
        { "type": "dynamics", "detail": "Rig/Cloth zu Frames gebacken" },
        { "type": "precision", "detail": "kontinuierliche Rotation auf 8 Richtungen reduziert" }
      ],
      "expectedGains": [
        { "type": "performance", "detail": "kein Skeletal-Runtime im Ziel nötig" },
        { "type": "portability", "detail": "PNG+Manifest laufen in jedem SHADED" }
      ],
      "parametersSchema": {
        "directions": { "type": "number", "required": false, "default": 8 },
        "animations": { "type": "string", "required": true }
      }
    }
  ],
  "confidence": 0.3, "status": "candidate", "deterministic": "unknown",
  "networkPolicy": "none",
  "notes": "Bundle-Form {image, manifest, depthImage?, emissiveImage?} ist aus adapters/shaded/adapter.js Zeile 309 belegt; CLI-Bindung MUSS gegen ../SWIFT verifiziert werden (Plan §10 Schritt 12)."
}
```

### 6.3 `CapabilityEdge` (nur in-memory, `capabilityGraph.js`)

```json
{
  "from": "mesh.glb", "to": "swift.actor-bundle",
  "toolId": "swift", "toolVersion": "0.0.0-unverified",
  "capabilityId": "bake.actor-bundle.eight-direction",
  "route": "bake",
  "expectedLosses": [], "expectedGains": [],
  "confidence": 0.3, "deterministic": "unknown",
  "manualStepCount": 0, "estimatedSeconds": 60, "moneyCents": 0,
  "networkPolicy": "none", "gpu": false, "licenseRisk": 0.5,
  "availability": "declared", "toolStatus": "candidate"
}
```
`licenseRisk`-Ableitung (deterministisch): spdx unknown → 0.5; GPL-Familie
und produziertes Artefakt wird distribuiert (`request.constraints.distributionIntent
!== "none"`) → 0.7; permissiv (MIT/BSD/Apache/CC0) → 0.0; proprietär
lizenziert-ok → 0.2.

### 6.4 `RealizationRequest` (`trivium.realization-request/v1`)

Pflicht: `requestVersion, id, intent{userStatement, role}, sourceArtifacts[≥1](ArtifactRef),
target{state (∈ ARTIFACT_STATES), form}, contract{preserve[≥1], project[], mayApproximate[], mustNot[], verify[]}`.
Optional: `constraints (§6.5, defaults), worldRef (Pfad zu <id>.wir.json), provenance{}, candidateNotes`.

```json
{
  "requestVersion": "trivium.realization-request/v1",
  "id": "waechterin-to-shaded",
  "intent": { "userStatement": "Die Wächterin soll in der SHADED-Sturmnacht sichtbar auftreten.", "role": "humanoid_guard_presence" },
  "sourceArtifacts": [
    { "id": "art-src-1", "state": "character.model-3d", "uri": "assets/waechterin.glb",
      "license": { "spdx": "CC0-1.0" }, "provenance": { "origin": "user" }, "candidateGroup": null }
  ],
  "target": { "state": "shaded.scene-project", "form": "2d-living-image" },
  "contract": {
    "preserve": ["recognizable_silhouette", "idle_presence", "position_anchor_0.40_0.80", "depth_layer_mid"],
    "project": ["visual"], "mayApproximate": ["continuous_rotation", "cloth_motion"],
    "mustNot": ["actor_without_manifest", "engine_internals_touched"],
    "verify": ["actor_visible_in_scene", "idle_loop_runs", "fog_affects_actor"]
  },
  "worldRef": "tools/verify-out/dorf-sturmnacht/shaded/dorf-sturmnacht.wir.json",
  "constraints": {}
}
```

### 6.5 `PlanningConstraints` (Defaults = `PLANNING_CONSTRAINT_DEFAULTS`)

```json
{
  "maxSteps": 8, "maxMoneyCents": 0, "maxManualSteps": 2,
  "allowNetwork": false, "requireHeadless": false, "requireDeterministic": false,
  "requireInstalled": false, "minConfidence": 0.0,
  "deniedLicenses": [], "distributionIntent": "private",
  "allowedExecutors": ["anvil", "human"], "hardwareGpu": true
}
```
Hart (filtern Kanten): `maxMoneyCents, allowNetwork, requireHeadless,
requireDeterministic, requireInstalled, deniedLicenses, minConfidence,
hardwareGpu=false`. Weich (nur Score): alles Übrige. `maxSteps` kappt die
Pfadlänge zusätzlich zu `options.maxPathLength` (das Minimum gilt).

### 6.6 `ArtifactRef`

```json
{ "id": "art-3", "state": "swift.actor-bundle", "uri": "work/waechterin-bundle/",
  "producedByStep": "step-2", "license": { "spdx": "CC0-1.0" },
  "provenance": { "origin": "derived", "sourceIds": ["art-src-1"] },
  "contentHash": null, "candidateGroup": null }
```
`contentHash` ist immer `null` im Plan (TRIVIUM führt nicht aus; ANVIL
füllt ihn zur Laufzeit). `producedByStep` `null` für Quellartefakte.

### 6.7 `LossEntry` / 6.8 `GainEntry` (Form aus `src/ledger.js` übernommen, um `ruleId/reason` erweitert)

```json
{ "obligationId": "cloth_motion", "route": "bake", "type": "dynamics",
  "detail": "Cloth-Simulation zu Frames gebacken", "ruleId": "TRV-PLAN-BAKE-SWIFT",
  "reason": "Capability bake.actor-bundle.eight-direction deklariert diesen Verlust", "stepId": "step-2" }
```
```json
{ "obligationId": "adapter.shaded", "type": "affordance",
  "detail": "Actor erbt Fog/DayNight-Licht und Depth-Layering gratis",
  "ruleId": "TRV-PLAN-GAIN-TARGET", "stepId": "step-3" }
```
`type` Verlust ∈ `semantic|functional|dynamics|precision|perception|structure|provenance|reversibility`
(loss-taxonomy §3; `provenance` → Plan wird NIE erzeugt, Kandidat fällt aus);
`type` Gewinn ∈ `affordance|accessibility|observability|performance|portability|composability` (§4).

### 6.9 `ExecutionStep`

Alle 20 Pflichtfelder:

```json
{
  "id": "step-2",
  "capabilityId": "bake.actor-bundle.eight-direction",
  "toolId": "swift",
  "toolManifestVersion": "0.0.0-unverified",
  "executor": "anvil",
  "inputs": ["art-2"],
  "outputs": ["art-3"],
  "parameters": { "directions": 8, "animations": "idle" },
  "preconditions": ["art-2 exists", "tool swift resolvable by MYTHIC"],
  "postconditions": ["art-3 contains image+manifest", "manifest lists anim 'idle'"],
  "cacheKeyBasis": { "toolId": "swift", "toolVersion": "0.0.0-unverified",
    "capabilityId": "bake.actor-bundle.eight-direction",
    "parameterHashFields": ["animations", "directions"], "inputArtifactIds": ["art-2"] },
  "retry": { "maxAttempts": 2, "backoffSeconds": 5, "retryOn": ["nonzero-exit", "timeout"] },
  "recovery": { "action": "fallback-plan", "fallbackNote": "bei Rig-Fehlschlag: human_review_rig" },
  "timeoutHintSeconds": 300,
  "networkPolicy": "none",
  "secretRequirements": [],
  "expectedLosses": [ { "type": "dynamics", "detail": "…" } ],
  "expectedGains": [ { "type": "performance", "detail": "…" } ],
  "humanReviewGate": null,
  "evidenceHooks": ["ev-a3"],
  "invocation": {
    "kind": "cli", "executable": "node", "args": ["${swiftRepo}/cli.js", "bake-actor"],
    "argumentBindings": [
      { "flag": "--model", "from": "input.model", "artifactId": "art-2" },
      { "flag": "--anims", "from": "param.animations" },
      { "flag": "--out", "from": "output.bundleDir", "artifactId": "art-3" }
    ],
    "workingDirectory": "${workDir}", "stdoutContract": "diagnostics",
    "stderrContract": "diagnostics", "successExitCodes": [0]
  }
}
```
`executor` ∈ `anvil|mythic|human|trivium-adapter`. `invocation.kind` ∈
`cli|adapter|manual|service`; bei `adapter`:
`{ "kind":"adapter", "adapterName":"shaded", "entry":"translate", "worldRef":"…" }`;
bei `manual`: `{ "kind":"manual", "instructions":"…" }` und `humanReviewGate` ≠ null.
Keine freie Shellzeile — `args` sind ein Array, Bindings sind Daten.

### 6.10 `PlanCandidate` = ExecutionPlan mit `status:"candidate"` + `score`-Block (§6.11). Kein eigenes Schema.

### 6.11 `ExecutionPlan` (`trivium.execution-plan/v1`) — Rahmen

```json
{
  "planVersion": "trivium.execution-plan/v1",
  "id": "plan-waechterin-to-shaded-01",
  "requestId": "waechterin-to-shaded",
  "status": "candidate",
  "sourceArtifacts": [], "target": {}, "constraints": {},
  "steps": [],
  "lossGainLedger": { "losses": [], "gains": [], "trace": [] },
  "humanReview": [],
  "evidenceContract": {},
  "score": { "total": 0.0, "axes": {} },
  "fallbackPlanIds": [],
  "requestRef": "examples/requests/waechterin-to-shaded.request.json",
  "createdAt": "2026-07-12T00:00:00.000Z"
}
```
`trace` = ein Eintrag je Step im Ledger-Stil
(`{stepId, route, ruleId, reason, via: toolId}`) — dieselbe
Rechenschaftsform wie `ledger.events`.

### 6.12 `HumanReviewItem`

```json
{ "id": "rev-1", "severity": "blocking", "category": "unknown_capability",
  "subject": "logic.prefab-script 'GuardPatrol.cs'",
  "question": "Patrol-Logik hat keinen Function-Contract — FIR-Bergung oder bewusster degrade?",
  "options": ["fir_recovery", "degrade_to_static_guard", "drop"],
  "blockedStepIds": ["step-5"], "ruleId": "TRV-PLAN-UNKNOWN", 
  "reason": "kein Tool deklariert eine Capability für unity.prefab-Logik → designte Enthaltung" }
```
`severity` ∈ `blocking|advisory`. `category` ∈
`unknown_capability|license_unknown|tool_unverified|contract_gap|candidate_choice|manual_step`.

### 6.13 `EvidenceContract` (`trivium.evidence-contract/v1`)

```json
{ "evidenceVersion": "trivium.evidence-contract/v1",
  "id": "ev-waechterin-to-shaded-01", "planId": "plan-waechterin-to-shaded-01",
  "consumer": "cue-agent", "assertions": [], 
  "artifactsRequired": ["screenshot_before", "screenshot_after", "run-log"] }
```

### 6.14 `EvidenceAssertion` (alle 10 Pflichtfelder)

```json
{ "id": "ev-a1", "category": "visual_state",
  "precondition": "Szene geladen, isReady()===true, Bundle gespawnt",
  "action": "TRIVIUM_DRIVER.moment('sturmnacht'); 2s warten",
  "observableSignal": "Screenshot-Region um Anker (0.40,0.80)",
  "expected": "Actor-Silhouette sichtbar, durch fog gedimmt",
  "tolerance": "Silhouetten-Pixelanteil ≥ 60% des Referenzframes",
  "severityOnFail": "major", "automatable": true,
  "cueCommand": "cue run visual-state --region 0.40,0.80 --compare ref/waechterin-idle.png" }
```
`category` ∈ `EVIDENCE_CATEGORIES` (§5.9). `severityOnFail` ∈ `blocker|major|minor`.
`cueCommand` ist deklarativ; ob CUE ihn so spricht, verifiziert §10 Schritt 13 —
bis dahin trägt der Contract `"consumerContractVerified": false` auf Top-Level.

### 6.15 `PlanningDiagnostic`

```json
{ "severity": "warn", "code": "TRV-PLAN-W-UNKNOWN-FIELD",
  "message": "registry/tools/swift.tool.json: unbekanntes Feld 'colour' behalten, nicht gedeutet",
  "ref": "registry/tools/swift.tool.json" }
```
Codes: `error`-Diagnostics tragen `ERR_*`-Codes aus §5.1; `warn/info` tragen
`TRV-PLAN-W-*`/`TRV-PLAN-I-*`. Zentral definiert in `errors.js` (einzige Quelle).

---

## 7. Algorithm Specification (Ebenen 6–8)

### 7.1 Registry-Entscheidung (verbindlich): **getrennte Tool Registry**

Begründung am Code: `createRegistry()` (`src/registry.js`) validiert
`realize`-Funktion (Zeile 40–42) und matcht Concept-Kinds mit `*`-Präfix
(Zeile 67–79) — beides existiert für Tool-Manifeste nicht (Daten ohne Code,
Formate statt Kinds). Umgekehrt braucht die Tool-Registry Format-Indizes
(`byProduces/byAccepts`), die für Adapter sinnlos sind. Eine gemeinsame
Registry würde beide Verträge aufweichen. **Brücke statt Fusion:** Adapter
treten im Graph als Tool-Manifeste auf (Datei 16, `execution.mode:"library"`,
`invocation.kind:"adapter"`, Capability `emit.world.shaded` mit
`accepts:["wir.world"], produces:["shaded.scene-project"]`) — die
Adapter-Registry selbst bleibt unberührt.

### 7.2 Pfadsuche (verbindlich): **erschöpfende, azyklische, tiefenbegrenzte DFS-Enumeration**

Kein Dijkstra/A\*. Begründung: (a) Graphgröße ist winzig — v1-Registry hat
8 Manifeste, < 30 Kanten, `maxPathLength 8`; vollständige Enumeration ist
in Mikrosekunden fertig. (b) Die Kostenachsen sind **nicht kantenadditiv**
(`licenseRisk` = Maximum, `confidence` = Minimum, `determinism` = UND über
den Pfad) — Dijkstras Optimalitätsgarantie gilt nur für additive Kosten;
eine Skalarisierung pro Kante wäre eine stille Verfälschung. (c) Der Planner
braucht MEHRERE konkurrierende Kandidaten (Beweisroute B/C), nicht einen
kürzesten Pfad. Enumeration + nachgelagerte Pfad-Bewertung ist die einzige
Variante, die alle drei Anforderungen ohne Heuristik-Risiko erfüllt.

Algorithmus (`enumeratePaths`):
```text
stack-DFS ab jedem startState (sortiert), onPath = Set der besuchten Nodes,
Kantenreihenfolge = vorsortierte Adjazenzlisten (from,to,toolId,capabilityId).
node === goalState → Pfad kopieren in results.
Tiefe === min(maxPathLength, constraints.maxSteps) → Ast beenden.
Zyklen: to ∈ onPath → Kante überspringen (azyklisch per Konstruktion).
results deterministisch in Entstehungsreihenfolge (durch Sortierung total geordnet).
Obergrenze results.length = 64 (Schutz; Überlauf → warn-Diagnostic TRV-PLAN-W-PATH-BUDGET).
```
Fallback-Kanten: Kanten, deren Tool `availability:"unavailable"` oder
`status:"rejected"` hat, werden NICHT in den Graph aufgenommen (nicht
planbar). `status:"candidate"`/`"declared"` bleiben planbar (TRIVIUM führt
nicht aus), erzeugen aber Review-Items (§7.4) und Score-Malus. Human-Review-
Kanten: `execution.mode:"manual"`-Capabilities erzeugen Steps mit
`humanReviewGate` ≠ null und zählen gegen `constraints.maxManualSteps` (hart).

### 7.3 Kostenfunktion (verbindlich, `scoring.js`)

`total = Σ axis SCORE_WEIGHTS[axis] × penalty[axis]`, alle Penalties 0..1,
niedriger = besser. Gewichte (Summe 1.0, `Object.freeze`):

| Achse | Gewicht | Penalty-Formel (deterministisch, pfadweise) |
|---|---|---|
| qualityLoss | 0.25 | `min(1, Σ_steps lossSeverity)`; lossSeverity je LossEntry: semantic/functional 0.4 · dynamics/perception 0.2 · precision/structure 0.1 · reversibility 0.3 |
| targetFidelity | 0.20 | `uncovered/required`: Anteil der `contract.preserve`-Einträge, die in KEINER Step-Postcondition und keinem `expectedGains/produces`-Mapping auftauchen (String-Match auf obligationId) |
| toolConfidence | 0.15 | `1 − min(edge.confidence über Pfad)` |
| manualWork | 0.10 | `manualSteps / constraints.maxManualSteps` (gekappt 1) |
| licenseRisk | 0.10 | `max(edge.licenseRisk über Pfad)` (§6.3-Ableitung) |
| determinism | 0.05 | 0 wenn alle Kanten `deterministic:true`; 0.5 wenn eine `"unknown"`; 1 wenn eine `false` |
| executionTime | 0.05 | `min(1, Σ estimatedSeconds / 3600)` |
| moneyCost | 0.05 | `min(1, Σ moneyCents / max(1, constraints.maxMoneyCents))`; bei `maxMoneyCents 0`: 0 wenn kostenlos, sonst Kante bereits hart gefiltert |
| networkUse | 0.025 | 0 alle `"none"` · 0.5 eine `"fetch-source-only"` · 1 eine `"unrestricted"` |
| hardware | 0.025 | 0 keine GPU-Kante · 1 sonst wenn `constraints.hardwareGpu` true (false → hart gefiltert) |

Rundung `total` auf 4 Nachkommastellen; Ranking-Tiebreak: Schrittzahl asc,
dann `plan.id` lexikographisch. Alle Eingaben stammen aus Manifesten und
Request — **keine Uhrzeit, kein Zufall, keine Umgebungsabfrage** im Score
(Reproduzierbarkeits-Risiko §12.8).

### 7.4 Planner-Pipeline (`planRealization`, exakt)

| Schritt | Funktion (Datei) | Input → Output | Fehlerpfad |
|---|---|---|---|
| 1 normalize | `normalizeRealizationRequest` (request.js) | raw → frozen request | throw `ERR_REQUEST_INVALID`/`ERR_PLAN_VERSION_UNSUPPORTED` |
| 2 validate | `validateRequest` (request.js) | request → diagnostics | errors>0 → return `{status:"unavailable", diagnostics}` — außer Engine-Token/Contract-Fehler: throw `ERR_CONTRACT_UNSUPPORTED` (Programmfehler des Erstellers) |
| 3 derive | intern `deriveCapabilities` (planner.js) | contract.preserve+target → benötigte Ziel-Obligationen (Liste von obligationIds) | rein, wirft nie |
| 4 resolve | intern `resolveStartStates` (planner.js) | sourceArtifacts → Set startStates (je `candidateGroup` getrennte Startmengen) | leer → unavailable |
| 5 graph | `buildCapabilityGraph` (capabilityGraph.js) | registry+constraints → graph | 0 Kanten → unavailable + `ERR_NO_REALIZATION_PATH`-Diagnostic |
| 6 paths | `enumeratePaths` | graph → CapabilityEdge[][] | [] → unavailable + Diagnostic |
| 7 score | `scoreCandidate` (scoring.js) | Pfad+request+registry → score | rein |
| 8 ledger | intern `buildPlanLedger` (planner.js) | Pfad → lossGainLedger (Losses/Gains/Trace, `ruleId` `TRV-PLAN-<ROUTE>-<TOOLID>`, `reason` aus Capability) | Verlust ohne detail → Kandidat verwerfen + error-Diagnostic (Verlust-Pflicht) |
| 9 review | intern `deriveHumanReview` (planner.js) | Pfad+request → HumanReviewItem[] — Regeln: Tool `status:"candidate"` in benutztem Step → advisory `tool_unverified`; `license.spdx:"unknown"` → blocking `license_unknown`; ungedeckte preserve-Obligation → blocking `contract_gap`; `candidateGroup` mit >1 Quelle → advisory `candidate_choice`; `manual`-Step → advisory `manual_step` | rein |
| 10 evidence | `createEvidenceContract` (evidence.js) | request+planId+Pfad → EvidenceContract | leeres verify[] UND keine Loss-Assertions → Kandidat verwerfen (`ERR_EVIDENCE_INVALID`-Diagnostic): kein Plan ohne Beweispflicht |
| 11 build | `createExecutionPlan` (executionPlan.js) | alles → ExecutionPlan; `validateExecutionPlan` als Selbstprüfung | !ok → Kandidat verwerfen + error-Diagnostic (nie ungültige Pläne emittieren) |
| 12 rank | `rankCandidates` (scoring.js) | Kandidaten → sortiert, auf maxCandidates gekappt; `fallbackPlanIds` = ids der jeweils schlechter platzierten Kandidaten | rein |

Reine Funktionen (MÜSSEN es bleiben, Tests erzwingen das per doppeltem
Aufruf + deepStrictEqual): Schritte 2–3, 5–12 bei injiziertem `now`.
Nie geraten werden: Lizenz, Version, Headless-Fähigkeit, CLI-Argumente,
Verluste — fehlt die Angabe im Manifest, gilt `"unknown"` und erzeugt
Review/Malus, nie einen Defaultwert, der Fähigkeit behauptet.

Statusregeln (exakt):
- `"planned"` ⇔ ≥1 Kandidat überlebt Schritt 11 UND dieser Kandidat hat
  kein `blocking`-ReviewItem. `selectedPlanId` = bester solcher Kandidat.
- `"needs_human_review"` ⇔ ≥1 Kandidat überlebt, aber JEDER hat ≥1
  `blocking`-ReviewItem. `selectedPlanId:null`; Kandidaten werden trotzdem
  zurückgegeben (der Mensch entscheidet mit vollem Material).
- `"unavailable"` ⇔ kein Kandidat überlebt (kein Pfad, alle verworfen).
  `candidates:[]`, Diagnostics erklären warum (`ERR_NO_REALIZATION_PATH`
  oder die Verwerfungsgründe).

---

## 8. Cross-Repo Mappings (Ebene 10)

Ehrlichkeitsregel: aus DIESEM Repo belegt sind nur SHADED-API und
SWIFT-Bundle-Form (§1 Punkt 10). Alle übrigen Verträge werden als
versionierte TRIVIUM-Seite definiert; §10 Schritte 12–13 verifizieren sie
gegen die Schwester-Repos, bevor `"unverified"`-Flags fallen dürfen.

### 8.1 WIZARD → `importProductionAssessment` (wizard.js)

Erwartetes Eingabeformat (TRIVIUM-seitiger Vertrag; Versions-Gate hart):
`{ assessmentVersion:"wizard.production-assessment/v1", assessmentId, userIntent,
roles:[{ roleId, semantic, required:bool, candidates:[{ assetId, uri, platform,
license{spdx}, formatState, confidence }] }], targetPreference:{state,form}|null }`.
Mapping: `assessmentId → request.id` (Präfix `wiz-`); `userIntent →
intent.userStatement` (wörtlich, unverändert — Nutzerabsicht wird bewahrt,
nie paraphrasiert); je `required`-Rolle ohne Kandidaten → blocking
`HumanReviewItem{category:"contract_gap"}` (Missing-Asset-Behandlung);
je Kandidat → `ArtifactRef` mit `candidateGroup:roleId`,
`state:normalizeState(formatState)` (unbekanntes Format → Kandidat wird
NICHT verworfen, sondern blocking-Review `unknown_capability`); `platform`
und `uri` reisen unverändert in `ArtifactRef` mit; `license` Pflichtdurchreiche.
`targetPreference:null` → zwei Requests werden vom CLI erzeugt (SHADED-2.5D
und Engine-3D, Beispiel C) — Zielwahl ist Planner-Vergleich, keine Import-Heuristik.
Versionsabweichung → `fail(ERR_ASSESSMENT_VERSION_UNSUPPORTED)`. Keine
WIZARD-Suche, kein Netz.

### 8.2 SWIFT (Manifest Datei 14, §6.2)

Capability-IDs: `bake.actor-bundle.eight-direction` (v1 einzige).
Input: `character.model-3d|mesh.glb`; Output: `swift.actor-bundle` =
Verzeichnis mit `{image: atlas.png, manifest: manifest.json, depthImage?:
depth.png, emissiveImage?: emissive.png}` — exakt die Form, die
`spawnActors()` im generierten SHADED-Driver konsumiert (adapter.js
Zeile 309–318). Optionale Ausgaben depth/normal/emissive/world-state:
im Manifest als `parametersSchema.extras {type:"string", required:false,
default:""}`; fehlen sie im Bundle, bleibt der Driver-Pfad gültig
(`depthImage: a.depthImage || undefined` — bereits implementiert).
Exit-Code-Mapping: `successExitCodes:[0]`; alles andere → ANVIL-Retry-Regel
des Steps. CLI-Bindung trägt `"unverified": true` bis Schritt 12.

### 8.3 SHADED (Manifeste Dateien 15+16)

`trivium-shaded-adapter.tool.json`: Capability `emit.world.shaded`,
`route:"native"`, `accepts:["wir.world"], produces:["shaded.scene-project"]`,
`invocation {kind:"adapter", adapterName:"shaded", entry:"translate"}` —
belegt durch `T.translate(build(),"shaded",reg)` (verify-live.js Zeile 40–43).
`shaded-target.tool.json`: Capability `compose.shaded.actor-into-scene`,
`route:"bridge"`, `accepts:["swift.actor-bundle","shaded.scene-project"],
produces:["shaded.scene-project"]`, `execution.mode:"library"` — Actor-Bundle
wird über den generierten Driver (`spawnActors(assetResolver)`) angebunden;
Storyboard-/Akt-Mapping und High-Level-Parameter kommen aus dem bestehenden
Adapter (Momente → `{name,dur,p}`); World-State-Verknüpfung =
`window.TRIVIUM_DRIVER.state`. Evidence-Hooks: Screenshot + `getParams()`
+ `story.board()`-Inspektion (exakt die Prüfmuster aus verify-live.js).

### 8.4 CUE-AGENT (nur Deklaration, evidence.js)

Kategorien-Mapping `contract.verify[]` → Kategorie (Tabelle, verbindlich):
`*_visible*|*silhouette*|*state*` → visual_state; `*loop*|*runs*|*plays*|*blend*`
→ temporal; `*traversable*|*trigger*|*interaction*|*dialog*` → interaction_flow;
`*audio*|*sound*` → audio; `*playable*|*boots*|*starts*` → playable; sonst →
human_visual_review (`automatable:false`). Jede Assertion trägt die 10 Felder
aus §6.14. TRIVIUM führt nichts aus; `cueCommand` ist ein deklarativer
Vorschlag mit `consumerContractVerified:false` bis Schritt 13.

### 8.5 ANVIL / MYTHIC

ANVIL benötigt (und bekommt) je Step: `executor, invocation, retry, recovery,
timeoutHintSeconds, cacheKeyBasis, inputs/outputs (ArtifactRef-ids),
humanReviewGate, evidenceHooks`. MYTHIC benötigt: `toolId + toolManifestVersion
+ availability + execution.mode + networkPolicy + secretRequirements +
hardware` (alles im Manifest/Step vorhanden). Toolverfügbarkeit wird
GEMELDET, nie geprüft: `availability.status` ist deklarative Manifest-Angabe;
`requireInstalled:true` filtert hart. Resume/Recovery: `recovery.action` ∈
`retry-step|fallback-plan|abort-plan|human`; Artefakt-Referenzen zwischen
Steps ausschließlich über `ArtifactRef.id` (`producedByStep`-Kette —
`validateExecutionPlan` erzwingt Topologie). TRIVIUM besitzt absichtlich
NICHT: Laufzeit-Hashes (`contentHash:null`), Container-Images, Scheduling,
Secrets-Werte (nur `secretRequirements`-Namen), Ausführungslogs.

---

## 9. Three Complete Example Plans (Ebene 11)

Gekürzt um Wiederholung identischer Blöcke (`constraints` = Defaults §6.5);
Struktur exakt Schema §6. Diese JSONs sind die Soll-Ausgaben der Tests
in `test/test_planner.js` (Determinismus: zweimal planen ⇒ deepStrictEqual
bei injiziertem `now`).

### 9.1 Beispiel A — 3D-Charakter → SWIFT → SHADED (Request §6.4)

```json
{
  "planVersion": "trivium.execution-plan/v1",
  "id": "plan-waechterin-to-shaded-01",
  "requestId": "waechterin-to-shaded",
  "status": "candidate",
  "sourceArtifacts": [ { "id": "art-src-1", "state": "character.model-3d", "uri": "assets/waechterin.glb", "license": { "spdx": "CC0-1.0" }, "provenance": { "origin": "user" }, "producedByStep": null, "contentHash": null, "candidateGroup": null } ],
  "target": { "state": "shaded.scene-project", "form": "2d-living-image" },
  "constraints": { "…": "PLANNING_CONSTRAINT_DEFAULTS" },
  "steps": [
    { "id": "step-1", "capabilityId": "emit.world.shaded", "toolId": "trivium-shaded-adapter",
      "toolManifestVersion": "1.0.0", "executor": "trivium-adapter",
      "inputs": ["art-wir"], "outputs": ["art-scene"], "parameters": {},
      "preconditions": ["dorf-sturmnacht.wir.json vorhanden"],
      "postconditions": ["driver.js + marker-brief.md + wir.json emittiert"],
      "cacheKeyBasis": { "toolId": "trivium-shaded-adapter", "toolVersion": "1.0.0", "capabilityId": "emit.world.shaded", "parameterHashFields": [], "inputArtifactIds": ["art-wir"] },
      "retry": { "maxAttempts": 1, "backoffSeconds": 0, "retryOn": [] },
      "recovery": { "action": "abort-plan", "fallbackNote": "Adapter-Emission ist deterministisch; Fehler = Bug" },
      "timeoutHintSeconds": 30, "networkPolicy": "none", "secretRequirements": [],
      "expectedLosses": [ { "type": "perception", "detail": "intimacy hat kein SHADED-Vokabular (preserve-Route des Adapters)" } ],
      "expectedGains": [ { "type": "affordance", "detail": "31 Weltgesetze reagieren unaufgefordert" } ],
      "humanReviewGate": null, "evidenceHooks": ["ev-a2"],
      "invocation": { "kind": "adapter", "adapterName": "shaded", "entry": "translate", "worldRef": "tools/verify-out/dorf-sturmnacht/shaded/dorf-sturmnacht.wir.json" } },
    { "id": "step-2", "capabilityId": "bake.actor-bundle.eight-direction", "toolId": "swift",
      "toolManifestVersion": "0.0.0-unverified", "executor": "anvil",
      "inputs": ["art-src-1"], "outputs": ["art-bundle"],
      "parameters": { "directions": 8, "animations": "idle" },
      "preconditions": ["waechterin.glb lesbar", "SWIFT via MYTHIC bereit"],
      "postconditions": ["bundle enthält image+manifest", "manifest listet 'idle'"],
      "cacheKeyBasis": { "toolId": "swift", "toolVersion": "0.0.0-unverified", "capabilityId": "bake.actor-bundle.eight-direction", "parameterHashFields": ["animations","directions"], "inputArtifactIds": ["art-src-1"] },
      "retry": { "maxAttempts": 2, "backoffSeconds": 5, "retryOn": ["nonzero-exit","timeout"] },
      "recovery": { "action": "human", "fallbackNote": "human_review_rig" },
      "timeoutHintSeconds": 300, "networkPolicy": "none", "secretRequirements": [],
      "expectedLosses": [ { "type": "dynamics", "detail": "Rig zu Frames gebacken" }, { "type": "precision", "detail": "Rotation auf 8 Richtungen" } ],
      "expectedGains": [ { "type": "performance", "detail": "kein Skeletal-Runtime" }, { "type": "portability", "detail": "PNG+Manifest" } ],
      "humanReviewGate": null, "evidenceHooks": ["ev-a3"],
      "invocation": { "kind": "cli", "executable": "node", "args": ["${swiftRepo}/cli.js","bake-actor"], "argumentBindings": [ { "flag": "--model", "from": "input.model", "artifactId": "art-src-1" }, { "flag": "--anims", "from": "param.animations" }, { "flag": "--out", "from": "output.bundleDir", "artifactId": "art-bundle" } ], "workingDirectory": "${workDir}", "stdoutContract": "diagnostics", "stderrContract": "diagnostics", "successExitCodes": [0] } },
    { "id": "step-3", "capabilityId": "compose.shaded.actor-into-scene", "toolId": "shaded-target",
      "toolManifestVersion": "1.0.0", "executor": "anvil",
      "inputs": ["art-scene","art-bundle"], "outputs": ["art-final"], "parameters": { "slotId": "waechterin" },
      "preconditions": ["TRIVIUM_DRIVER geladen, S.isReady()"],
      "postconditions": ["spawnActors() liefert actors.waechterin", "Anker (0.40,0.80), depthLayer mid"],
      "cacheKeyBasis": { "toolId": "shaded-target", "toolVersion": "1.0.0", "capabilityId": "compose.shaded.actor-into-scene", "parameterHashFields": ["slotId"], "inputArtifactIds": ["art-scene","art-bundle"] },
      "retry": { "maxAttempts": 2, "backoffSeconds": 2, "retryOn": ["timeout"] },
      "recovery": { "action": "retry-step" }, "timeoutHintSeconds": 120,
      "networkPolicy": "none", "secretRequirements": [],
      "expectedLosses": [], "expectedGains": [ { "type": "affordance", "detail": "Actor erbt fog/dayNight + Depth-Layering (Manifest-Gain grammar.entity.character)" } ],
      "humanReviewGate": null, "evidenceHooks": ["ev-a1","ev-a4"],
      "invocation": { "kind": "cli", "executable": "node", "args": ["tools/verify-live.js"], "argumentBindings": [ { "flag": "--bundle", "from": "input.bundle", "artifactId": "art-bundle" } ], "workingDirectory": ".", "stdoutContract": "diagnostics", "stderrContract": "diagnostics", "successExitCodes": [0] } }
  ],
  "lossGainLedger": {
    "losses": [
      { "obligationId": "cloth_motion", "route": "bake", "type": "dynamics", "detail": "Rig zu Frames gebacken", "ruleId": "TRV-PLAN-BAKE-SWIFT", "reason": "Capability deklariert Dynamikverlust", "stepId": "step-2" },
      { "obligationId": "continuous_rotation", "route": "bake", "type": "precision", "detail": "8 Richtungen", "ruleId": "TRV-PLAN-BAKE-SWIFT", "reason": "mayApproximate deckt dies", "stepId": "step-2" }
    ],
    "gains": [
      { "obligationId": "adapter.shaded", "type": "affordance", "detail": "Weltgesetze + Materialwahrheit gratis", "ruleId": "TRV-PLAN-GAIN-TARGET", "stepId": "step-1" },
      { "obligationId": "actor.lighting", "type": "affordance", "detail": "fog/dayNight wirken auf Actor", "ruleId": "TRV-PLAN-GAIN-TARGET", "stepId": "step-3" }
    ],
    "trace": [
      { "stepId": "step-1", "route": "native", "ruleId": "TRV-PLAN-NATIVE-TRIVIUM-SHADED-ADAPTER", "reason": "Adapter spricht WIR fließend", "via": "trivium-shaded-adapter" },
      { "stepId": "step-2", "route": "bake", "ruleId": "TRV-PLAN-BAKE-SWIFT", "reason": "3D-Präsenz wird als Sprite-Bundle gebacken", "via": "swift" },
      { "stepId": "step-3", "route": "bridge", "ruleId": "TRV-PLAN-BRIDGE-SHADED-TARGET", "reason": "addActor ist das äquivalente Zielidiom", "via": "shaded-target" }
    ]
  },
  "humanReview": [
    { "id": "rev-1", "severity": "advisory", "category": "tool_unverified", "subject": "swift (status: candidate, CLI unverified)", "question": "SWIFT-CLI-Bindung gegen ../SWIFT verifizieren, dann Manifest-Version pinnen.", "options": ["verify_now","accept_risk"], "blockedStepIds": [], "ruleId": "TRV-PLAN-REVIEW-CANDIDATE", "reason": "Manifest trägt unverified-Flag" }
  ],
  "evidenceContract": {
    "evidenceVersion": "trivium.evidence-contract/v1", "id": "ev-waechterin-to-shaded-01",
    "planId": "plan-waechterin-to-shaded-01", "consumer": "cue-agent", "consumerContractVerified": false,
    "assertions": [
      { "id": "ev-a1", "category": "visual_state", "precondition": "isReady(), Bundle gespawnt", "action": "moment('sturmnacht'); 2s warten", "observableSignal": "Screenshot-Region um (0.40,0.80)", "expected": "Silhouette sichtbar, fog-gedimmt", "tolerance": "Silhouettenanteil ≥ 60% Referenz", "severityOnFail": "major", "automatable": true, "cueCommand": "cue run visual-state --region 0.40,0.80 --compare ref/waechterin-idle.png" },
      { "id": "ev-a2", "category": "playable", "precondition": "Driver injiziert", "action": "TRIVIUM_DRIVER.play()", "observableSignal": "story.board().length + Konsole", "expected": "4 Schritte, 0 GL-/JS-Fehler", "tolerance": "exakt", "severityOnFail": "blocker", "automatable": true, "cueCommand": "cue run playable --driver dorf-sturmnacht.shaded.driver.js" },
      { "id": "ev-a3", "category": "temporal", "precondition": "Bundle erzeugt", "action": "manifest.json lesen", "observableSignal": "Framezahl anim 'idle'", "expected": "8 Richtungen × ≥1 Frame, lückenlos", "tolerance": "exakt", "severityOnFail": "blocker", "automatable": true, "cueCommand": "cue run temporal --manifest art-bundle/manifest.json" },
      { "id": "ev-a4", "category": "human_visual_review", "precondition": "ev-a1 bestanden", "action": "Mensch betrachtet Sturmnacht 10s", "observableSignal": "Gesamteindruck", "expected": "Wächterin wirkt anwesend, nicht aufgeklebt", "tolerance": "Urteil", "severityOnFail": "minor", "automatable": false, "cueCommand": "cue queue human-review --tag waechterin-presence" }
    ],
    "artifactsRequired": ["screenshot_sturmnacht.png","run-log.txt","art-bundle/manifest.json"]
  },
  "score": { "total": 0.1745, "axes": { "qualityLoss": {"penalty":0.3,"weight":0.25,"weighted":0.075}, "targetFidelity": {"penalty":0.0,"weight":0.20,"weighted":0.0}, "toolConfidence": {"penalty":0.7,"weight":0.15,"weighted":0.105}, "…": "übrige Achsen 0 außer determinism 0.5×0.05=0.025 — Summe gerundet" } },
  "fallbackPlanIds": [], "requestRef": "examples/requests/waechterin-to-shaded.request.json",
  "createdAt": "<injiziert>"
}
```

### 9.2 Beispiel B — Unity-Package → Godot vs. Unreal (Request Datei 23)

Quelle: `{id:"art-src-1", state:"unity.package", uri:"assets/guard.unitypackage"}`.
Contract preserve: `["recognizable_silhouette","idle","walk","blocking_collision","interaction_anchor"]`
(wörtlich realization-contracts §4). Teilrouten getrennt, weil der Graph je
Artefaktgattung eigene Kanten hat:

- **Mesh:** `unity.package → (extract.unity-assets, assetripper, route reconstruct) → unity.project → (normalize.mesh.gltf, blender-headless, route normalize) → mesh.glb`
- **Material:** in v1 KEINE Kante (kein Manifest deklariert `material.desc`-Produktion aus unity.project) → ungedeckte preserve-Obligation? Nein — Material ist nicht im preserve; `expectedLosses` von assetripper deklarieren `{type:"structure", detail:"URP-Materialgraph nicht übertragen; Rekonstruktion ist Zielarbeit"}`.
- **Animation:** von blender-headless-Capability `normalize.mesh.gltf` mitgeführt (`produces` enthält anim in glb); Verlust `{type:"precision", detail:"Animationskurven resampled"}`.
- **Prefab-Komposition:** route `reconstruct` mit `contractRefRequired` — Postcondition „Zielszene baut Hierarchie aus Bedeutung neu".
- **Logik (`GuardPatrol.cs`):** KEIN Tool deklariert eine Capability → blocking `HumanReviewItem` rev-1 (§6.12, wörtlich) — explizit unübersetzbare Logik, designte Enthaltung.

Kandidat 1 (Godot): `… mesh.glb → (import.godot.gltf, godot-headless-import, route bridge) → godot.resource`.
Kandidat 2 (Unreal): `… mesh.glb → (import.unreal.glb-runtime, unreal-glb-import, route bridge) → unreal.staticmesh`.

Rangbegründung (beide Pläne enthalten sie in `score.axes`):
Godot `total 0.2480` < Unreal `total 0.2855`. Differenzachsen: toolConfidence
(godot-headless-import confidence 0.4 vs. unreal-glb-import 0.25 — Katalog
stuft den Runtime-Loader als P1/jünger ein) und determinism (Unreal-Kandidat
`"unknown"`). Alle übrigen Achsen identisch, weil die ersten zwei Steps
geteilt sind. `PlanningResult.status = "needs_human_review"`, weil rev-1
(Logik) in BEIDEN Kandidaten blocking ist; `selectedPlanId:null`;
`candidates:[plan-…-godot-01, plan-…-unreal-02]`,
`plan-…-godot-01.fallbackPlanIds:["plan-…-unreal-02"]`. Evidence je Kandidat:
`interaction_flow`-Assertion „guard blockiert Passage bei blocking_collision"
(automatable true), `visual_state`-Silhouettenvergleich, `human_visual_review`
für Materialverlust.

### 9.3 Beispiel C — WIZARD-Assessment → SHADED-2.5D vs. Engine-3D (Fixture Datei 24)

Fixture-Assessment: `assessmentVersion:"wizard.production-assessment/v1"`,
`userIntent:"Ich will das Sturmdorf als kleine spielbare Stimmung, heute."`,
Rollen: `village_scene` (required, 1 Kandidat `scene.png`, state
`texture.png`), `guard_actor` (required, 2 Kandidaten: `waechterin.glb`
CC0 + `guard_pack.unitypackage` license unknown), `ambient_audio`
(required, 0 Kandidaten → Missing-Asset).

Import-Ergebnis: `request.id:"wiz-dorf-2026-07-12"`;
`sourceArtifacts`: 3 Refs, `guard_actor`-Kandidaten mit
`candidateGroup:"guard_actor"`; ReviewItems: rev-audio (blocking,
`contract_gap`: „ambient_audio required, 0 Kandidaten — WIZARD erneut
fragen oder degrade"), rev-license (blocking, `license_unknown` für
unitypackage), rev-choice (advisory, `candidate_choice` guard_actor).

Zwei PlanCandidates (CLI erzeugt beide Requests, §8.1):
- **P1 SHADED-2.5D** (`plan-wiz-dorf-shaded-01`): texture.png → scene;
  waechterin.glb → SWIFT-Bundle → compose (3 Steps, wie Beispiel A).
  Score-Achsen: qualityLoss 0.3 · targetFidelity 0.0 · toolConfidence 0.7 ·
  manualWork 0 · licenseRisk 0.0 (CC0-Kandidat gewählt, unitypackage nicht
  benötigt) · determinism 0.5 · Rest 0 → **total 0.1745**.
- **P2 Engine-3D Godot** (`plan-wiz-dorf-godot-02`): unitypackage-Route wie
  Beispiel B + `emit.world.godot` für die Weltlogik. Score-Achsen:
  qualityLoss 0.2 · targetFidelity 0.2 (kein „living-image"-Atmosphären-
  Äquivalent ohne authored VFX — Godot-Adapter-Manifest deklariert
  intent-Achsen approximate) · toolConfidence 0.75 · licenseRisk 0.5
  (unknown-Lizenz) · determinism 0.5 · manualWork 0.5 → **total 0.3413**.

Empfehlung: P1. `status:"needs_human_review"` (rev-audio blockiert beide);
Report sagt wörtlich: „P1 gewinnt auf licenseRisk, targetFidelity und
manualWork; P2 nur vorziehen, wenn begehbarer 3D-Raum Teil der
Nutzerabsicht ist — die Absicht (‚kleine spielbare Stimmung, heute')
spricht für P1." Evidence P1: playable + visual_state + human_visual_review;
Evidence P2: zusätzlich interaction_flow (Kollision). Missing-Asset
`ambient_audio`: in BEIDEN Plänen als `audio`-Assertion mit
`precondition:"Rolle ambient_audio gefüllt"`, `severityOnFail:"major"` —
der Vertrag vergisst die Lücke nicht.

---

## 10. Exact Implementation Sequence (atomare Commits)

| # | Commit | Dateien | Neue Symbole | Benutzt | Danach möglich / bewusst noch nicht |
|---|---|---|---|---|---|
| 1 | Fehlercodes + Routen | 1, 2 | `ERR, fail, diag, REALIZATION_ROUTES, ROUTE_OBLIGATIONS` | `ROUTES` (core) | Codes referenzierbar / nichts validierbar |
| 2 | Artifact-States | 3 + Test in 25 (Teil) | `ARTIFACT_STATES, normalizeState, isKnownState` | 1 | Tokens prüfbar / keine Manifeste |
| 3 | Manifest-Validator | 4, 25 | `validateToolManifest` | 1–3 | Manifeste prüfbar / kein Laden |
| 4 | Tool Registry | 5, 25 | `createToolRegistry, registerTool, getTool, removeTool, listTools, findToolsForCapability, loadToolManifests` | 1–4, `deepFreeze` | Registry ladbar / kein Graph |
| 5 | Erste Manifeste | 14–16, 25 | — (Daten) | Schema | SHADED/SWIFT-Kanten existieren / keine Suche |
| 6 | Request | 6, Test 27 (Teil) | `normalizeRealizationRequest, validateRequest, PLANNING_CONSTRAINT_DEFAULTS` | 1, 3 | Requests validierbar / kein Plan |
| 7 | Capability Graph | 7, 26 | `buildCapabilityGraph, enumeratePaths` | 1, 3, 5 | Pfade findbar / kein Score |
| 8 | Scoring | 8, 26 | `SCORE_WEIGHTS, scoreCandidate, rankCandidates` | 1 | Ranking deterministisch / kein Plan-Objekt |
| 9 | Evidence + ExecutionPlan | 9, 10, 28 | `EVIDENCE_CATEGORIES, createEvidenceContract, validateEvidenceContract, PLAN_VERSION, createExecutionPlan, validateExecutionPlan` | 1–3, 9 | Pläne baubar+validierbar / keine Pipeline |
| 10 | Planner + API | 11, 13, 27 | `planRealization` + index-Re-Exports | alle | Beispiel A end-to-end planbar / kein CLI |
| 11 | Restmanifeste + Requests + CLI + verify | 17–24, 30, 31, 32, 33, 34 | `runPlanCommand` | 13 | alle 3 Beweisrouten via `trivium plan` + verify-Abschnitt „planner smoke" grün; Testzahlen synchronisiert |
| 12 | SWIFT/WIZARD-Verifikation | 14, ggf. 12/24 | — | ../SWIFT, WIZARD-Repo | `unverified`-Flags fallen ODER bleiben mit §12-Eintrag; **Abbruch** falls SWIFT-CLI fundamental anders → Manifest anpassen, nie Planner |
| 13 | CUE-Verifikation | 9-Ausgaben | — | CUE-Repo | `consumerContractVerified:true` oder dokumentierte Abweichung |
| 14 | WIZARD-Import | 12, 29, 24 | `importProductionAssessment` | 1, 6 | Beispiel C aus echtem/Fixture-Assessment; Ende P0 |

(Schritt 14 kann vor 12/13 liegen — einzige echte Abhängigkeit ist 6.)

## 11. P0 and Deferred Work

**P0 (dieser Lauf):** Schritte 1–14, exakt die Dateien aus §4.2.
**Explizit verschoben:** Evidence-RUNNER (Ausführung ist CUE), Executor
jeder Art, Contract-Dateiformat als eigenständiges `*.contract.json`-
Ökosystem (v1 bettet den Contract in den Request ein), AIR/SIR/EIR/FIR/PIR
als eigene Schemata, Corpus/Code-Esperanto-Lemmata, Engine Federation,
Field-first-Fixture, Massenbefüllung des Katalogs (nur die 8 Manifeste aus
§4.2), Erweiterung der Core-`ROUTES` (bleibt Plan-Ebene), jede Änderung an
`packages/trivium-core/**`.

## 12. Risks and Code-Level Abort Conditions

| Risiko | Erkennung | Gegenmaßnahme | Abbruchbedingung |
|---|---|---|---|
| 1 API-Inkompatibilität SWIFT/WIZARD/CUE | Schritt 12/13-Verifikation; `unverified`-Flags | Manifeste/Import anpassen, Flags erst nach Beleg entfernen | Schwester-Vertrag existiert nicht/widerspricht fundamental → Manifest bleibt `candidate`, Route bleibt `needs_human_review`; NIE Planner-Schema verbiegen |
| 2 Schema-Drift (Plan vs. Doku) | `validateExecutionPlan` in Pipeline Schritt 11; Tests 28 | ein Versions-String je Format, zentral | ein zweites Format-„v1" mit anderen Feldern taucht auf → Stopp, erst §34-Doku-Commit |
| 3 Adapter-/Tool-Registry-Konflikt | `grep -rn "createToolRegistry" packages/trivium-core` muss leer sein; Test: `createRegistry` unverändert (bestehende 48 Tests) | strikte Paketgrenze; Brücken-Manifest Datei 16 | jemand ändert `src/registry.js` → Commit ablehnen |
| 4 zyklische Graphen | `onPath`-Set; Test 26 mit Zykel-Fixture (a→b→a) | azyklische Enumeration per Konstruktion | Pfadbudget 64 überschritten UND Ergebnisse unvollständig → warn-Diagnostic, maxPathLength senken statt Budget heben |
| 5 nicht serialisierbare Daten | Test 28: `JSON.parse(JSON.stringify(plan))` deepStrictEqual plan | nur JSON-Skalare/Arrays/Objekte in allen Schemata; deepFreeze | Funktion/undefined/NaN in einem Schema-Feld → fail hart im Validator |
| 6 Engine-Begriffe in neutralen Contracts | `ENGINE_TOKEN_BLOCKLIST` in `validateRequest` (§5.6); Test 27 | `ERR_CONTRACT_UNSUPPORTED` | Blocklist-Treffer → Request wird nie geplant |
| 7 unsichere Manifestdaten (geratene Lizenz/Version) | Review-Pflicht bei `unknown`; `status:"verified"` verlangt `evidenceRef` (§5.4) | `unknown` ist gültiger Feldwert mit Malus | Manifest behauptet `verified` ohne evidenceRef → `ERR_TOOL_MANIFEST_INVALID` |
| 8 nicht reproduzierbare Rankings | Test 27: zweimal `planRealization` mit injiziertem `now` → deepStrictEqual; Rundung auf 4 Stellen; totale Sortierordnung | keine Zeit/Zufall/Umgebung im Score | `Date.now`/`Math.random`/env-Zugriff in src/scoring.js oder src/planner.js → Commit ablehnen (`grep`-Prüfstein) |

## 13. Implementation Handoff — Checkliste

1. `git checkout -b wp/planner-v1` · `node tools/verify.js` → PASS (Baseline).
2. Zuerst öffnen: `packages/trivium-core/src/registry.js` (Stilvorbild),
   `src/ledger.js` (ROUTES/Eintragsform) — nur lesen.
3. Zuerst anlegen: `packages/trivium-plan/src/errors.js` (§5.1), dann exakt
   die Commit-Reihenfolge §10; jede Funktion nach Signatur §5, jedes Schema
   nach §6, Algorithmen nach §7 — keine eigenen Designentscheidungen nötig.
4. Nach jedem Commit: `node tools/verify.js` → PASS; bestehende 48 Tests
   dürfen sich nie ändern (Kern-Unantastbarkeit).
5. Beweis am Ende von Schritt 11:
   `node bin/trivium.js plan examples/requests/waechterin-to-shaded.request.json`
   → Exit 0, Plan wie §9.1;
   `… unity-guard-to-engine.request.json` → Exit 2, zwei Kandidaten wie §9.2;
   `… wizard-assessment-dorf.request.json --from-wizard` → Exit 2, P1<P2 wie §9.3.
6. Prüfsteine: `grep -rn "Date.now\|Math.random" packages/trivium-plan/src/{scoring,planner,capabilityGraph}.js`
   → leer; `grep -rln "trivium-plan" packages/trivium-core/` → leer;
   Testzahlen in README/CLAUDE.md aktualisiert; loss-taxonomy-Status (§4.2 Nr. 34) nachgezogen.
7. `git push -u origin wp/planner-v1`; unverified-Flags (SWIFT/CUE/WIZARD)
   nur nach Schritt 12/13-Beleg entfernen — sonst stehen lassen und im
   PR benennen.

PLAN COMPLETE — IMPLEMENTATION NOT STARTED
