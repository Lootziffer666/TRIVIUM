# LLM-Handoff-Plan — der Weg von WIR v1.0.0 zum Semantic Realization Compiler



**Status:** Kanonischer Arbeitsplan. Dieses Dokument ist für LLM-Agenten

geschrieben, die nach dem Verfasser an TRIVIUM weiterarbeiten. Es übersetzt

die Vision (Kanon v1.1, Architektur v1.1, Engine-Dolmetscher) in geordnete,

einzeln abschließbare Arbeitspakete mit Definition of Done, Prüfsteinen und

bekannten Fallen.



**Pflegeregel:** Wer ein Arbeitspaket beginnt, setzt dessen Status in §4 auf

`in_arbeit`; wer es abschließt, auf `fertig` — im selben Commit wie die

Arbeit. Wer von diesem Plan abweicht, dokumentiert die Abweichung hier in

§12 (Entscheidungslog), nie still. Der Plan ist ein Ledger, kein Prospekt.



---



## 0. Leseanleitung für die erste Session



Du bist ein LLM-Agent und siehst dieses Repo zum ersten Mal. Führe die

folgenden Schritte in dieser Reihenfolge aus, bevor du irgendetwas änderst:



1. **Lies `CLAUDE.md`** (Projektregeln, Invarianten-Kurzform, Verifikation).

2. **Lies `docs/trivium-canon.md`** vollständig — die zwölf Invarianten in §4

   sind nicht verhandelbar und jede Designfrage endet dort.

3. **Führe `node tools/verify.js` aus.** Erwartung: `VERIFY: PASS`, alle

   Tests grün, beide Beispielwelten übersetzen in alle sechs Adapter, kein

   `needs_human_review`. Wenn das nicht gilt: **stoppe**, repariere zuerst

   die Baseline oder dokumentiere den Bruch in §12, bevor du Neues baust.

4. **Lies dieses Dokument bis §5**, wähle das erste Arbeitspaket mit Status

   `offen`, dessen Abhängigkeiten `fertig` sind.

5. **Lies die im Arbeitspaket genannten Quelldokumente und Quelldateien**,

   bevor du Code schreibst. Jedes Paket listet sie explizit.

6. Branch pro Aufgabe, `git push -u origin <branch>`. Nie committen:

   `node_modules/`, `tools/verify-out/`, `package-lock.json`.



Leseordnung der Dokumente (vom Gesetz zur Ausführung):



| Reihenfolge | Dokument | Rolle |

|---|---|---|

| 1 | `docs/trivium-canon.md` | Was TRIVIUM ist; 12 Invarianten; Abstammung |

| 2 | `docs/wir-spec.md` | WIR v1.0.0 — was implementiert ist, was angrenzt |

| 3 | `docs/loss-taxonomy.md` | Routen (implementiert vs. geplant), Verlust-/Gewinnklassen, Durchsetzung |

| 4 | `docs/realization-contracts.md` | Die sieben Vertragsarten und ihr Schema |

| 5 | `docs/architecture-v1.1.md` | Gesamtpipeline, Planformat-Entwurf, Entwicklungsreihenfolge |

| 6 | `docs/engine-dolmetscher.md` | IR-Familie, Tool-Registry, Roadmap-Phasen A–D, unverhandelbare Regeln §12 |

| 7 | `docs/tool-candidate-catalog.md` | Kandidatenkatalog + Evaluationsmatrix §12 |

| 8 | dieses Dokument | Ausführungsplan |



---



## 1. Die zehn Gebote (Kurzfassung der Invarianten als Handlungsregeln)



Diese Regeln sind aus dem Kanon abgeleitet und für Agenten formuliert. Im

Zweifel gilt der Kanon-Wortlaut.



1. **Der Kern kennt keine Engine.** In `packages/trivium-core` (und in jedem

   künftigen neutralen Paket) steht nie Engine-Vokabular. Kein `dayNight`,

   kein `Node2D`, kein `AActor`, kein Shadername. Der Kern importiert nie

   einen Adapter. `grep -ri "unity\|unreal\|godot\|shaded" packages/` muss

   leer bleiben (Kommentare, die Engines als *Beispiele für Verbotenes*

   nennen, sind die einzige Ausnahme — wie in `wir.js` Zeile 14–16).

2. **Bedeutung, nie Syntax.** Neue Ausdrucksmittel = neue Achse in

   `INTENT_AXES` (geschlossener Kanon, Builder wirft bei ad-hoc-Achsen) oder

   neuer Contract — nie ein Engine-Parameter in der WIR.

3. **Verlust-Pflicht.** `approximate`/`preserve` erzwingen `loss`;

   `ledger.record()` erzwingt `ruleId` + nicht-leeren `reason`. Diese

   `throw`s sind Produktverhalten. Sie werden nie zu Warnungen aufgeweicht.

4. **Gewinn-Pflicht.** Jeder Adapter deklariert `gains`. Der Report

   markiert leere Gains als „suspicious" — das ist Absicht.

5. **Enthaltung ist Sicherheit.** Unbekannte Konzepte routen `unknown` →

   `needs_human_review` → CLI-Exit 2. Nie raten, nie „vorläufig mappen".

6. **Kohärenz vor Emission.** Strict-Mode verweigert inkonsistente Welten

   (Stage 1 wirft). Fix meaning, not output.

7. **Quelle heilig.** Stage 0 friert die WIR ein (`deepFreeze` einer Kopie).

   Kein Stadium und kein Adapter mutiert die Quelle. Das Original

   (`<id>.wir.json`) reist mit jedem Output — das hängt der **Router** an,

   nicht der Adapter (Falle: nicht doppelt anhängen).

8. **Null Runtime-Dependencies.** Kein `npm install` für den Kern.

   Playwright bleibt dev-only via `npm i --no-save playwright`.

   **Konsequenz für alles Geplante:** Schemata und Verträge werden als

   JSON implementiert, nicht als YAML — ein YAML-Parser wäre eine Dependency.

   Die YAML-Blöcke in den Docs sind Illustration, nicht Dateiformat.

9. **Doku lügt nie über den Implementierungsstand.** Geplante Felder/Routen

   werden nie als implementiert ausgegeben (wir-spec §8, loss-taxonomy

   Status-Kopf). Wer Code nachzieht, zieht die Status-Zeilen der Doku **im

   selben Commit** nach. Dazu gehören die hartkodierten Zahlen: `CLAUDE.md`

   und `README.md` nennen „48 Tests" — wer Tests ergänzt, aktualisiert beide.

10. **Kein Nachbau vorhandener Werkzeuge ohne belegte Lücke.** Erst

    `docs/tool-candidate-catalog.md` prüfen, dann bauen

    (engine-dolmetscher §12).



---



## 2. Ist-Stand (verifiziert am 2026-07-12, Commit `ff1d6f7`)



### 2.1 Implementiert und grün



```text

packages/trivium-core/          Kern, null Dependencies, enginefrei

  index.js                      Re-Export der öffentlichen API (20 Z.)

  src/wir.js         (286 Z.)   WIR v1.0.0: 3 Strata, 13 INTENT_AXES,

                                5 ENTITY_KINDS, 9 RELATION_TYPES, Builder,

                                conceptsOf(), fromJSON(), deepFreeze()

  src/router.js      (111 Z.)   translate(): Stage 0 PROTECT → 1 STRUCTURE

                                → 2 ROUTE → 3 REALIZE; strict-Option;

                                hängt <id>.wir.json an artifacts an

  src/ledger.js      (140 Z.)   ROUTES {native,bridge,approximate,decompose,

                                preserve,unknown}; LOSSY_ROUTES={approximate,

                                preserve}; record() erzwingt ruleId+reason,

                                loss bei lossy; summarize(); formatReport()

  src/coherence.js   (176 Z.)   check(): Konsistenz (12 Fehlercodes),

                                Replayability-Metriken (branchingFactor,

                                hiddenReactivity, learnability),

                                CHORE_LOOP_RISK-, UNREADABLE_WORLD-Warnungen

  src/registry.js     (85 Z.)   createRegistry(): register() validiert

                                Pflichtfelder + approximate-braucht-loss;

                                capabilityFor(): exakt > längster '*'-Präfix



adapters/                       6 Adapter (Plugins; Kern kennt sie nicht)

  shaded/adapter.js  (335 Z.)   + shaded/importer.js (124 Z.): Rückweg

                                SHADED-Szene → WIR (einziger Importer bisher)

  godot/  love2d/  renpy/  unity/  unreal/   (159–354 Z.)



bin/trivium.js       (107 Z.)   CLI: --target/--out/--no-strict/--list;

                                Exit 0 ok · 1 Fehler · 2 needs_human_review

examples/                       dorf-sturmnacht (2.5d), turm-des-schweigens

test/                           6 Dateien, 48 Tests

tools/verify.js                 Tests + beide Welten × alle 6 Adapter;

                                FAIL bei needs_human_review; räumt nur

                                eigene Übersetzungsordner in verify-out/

tools/verify-live.js (226 Z.)   Beweisritt: Driver headless gegen echtes

                                window.SHADED (braucht ../SHADED + Playwright)

```



Fidelity-Baseline (muss nach jeder Änderung mindestens gehalten werden;

Verschlechterung nur mit dokumentiertem Grund im Commit):



| Welt | shaded | godot | love2d | renpy | unity | unreal |

|---|---|---|---|---|---|---|

| dorf-sturmnacht | 0.938 | 1 | 1 | 0.984 | 1 | 1 |

| turm-des-schweigens | 0.814 | 1 | 0.977 | 0.977 | 1 | 1 |



### 2.2 Spezifiziert, aber NICHT implementiert (die Lücke, die dieser Plan schließt)



- **Contracts** (World/Asset/Function/Perception/Scene/Tool/Evidence) —

  nur als Doku (`realization-contracts.md`). Kein Schema-Code, kein Validator.

- **Realisierungsrouten** `reconstruct, normalize, bake, project, degrade,

  enrich, federate` — nur in `loss-taxonomy.md` §2. Nicht in `ROUTES`.

- **IR-Familie** AIR/SIR/EIR/FIR/PIR/TIR — nur als Tabelle in

  `engine-dolmetscher.md` §2.

- **Tool Capability Registry** — Katalog existiert als Markdown

  (`tool-candidate-catalog.md`), aber kein maschinenlesbares Manifest,

  kein Loader, keine Evaluationsdatensätze.

- **Planner / Capability Graph / TIR-Planformat** — Entwurf in

  `architecture-v1.1.md` §4, kein Code.

- **Corpus** (Code-Esperanto-Lemmata) — Konzept in Kanon §5, kein Bestand.

- **Engine Federation** (World-State-Schema, Scene Contracts, Handoff) —

  Doku-Stand.

- **Field-first-Fixture** — Doku-Stand.

- **CUE-Evidence-Runner** — Doku-Stand; einzige Live-Evidenz heute ist

  `tools/verify-live.js` (SHADED-spezifisch).



### 2.3 Bekannte Fallen im Bestand (vor Änderungen lesen)



1. **Fidelity-Formel:** `fidelity = (total − unknown − preserve) / total`

   (`ledger.js summarize()`). Wer neue Routen ergänzt, muss entscheiden, wie

   sie zählen (siehe WP-A2) — sonst verschieben sich alle Baseline-Zahlen still.

2. **Registry-Frühvalidierung:** `register()` wirft, wenn eine

   `approximate`-Capability kein `loss` deklariert. Neue Routen mit

   Pflichtnachweis brauchen dieselbe Frühvalidierung, nicht nur die späte in

   `record()`.

3. **`capabilityFor`-Matching:** exakter Treffer schlägt Präfix; bei

   mehreren `*`-Präfixen gewinnt der längste. `grammar.relation.*` in

   SHADED fängt alles, was `contains`/`adjacent` nicht exakt matchen.

4. **`fromJSON` ist der einzige zweite Eingang** und läuft komplett durch

   die Builder („ein Eingang, eine Wahrheit"). Jede neue Eingangsart (z. B.

   Contract-Loader) muss dasselbe Prinzip erfüllen: keine laxere Parallelwelt.

5. **`verify.js` räumt selektiv:** nur `verify-out/<weltId>/` wird gelöscht;

   `live_*.png` von verify-live bleiben liegen. Nicht „aufräumen".

6. **`wirVersion`-Gate:** `fromJSON` und Stage 0 verweigern fremde

   Versionen hart. Eine Schemaerweiterung ohne Versionierungsplan

   (wir-spec §8: Fixtures + Migration + Roundtrip) bricht den Vertrag.

7. **SHADED-Adapter spricht nur `window.SHADED`-API** (setParams,

   story.board/play/stop, addActor, getMaterialTypeAt). Nie Engine-Interna;

   `CANONICAL_PALETTE` sind Kopien, `SHADED/index.html` bleibt die Wahrheit.

8. **`../SHADED` fehlt oft** (z. B. in Cloud-Umgebungen). Dann ist

   `verify-live.js` nicht ausführbar. Das ist kein Blocker für Kern-Arbeit —

   im Commit/PR vermerken: „verify-live nicht ausführbar: ../SHADED fehlt".



---



## 3. Zielbild in einem Satz pro Schicht



Die Vision (Kanon §0) verlangt vier Fähigkeiten. Der Plan baut sie in

dieser Reihenfolge, weil jede die vorige als Fundament braucht:



1. **Bedeutung bewahren** — implementiert (WIR + Router + Ledger + Kohärenz).

2. **Realisierung planen** — Contracts (Phase A) → Tool-Registry (Phase A)

   → Planner + TIR (Phase B).

3. **Werkzeuge orchestrieren** — Beweisrouten (Phase C) mit echten

   vorhandenen Tools; Ausführung bleibt dünn, TRIVIUM emittiert Pläne.

4. **Äquivalenz beweisen** — Evidence-Runner (Phase G), gespeist aus

   Evidence Contracts; „kompiliert" ist nie „fertig".



Parallel dazu drei Ausbau-Stränge, die auf 2.–4. aufsetzen:

Code-Esperanto/FIR (Phase D), Engine Federation (Phase E),

Field-first (Phase F).



---



## 4. Statusübersicht aller Arbeitspakete



Statuswerte: `offen` · `in_arbeit` · `fertig` · `verworfen(→§12)`.



| WP | Titel | Hängt ab von | Status |

|---|---|---|---|

| A1 | Contract-Schema + Validator (`trivium-contracts`) | — | fertig |

| A2 | Realisierungsrouten im Ledger + Durchsetzung | — | fertig |

| A3 | Tool-Manifest-Schema + Candidate Registry | A1 | fertig |

| A4 | Corpus-Schema + 5 Beweis-Lemmata | A1 | fertig |

| B1 | TIR-Planformat v0.1 + Validator | A1, A3 | offen |

| B2 | Planner-Skelett (Capability Graph, Ranking) | B1 | offen |

| B3 | Dry-Run-Executor + Plan-Hashing | B1 | offen |

| C1 | Beweisroute 1: 3D-Asset → Engine-Import (direct/normalize) | B2, B3 | offen |

| C2 | Beweisroute 2: 3D-Asset → 8-Richtungs-Spritesheet (bake/project) | C1 | offen |

| C3 | Beweisroute 3: Engine-Szene → neutrale Beschreibung → andere Projektion | C1 | offen |

| D1 | FIR-Schema + Lemma-Katalog (30 Lemmata) | A4 | offen |

| D2 | Lemma-Realisierungen Unity/Unreal/Godot + generierte Tests | D1 | offen |

| D3 | Rückanalyse eines Beispiels in FIR | D1 | offen |

| E1 | trivium-world-state-v1 + Handoff-Format | A1 | offen |

| E2 | Zwei-Runtime-Kapitel-Demonstrator mit Engine-Hop | E1 | offen |

| F1 | Field-first-Korridor-Fixture (stress-collapse) | A1, A2 | offen |

| G1 | Evidence-Runner (CUE-light) | A1 | offen |

| G2 | End-to-End-Kleinspiel aus Quellenrollen | C*, D2, G1 | offen |

| X1 | CLI-Erweiterung (`contracts`, `tools`, `plan` Subcommands) | laufend, je Phase | offen |

| X2 | verify.js-Erweiterung + Zahlen-Sync in Doku | laufend, je Phase | offen |



Abhängigkeitsbild:



```text

        A1 ──────┬─────────────┬──────────────┬─────────┐

        A2 ──┐   │             │              │         │

             │   ▼             ▼              ▼         ▼

        A3 ─┴─► B1 ─► B2 ─► C1 ─► C2     D1(←A4) ─► D2  E1 ─► E2

                      B3 ──┘  └─► C3          └──► D3

        F1 (←A1,A2)                G1(←A1) ─────────► G2 (←C*,D2,G1)

```



Empfohlene Bearbeitung: **A2 → A1 → A3 → B1 → B2 → B3 → G1 → C1 → C2 →

C3 → A4 → D1 → D2 → E1 → F1 → E2 → D3 → G2.** (A2 zuerst, weil klein,

kernnah und Voraussetzung dafür, dass alles Spätere die richtigen

Routen-Wörter benutzt. G1 vor C1, damit die Beweisrouten von Anfang an

gegen Evidence Contracts geprüft werden statt nachgerüstet.)



---



## 5. Arbeitspakete im Detail



Jedes Paket folgt demselben Raster. „Prüfstein" ist der Befehl, mit dem

ein nachfolgender Agent (oder Mensch) den Abschluss objektiv nachvollzieht.



---



### WP-A2 — Realisierungsrouten im Ledger + Durchsetzung



**Ziel:** Die sieben geplanten Routen aus `loss-taxonomy.md` §2

(`reconstruct, normalize, bake, project, degrade, enrich, federate`)

werden Teil von `ROUTES`, mit denselben harten Durchsetzungsregeln wie die

Kernrouten.



**Kanon-Bezug:** loss-taxonomy §2 („nicht bloß Synonyme"), §5

(Pflichtnachweise); Kanon-Invariante 4 (keine stillen Verluste).



**Vorher lesen:** `src/ledger.js` komplett, `src/registry.js` (Zeilen

43–50, Frühvalidierung), `src/router.js` (Zeile 78: welche Routen in

`routed[]` landen), `test/test_router.js`.



**Schritte:**



1. `ROUTES` um die sieben Werte erweitern. Pro Route eine

   Durchsetzungsklasse in `record()`:

   - `bake`, `degrade` → wie `approximate`: `loss` Pflicht

     (deklarierter Dynamik- bzw. begründeter Fähigkeitsverlust).

   - `enrich` → `gain` Pflicht (spiegelbildlich zur Verlust-Pflicht).

   - `reconstruct`, `normalize`, `project`, `federate` → neues Pflichtfeld

     `contractRef` (String-Referenz auf einen Contract; loss-taxonomy §5:

     „jeder Route wird ein Contract zugeordnet"). Solange WP-A1 nicht

     fertig ist, ist `contractRef` ein opaker, nicht-leerer String; nach

     A1 validiert `record()` nur Nicht-Leere — die *Auflösung* der Referenz

     ist Planner-/Evidence-Aufgabe, nicht Ledger-Aufgabe.

2. `LOSSY_ROUTES` erweitern (`bake`, `degrade` hinein). Neue Menge

   `CONTRACT_ROUTES` exportieren.

3. **Fidelity-Entscheidung** (dokumentieren in loss-taxonomy §5, selber

   Commit): `reconstruct/normalize/bake/project/degrade/enrich` zählen als

   realisiert (Zähler), `federate` zählt als realisiert (die Welt läuft ja),

   `preserve/unknown` bleiben Nenner-Abzug wie bisher. Bestehende

   Baseline-Zahlen in §2.1 dürfen sich dadurch NICHT ändern (kein Adapter

   nutzt die neuen Routen bisher) — das ist der Regressionstest.

4. `registry.register()`-Frühvalidierung spiegeln: Capability mit Route

   `bake`/`degrade` ohne `loss` → throw; `enrich` ohne `gain` → throw;

   Contract-Routen ohne `contractRef`-Feld in der Capability → throw.

5. Tests in `test/test_router.js` (oder neuer `test_routes.js`): pro neuer

   Route ein Positiv- und ein Pflichtfeld-Verletzungs-Fall (≈ 14 Tests).

6. `docs/loss-taxonomy.md` Status-Kopf umformulieren: die sieben Routen von

   „geplant" auf „implementiert (Ledger-Ebene; Planner-Nutzung folgt)".

   Testzahl in `CLAUDE.md` + `README.md` aktualisieren (Gebot 9!).



**Nicht-Ziele:** Kein Adapter wird auf neue Routen umgestellt (das

geschieht erst, wenn Evidence existiert — loss-taxonomy §5: `reconstruct`,

`project`, `bake`, `federate` brauchen eigene Evidence). Keine

WIR-Schemaänderung.



**Gefahren:** Fidelity-Formel still verschieben (Falle 2.3.1). Die

`throw`s als Warnungen bauen (Gebot 3).



**Prüfstein:** `node tools/verify.js` grün; `node -e "const {ROUTES}=require('./packages/trivium-core/src/ledger');console.log(Object.values(ROUTES).length)"` → 13; Baseline-Tabelle §2.1 unverändert.



**Umfang:** 1 Session, ~150 Z. Code + Tests + 3 Doku-Stellen.



---



### WP-A1 — Contract-Schema + Validator (`packages/trivium-contracts`)



**Ziel:** Die sieben Vertragsarten aus `realization-contracts.md` §2

existieren als maschinenlesbares JSON-Format mit einem handgeschriebenen

Validator (null Dependencies), demselben Strenge-Niveau wie die

WIR-Builder.



**Kanon-Bezug:** realization-contracts komplett; wir-spec §5 („angrenzende

Repräsentationen … werden nicht still in WIR v1.0.0 hineinerfunden");

Kanon-Invariante 6 (das Original reist mit → Provenienz Pflicht).



**Vorher lesen:** `realization-contracts.md` §3–§9 (die YAML-Beispiele sind

die Feldreferenz), `wir.js` (`fromJSON` als Vorbild für „ein Eingang, eine

Wahrheit"), loss-taxonomy §3 (Provenienzverlust blockiert).



**Architekturentscheidung (hiermit getroffen, Abweichung → §12):**



- Neues Paket `packages/trivium-contracts/` — **nicht** im Kern, damit

  WIR v1.0.0 unangetastet bleibt (wir-spec §8), aber genauso enginefrei.

  Der Kern darf `trivium-contracts` NICHT importieren (keine Abhängigkeit

  Kern→Contracts; die Verbindung stiftet später der Planner).

- Dateiformat: **JSON** (`*.contract.json`), Gebot 8. Ein Contract-Dokument

  trägt `contractVersion: "0.1.0"`, `id`, `kind` ∈ die sieben Arten,

  `source.provenance` (Pflicht), `source.license` (Pflicht bei

  `kind: asset|tool`, sonst optional mit Begründung).

- Gemeinsame Felder nach realization-contracts §3: `preserve[]`,

  `project[]`, `may_approximate[]`, `must_not[]`, `fallbacks[]`,

  `verify[]`. Kind-spezifische Felder exakt nach §4–§9 (asset: `role`,

  `required[]`, `optional[]`, `acceptable_realizations[]`; function:

  `inputs/preconditions/reads/writes/side_effects/postconditions/

  error_behavior`; scene: `runtime/inputs/outputs/entry/exit/handoff`;

  tool: `accepts/produces/capabilities/unknown[]/execution/status`;

  evidence: `checks[]/artifacts[]`; perception: `spatial_model/

  primary_channels/secondary_channels/requirements/visuals`).



**Schritte:**



1. `packages/trivium-contracts/index.js` + `src/schema.js` mit

   `validateContract(doc) → { ok, errors[] }` und `loadContract(json)`

   (wirft bei Fehlern — Enthaltung statt Reparaturversuch). `kind`-Kanon

   geschlossen wie `INTENT_AXES`: unbekannte `kind` → throw mit dem

   TRIVIUM-typischen Hinweistext („… never ad hoc").

2. `unknown`-Felder in Tool Contracts sind **zulässig und first-class**

   (realization-contracts §8): der Validator akzeptiert `unknown: [...]`,

   und `status: "candidate"` ist der Default, `verified` erfordert

   `evidence`-Referenz (Katalog §12: „Ein Link allein ist kein Tooladapter").

3. Provenienz-Härte: fehlende `source.provenance` → throw. Das ist der

   Code gewordene Satz „Provenienzverlust blockiert Production".

4. Beispiel-Contracts als Fixtures unter `examples/contracts/`:

   die vier Beispiele aus der Doku 1:1 übertragen

   (`corridor.stress-collapse.world.contract.json`,

   `actor.guard.asset.contract.json`, `door.make_inactive.function.contract.json`,

   `clockwork_mansion.scene.contract.json`) — damit Doku und Code beweisbar

   dasselbe sagen.

5. Neue Testdatei `test/test_contracts.js`: pro Kind gültig/ungültig,

   Provenienz-Pflicht, geschlossener Kind-Kanon, Fixture-Validierung

   (≈ 16 Tests).

6. `tools/verify.js`: Schritt 1.5 ergänzen — alle

   `examples/contracts/*.contract.json` validieren, FAIL bei Fehler.

7. Doku: `realization-contracts.md` Status-Kopf ergänzen

   („Schema v0.1.0 implementiert in `packages/trivium-contracts`; JSON ist

   das Dateiformat, YAML in diesem Dokument ist Illustration").

   Testzahlen-Sync (Gebot 9).



**Nicht-Ziele:** Keine Contract-*Erfüllungs*-Prüfung (das ist G1), keine

Referenz-Auflösung zwischen Contracts, keine WIR-Felder.



**Gefahren:** Schleichende YAML-Dependency; Contract-Validator laxer als

WIR-Builder (Falle 2.3.4); Kern-Import von Contracts.



**Prüfstein:** `node tools/verify.js` grün inkl. Contract-Fixtures;

`grep -r "require" packages/trivium-core/src | grep -v "./"` → leer

(Kern importiert weiterhin nichts Externes).



**Umfang:** 1–2 Sessions, ~350 Z. Code + Fixtures + Tests.



---



### WP-A3 — Tool-Manifest-Schema + Candidate Registry



**Ziel:** Der Kandidatenkatalog wird von Markdown-Prosa zu maschinen-

lesbaren Datensätzen nach der Evaluationsmatrix (Katalog §12), ladbar und

abfragbar — die Grundlage des Capability Graph.



**Kanon-Bezug:** engine-dolmetscher §3 (Pflichtangaben), §12 („Kein Tool

ohne Lizenz-, Versions- und Provenienzdaten in Production");

tool-candidate-catalog §12 (Matrixfelder).



**Vorher lesen:** engine-dolmetscher §3+§4, Katalog komplett (auf

Dubletten achten: `KvesDev` vs. `KevesDev/RuntimeStaticMeshImporter` ist im

Katalog explizit als Dublette markiert — deduplizieren!).



**Schritte:**



1. Verzeichnis `registry/tools/<id>.tool.json`. Schema = Tool Contract aus

   WP-A1 (`kind: "tool"`) **plus** Matrixfelder: `repository`, `license`,

   `last_verified`, `source_versions`, `target_versions`,

   `execution_mode`, `headless` (`true|false|"partial"|"unknown"`),

   `known_losses[]`, `manual_steps[]`, `fixture`, `evidence`,

   `confidence` (0..1), `status` ∈ `candidate|verified|rejected|superseded`.

2. Loader `packages/trivium-contracts/src/toolRegistry.js`:

   `loadToolRegistry(dir)` → Map, wirft bei doppelter `id`; Abfragen

   `toolsAccepting(format)`, `toolsProducing(format)`.

3. **Format-Vokabular:** Neutrale Format-Tokens als offene, aber

   dokumentierte Liste in `registry/formats.md` beginnen (z. B.

   `unity.prefab`, `unity.project`, `unreal.uasset`, `godot.tscn`, `gltf`,

   `glb`, `fbx`, `png.frames`, `png.atlas`, `mesh`, `texture`, `skeleton`,

   `animation`, `json`, `csv`, `wav`). Keine geschlossene Validierung in

   v0.1 (das würde bei 100+ Kandidaten nur Reibung erzeugen), aber der

   Loader warnt bei Tokens außerhalb der Liste → Review-Hinweis, kein throw.

   (Bewusste Lockerung gegenüber dem Intent-Kanon: Formate sind

   Beobachtungen über fremde Werkzeuge, keine eigenen Bedeutungsachsen.

   Wer das verschärfen will: §12-Eintrag.)

4. Erstbefüllung: **alle P0-Kandidaten** des Katalogs (≈ 35 Einträge) als

   `status: "candidate"`, `confidence` konservativ ≤ 0.3, `last_verified`

   auf das Katalogdatum 2026-07-12, `evidence: null`. KEIN Kandidat wird

   ohne reproduzierbares Fixture `verified` (Katalog §12) — die ersten

   Heraufstufungen geschehen in WP-C1–C3.

5. CLI: `node bin/trivium.js tools --list [--accepts X] [--produces Y]`

   (siehe WP-X1 für das Subcommand-Muster).

6. Tests `test/test_tools.js`: Laden, Dedupe-Throw, Abfragen, ein

   absichtlich kaputtes Manifest (≈ 8 Tests). verify.js validiert das

   ganze `registry/tools/`-Verzeichnis.



**Nicht-Ziele:** Keine Tools klonen/ausführen/installieren. Keine

Netz-Zugriffe im Loader. Keine P1/P2-Massenbefüllung (nur bei Bedarf je

Beweisroute).



**Gefahren:** Erfundene Angaben. Wenn Lizenz/Version eines Kandidaten

nicht aus dem Katalog hervorgeht, gehört `"unknown"` ins Feld — nicht ein

plausibler Wert. `unknown` ist designte Enthaltung, auch in Metadaten.



**Prüfstein:** `node tools/verify.js` grün;

`node bin/trivium.js tools --list | wc -l` ≥ 35; kein Eintrag mit

`status: "verified"` ohne `evidence`.



**Umfang:** 2 Sessions (die Erstbefüllung ist Fleißarbeit; sorgfältig,

nicht kreativ).



---



### WP-A4 — Corpus-Schema + 5 Beweis-Lemmata



**Ziel:** Das Code-Esperanto (Kanon §5) bekommt sein Datenformat: ein

Lemma = gemeinsamer Sinn + Quell-/Zielidiome + Vorbedingungen +

Nebenwirkungen + Lebenszyklus + Verluste/Gewinne + Tests + Confidence.

Fünf Lemmata beweisen das Format, bevor D1 den Katalog füllt.



**Kanon-Bezug:** Kanon §5 (Corpus-Feldliste), engine-dolmetscher §7,

realization-contracts §5 (Function Contract als Kern eines Lemmas).



**Schritte:**



1. `corpus/lemmata/<id>.lemma.json`: `lemmaVersion`, `id`

   (z. B. `passage.make_traversable`), `intent`, `contract` (eingebetteter

   oder referenzierter Function Contract aus A1), `idioms{}` (Schlüssel =

   Zielsprache, Wert = `{ constructs[], lifecycle, notes, losses[],

   gains[], confidence }`), `tests[]` (abstrakte Szenarien:

   `given/when/then` über Contract-Begriffe, NICHT über Engine-Begriffe).

2. Validator in `trivium-contracts` (Corpus referenziert Function

   Contracts; gleiche Strenge).

3. Fünf Lemmata: `passage.make_traversable` (das Kanon-Beispiel!),

   `door.deactivate` (das Doku-Beispiel), `state.persist_across_scene`,

   `interaction.gated_by_hidden_state` (trägt die onFail-Pflicht ins

   Code-Stratum), `trigger.zone_enter`.

4. Idiome zunächst für `unity`, `unreal`, `godot` als **beschreibende

   Konstrukt-Listen mit Confidence**, nicht als Codegeneratoren.

   Codegenerierung ist D2.

5. Tests + verify-Anbindung wie gehabt.



**Gefahren:** Lemma-IDs nach Engine-Vokabular benennen (falsch:

`unity.collider.disable`; richtig: `passage.make_traversable`). Das

Lemma trägt Bedeutung, die Idiome tragen Syntax.



**Prüfstein:** verify grün; `corpus/lemmata/` enthält 5 validierende

Lemmata, jedes mit ≥ 3 Idiomen und ≥ 2 abstrakten Tests.



**Umfang:** 1 Session.



---



### WP-B1 — TIR-Planformat v0.1 + Validator



**Ziel:** Das Planformat aus `architecture-v1.1.md` §4 wird reale

Datenstruktur: ein deterministischer, hashbarer Transformationsplan.



**Kanon-Bezug:** architecture §4 (Entwurf), engine-dolmetscher §2 (TIR),

loss-taxonomy §5 („jeder Toolschritt schreibt Input-/Output-Hashes").



**Schritte:**



1. `*.plan.json` mit `planVersion: "0.1.0"`, `id`, `source{artifact,

   contractRef}`, `target{runtime, form}`, `steps[]`

   (`{id, tool, toolVersionPin, script?, inputs[], produces[],

   expectedHashes?}`), `verify{contractRef}`, `fallbacks[]`,

   `route` (eine der 13 Routen — der Plan IST die Realisierung einer

   Route, das verbindet A2 mit B1).

2. Validator: jeder `step.tool` muss in der Tool-Registry existieren

   (A3-Loader); `produces` eines Schritts müssen `inputs` des nächsten

   decken (Kettenprüfung); `verify.contractRef` Pflicht — **ein Plan ohne

   Evidence-Referenz validiert nicht** (Kanon: Kompilierbarkeit allein

   genügt nicht).

3. Fixture: den Guard-Plan aus architecture §4 als

   `examples/plans/guard-unity-to-godot-sprite.plan.json` übertragen

   (Tools darin als Kandidaten in A3 nachziehen, sofern nicht vorhanden:

   `assetripper`, `blender`, `atlas-packer`, `godot-headless` —

   `blender`/`godot-headless` sind Werkzeuge, keine GitHub-Kandidaten;

   eigene Manifest-Einträge mit `execution_mode: "cli"`).

4. Tests: Kettenbruch, fehlendes Tool, fehlende Evidence → throw (≈ 8).



**Prüfstein:** verify grün; Fixture-Plan validiert gegen die echte Registry.



**Umfang:** 1 Session.



---



### WP-B2 — Planner-Skelett



**Ziel:** `plan(sourceDesc, targetDesc, contracts, toolRegistry) →

rankedPlans[]` — Pfadsuche im Capability Graph mit ehrlichem Ranking.



**Kanon-Bezug:** architecture §3 (Planner-Gleichung), engine-dolmetscher

§4 (neun Ranking-Kriterien).



**Schritte:**



1. Neues Paket `packages/trivium-planner/` (importiert `trivium-contracts`,

   NIE einen Adapter, NIE den Kern-internen Zustand — es liest WIR/Contracts

   nur als Daten).

2. Graph: Knoten = Format-Tokens (A3), Kanten = Tool-Capabilities.

   Breitensuche source→target, Tiefe ≤ 6, Zyklenschutz.

3. Ranking v0.1 als transparente Additivkosten (jede Komponente im

   Ergebnis ausgewiesen, keine Blackbox): Schrittzahl, Summe bekannter

   Verluste, `1 − confidence`, `headless ≠ true`-Strafe,

   `status ≠ verified`-Strafe, Lizenz-Flag (GPL-Inputs etc. nur als

   ausgewiesenes Flag, keine automatische Rechtsentscheidung — das bleibt

   Review).

4. Ausgabe: gültige TIR-Pläne (B1-validierend), `needs_human_review`-Liste

   für Lücken (kein Pfad / nur `unknown`-Kanten) — **Enthaltung statt

   erfundener Route**, exakt wie der Router.

5. Tests mit synthetischer Mini-Registry (5 Kunst-Tools), damit Tests

   nicht an der echten Kandidatenliste kleben: Pfad gefunden, kein Pfad →

   Review, Ranking-Reihenfolge deterministisch (≈ 10).



**Gefahren:** Der Planner darf nie einen `candidate` still wie `verified`

behandeln; der Rang unterscheidet sie, die Ausgabe benennt es.



**Prüfstein:** verify grün; `node bin/trivium.js plan --from unity.prefab

--to png.atlas` liefert ≥ 1 Plan über die echte Registry oder eine

ehrliche Review-Meldung.



**Umfang:** 2 Sessions.



---



### WP-B3 — Dry-Run-Executor + Plan-Hashing



**Ziel:** Pläne werden ausführbar, ohne dass TRIVIUM zum Orchestrator

mutiert (das ist ANVIL/MYTHIC, architecture §3): ein dünner lokaler

Executor mit zwei Modi.



**Schritte:**



1. `tools/execute-plan.js <plan.json> [--dry-run]`:

   - `--dry-run` (Default): druckt Schritte, prüft nur, ob die Tools

     lokal auffindbar sind (`which`/Pfad aus Manifest), schreibt

     `execution-report.json` mit `status: "dry-run"`.

   - echt: führt CLI-Schritte via `child_process.execFileSync` aus,

     schreibt pro Schritt SHA-256 von Inputs/Outputs (Node `crypto`,

     keine Dependency), bricht bei Hash-/Exit-Fehlern ab, Rest des Plans

     wird als `skipped` protokolliert.

2. Jeder Report enthält Toolversion (`--version`-Aufruf, wo möglich) —

   loss-taxonomy §5.

3. Fehlende Tools sind **kein Fehler des Plans**: Exit-Code 3

   („nicht ausführbar in dieser Umgebung"), Report sagt, was fehlt.

   (Cloud-Umgebungen ohne Blender bleiben damit ehrlich statt rot.)

4. Tests mit einem Kunst-Tool (`node -e ...` als „Tool"), damit der

   Executor ohne echte DCC-Software testbar ist (≈ 6).



**Prüfstein:** verify grün; Fixture-Plan aus B1 im Dry-Run → sauberer

Report; Kunst-Plan echt ausgeführt → Hashes im Report.



**Umfang:** 1 Session.



---



### WP-G1 — Evidence-Runner (CUE-light) *(vorgezogen vor Phase C)*



**Ziel:** Evidence Contracts (A1, `kind: "evidence"`) werden ausführbar:

ein Runner, der `checks[]` gegen Artefakte und Reports prüft und ein

Evidence-Dossier schreibt. „Completion nur mit Evidenz" (Kanon §3.7).



**Schritte:**



1. Check-Vokabular v0.1 (geschlossen, erweiterbar über PR + Doku):

   - `file_exists <path>` · `file_hash <path> <sha256>`

   - `json_path <file> <dotted.path> <op> <value>` (op: eq/gte/lte/nonempty)

   - `image_dimensions <file> <w> <h>` (PNG-Header lesen — 24 Bytes, kein

     Parser nötig)

   - `report_route_count <report.json> <route> <op> <n>`

   - `manual <beschreibung>` → landet IMMER in `needs_human_review`

     (menschliche Prüfung ist ein legitimer Check, aber nie still bestanden)

2. `tools/verify-evidence.js <evidence.contract.json> --artifacts <dir>`:

   Exit 0 bestanden · 1 widerlegt · 2 offene `manual`-Checks.

3. Der Runner schreibt `evidence-dossier.json`: pro Check Ergebnis,

   Zeit, Artefakt-Hashes. Das Dossier ist das, was ein Tool-Manifest

   in `evidence` referenzieren muss, um `verified` zu werden (A3-Regel).

4. Tests (≈ 8): jeden Check-Typ positiv/negativ, `manual` → Exit 2.



**Kanon-Bezug:** realization-contracts §9+§12, architecture §9.



**Prüfstein:** verify grün; das Guard-Evidence-Beispiel aus

realization-contracts §9 als Fixture (`verify.guard.sprite`) läuft gegen

einen präparierten Artefakt-Ordner und besteht/failt korrekt.



**Umfang:** 1–2 Sessions.



---



### WP-C1 — Beweisroute 1: 3D-Asset → Engine-Import (direct/normalize)



**Ziel:** Die erste Route der engine-dolmetscher-Phase-B wird real:

ein kleines, selbst erstelltes CC0-3D-Asset wird über einen TIR-Plan

normalisiert und in ein Engine-Zielformat gebracht — mit Contract,

Ledger, Evidence und dokumentiertem Restaufwand.



**Wichtige Realitätsanpassung gegenüber der Doku** (dokumentierte

Abweichung, hiermit §12-Eintrag Nr. 1 vorweggenommen): Die Doku nennt

„Unity-3D-Asset → Unreal". Ein echtes `.unitypackage` erfordert

AssetRipper + Rechteklärung + große Binärdateien im Repo. **Route 1

beginnt stattdessen mit einem eigenen, per Skript generierten Asset**

(prozeduraler Low-Poly-Wächter oder Turm als `.obj`/`.gltf`, erzeugt von

einem committeten Node-Skript — reproduzierbar, lizenzfrei, klein). Die

Unity-Quelle wird nachgereicht, sobald ein Mensch ein lizenzgeklärtes

Fixture bereitstellt (→ offene Entscheidung §11.3). Der Routen-*Mechanismus*

(Contract → Plan → Ausführung → Evidence → Ledger) ist davon unabhängig

und wird vollständig bewiesen.



**Schritte:**



1. `fixtures/gen-guard-mesh.js`: deterministisches Skript, erzeugt

   `fixtures/out/guard.obj` (+ simple Textur als PPM/PNG). Committet wird

   das SKRIPT, nicht das Artefakt (`fixtures/out/` in `.gitignore`).

2. Asset Contract `actor.guard` (aus A1-Fixture verfeinern):

   required = silhouette, idle-Pose, Kollisionfußabdruck, Pivot am Boden.

3. Plan: `obj → glb` (Normalisierung: Y-up, Meter, Pivot; Tool: Blender

   headless, wenn vorhanden — sonst reines Node-Skript

   `tools/recipes/obj-normalize.js`, das ins Registry als eigenes Tool

   `trivium.obj-normalize` eingetragen wird; eine belegte Lücke im Sinne

   von „kein Nachbau ohne Lücke": es gibt kein dependency-freies

   obj→glb-CLI im Katalog).

4. Evidence Contract: Datei existiert, glb-Header-Magic korrekt,

   Bounding-Box-Höhe im Toleranzband, Pivot-Check via `json_path` auf

   glTF-JSON-Chunk.

5. Route im Ledger: `normalize` mit `contractRef` — die erste echte

   Nutzung einer A2-Route.

6. Doku `docs/proof-routes.md` beginnen: Route, Plan, Restaufwand,

   was NICHT bewiesen wurde.



**DoD (aus engine-dolmetscher Phase B, wörtlich):** Fixture ✓

deterministischer Plan ✓ Quell-/Zielartefakte ✓ Ledger ✓ Beweis ✓

dokumentierter manueller Restaufwand ✓.



**Prüfstein:** `node fixtures/gen-guard-mesh.js && node

tools/execute-plan.js examples/plans/guard-obj-normalize.plan.json &&

node tools/verify-evidence.js ...` → Exit 0 (oder Exit 3 + ehrlicher

Report in Umgebungen ohne Blender, mit Node-Fallback-Pfad grün).



**Umfang:** 2–3 Sessions.



---



### WP-C2 — Beweisroute 2: 3D → 8-Richtungs-Spritesheet (bake/project)



**Ziel:** Das Kanon-Paradebeispiel (Kanon §6, loss-taxonomy §6): der

Guard aus C1 wird zu einem 8-Richtungs-Atlas gebacken und als

Godot-Ressource + generisches JSON-Manifest emittiert.



**Schritte:**



1. Plan: `glb → png.frames` (Blender headless render,

   `tools/recipes/render-eight-direction.py` — committetes Blender-Skript)

   → `png.frames → png.atlas` (Node-Skript Atlas-Packer; PNG-Encoding

   ohne Dependency ist machbar: zlib ist Node-builtin) → `png.atlas →

   godot.tres` (Text-Ressource, Template).

2. Ledger-Einträge exakt nach loss-taxonomy §6 (dynamics/precision-Verluste,

   performance/portability-Gewinne) — das Doku-Beispiel wird ausführbare

   Wahrheit.

3. Evidence: Framezahl = 8 × Animationsphasen, Alpha vorhanden,

   Silhouetten-Check v0 = Nicht-Leerheit + Bounding-Box-Konsistenz über

   Richtungen (echter Silhouetten-Score ist Forschung → `manual`-Check).

4. Erste Tool-Heraufstufungen: die tatsächlich benutzten Werkzeuge

   bekommen `status: "verified"` + `evidence`-Referenz aufs Dossier.



**Prüfstein:** Atlas-PNG + `.tres` + Report + bestandenes Evidence-Dossier

unter `tools/verify-out/` reproduzierbar; verify grün.



**Umfang:** 2–3 Sessions (Blender-Skript ist der Hauptaufwand).



---



### WP-C3 — Beweisroute 3: Engine-Szene → neutral → andere Projektion



**Ziel:** Rückrichtung: eine echte Engine-Szene wird zu neutraler

Beschreibung geborgen und anders projiziert. Konkret und im Repo bereits

angelegt: **SHADED-Szene → WIR (vorhandener `adapters/shaded/importer.js`)

→ Ren'Py-Projektion**, erweitert um eine Godot-`.tscn`-Route über

`tscn2json`-artige Zerlegung (Kandidat im Katalog §3).



**Schritte:**



1. Teil 1 (sofort machbar): Importer-Route als formalen TIR-Plan +

   Contract + Evidence fassen (der Roundtrip existiert in

   `test/test_import.js` — er bekommt jetzt Vertrag und Dossier).

2. Teil 2: minimaler `.tscn`-Reader (Textformat, parsebar ohne Dependency)

   für ein selbst gebautes 5-Node-Fixture → EIR-artige JSON-Zerlegung →

   Mapping der erkennbaren Konzepte in WIR-Begriffe, Rest →

   `needs_human_review`. **Kein Vollparser** — belegte Lücke prüfen:

   wenn `saperio/tscn2json` als Tool taugt, Manifest + Plan statt Eigenbau.

3. Doku `proof-routes.md` erweitern.



**Prüfstein:** verify grün; Fixture-`.tscn` → WIR-Fragment mit ehrlichem

Review-Anteil > 0 (eine Szene birgt IMMER Unbekanntes — ein Ergebnis ohne

Review-Einträge ist hier ein Warnsignal, kein Erfolg).



**Umfang:** 2 Sessions.



---



### WP-D1 — FIR-Schema + Lemma-Katalog (30 Lemmata)



**Ziel:** Der Code-Esperanto-Korpus wächst von 5 (A4) auf 30 Lemmata über

den minimalen Scope aus realization-contracts §11.



**Der Katalog (verbindliche Erstliste; Änderungen → §12):**



| Bereich | Lemmata |

|---|---|

| Entity/Rolle | `entity.spawn_with_role`, `entity.despawn`, `entity.attach_to_anchor` |

| State | `state.persist_across_scene` (A4), `state.hidden_gate_read`, `state.set_with_reaction` |

| Input | `input.action_pressed`, `input.pointer_select_entity` |

| Bewegung | `movement.walk_to_anchor`, `movement.follow_entity`, `movement.block_when_state` |

| Kollision | `collision.block_passage`, `passage.make_traversable` (A4) |

| Trigger | `trigger.zone_enter` (A4), `trigger.timer_elapsed`, `trigger.state_threshold` |

| Interaktion | `interaction.gated_by_hidden_state` (A4), `interaction.examine_evidence`, `door.deactivate` (A4) |

| Inventar | `inventory.add_item`, `inventory.check_item_gate` |

| Dialog | `dialog.line_with_condition`, `dialog.branch_on_state` |

| Gedächtnis | `memory.record_attempt`, `memory.surface_hint` (trägt Anti-Chore-Loop) |

| Kamera | `camera.focus_entity`, `camera.mood_shift` |

| Audio | `audio.ambient_from_intent` |

| UI | `ui.show_hint` |

| Szenen/Save | `scene.transition_at_anchor`, `save.snapshot_world_state` |



**Schritte:** je Lemma Function Contract + abstrakte Tests (Format aus A4);

FIR-Zusatzfelder für Rückanalyse (`evidence_level` ∈

`verified|strongly_inferred|ambiguous|missing`, engine-dolmetscher §8).



**Prüfstein:** 30 validierende Lemmata; jedes mit Contract + ≥ 2 Tests;

verify grün.



**Umfang:** 2–3 Sessions (Sorgfalt vor Tempo; das ist der Wortschatz des

ganzen Systems).



---



### WP-D2 — Lemma-Realisierungen + contract-generierte Tests



**Ziel:** Für jedes der 30 Lemmata konkrete Idiom-Einträge für Unity (C#),

Unreal (C++/Blueprint-Beschreibung) und Godot (GDScript) mit

Code-Snippets im Corpus — und ein Generator, der aus den abstrakten

Contract-Tests pro Zielsprache Test-Skelette emittiert.



**Schritte:**



1. Idiom-Einträge erweitern um `snippet` (String) + `lifecycle_notes`.

   Snippets sind **Corpus-Belege**, kein generierter Produktionscode —

   Confidence ehrlich setzen; ungetestete Snippets ≤ 0.5.

2. `tools/gen-lemma-tests.js`: emittiert pro Lemma/Engine eine

   Testskelett-Datei (in `tools/verify-out/`, nie committet) aus

   `contract.postconditions` + `tests[]` — der Beweis, dass Tests aus

   Verträgen ableitbar sind (engine-dolmetscher Phase C.3).

3. Die Adapter dürfen jetzt beginnen, `logic.rule`-Konzepte über

   Corpus-Lemmata zu emittieren statt über ad-hoc-Code — pro Adapter

   einzeln, mit Ledger-`via: "lemma:<id>"` (Traceability bis ins Lemma).



**Prüfstein:** verify grün; Generator läuft über alle 30 Lemmata × 3

Engines ohne Fehler; mindestens der Godot-Adapter emittiert ≥ 3 Regeln

nachweislich über Lemmata (`grep "lemma:" im Report`).



**Umfang:** 3–4 Sessions.



---



### WP-D3 — Rückanalyse eines Beispiels in FIR



**Ziel:** Engine-Dolmetscher Phase C.4: ein kleines vorhandenes

Skript (z. B. ein GDScript-Türcontroller aus einem selbst gebauten

Fixture, ~60 Zeilen) wird manuell/werkzeuggestützt in FIR gehoben:

reads/writes/effects/lifecycle extrahiert, `evidence_level` je Aussage,

dann aus dem FIR-Contract neu in eine ANDERE Zielsprache realisiert und

per Verhaltensvergleich (abstrakter Testlauf beider Versionen, so weit

lokal möglich) geprüft.



**Schritte:** Fixture bauen → FIR-Dokument schreiben (`kind: "function"`

+ `evidence_level`-Annotationen) → Ziel-Realisierung via Corpus →

Differenzbericht. `ambiguous`-Teile bleiben markiert und unrealisiert.



**Prüfstein:** `docs/proof-routes.md`-Kapitel mit FIR-Dokument,

Ziel-Code, Differenzbericht; alle `ambiguous`-Punkte im Review-Abschnitt.



**Umfang:** 2 Sessions.



---



### WP-E1 — `trivium-world-state-v1` + Handoff-Format



**Ziel:** Das Föderations-Fundament: ein Schema für neutralen Weltzustand

und atomare Übergabe zwischen Runtimes.



**Kanon-Bezug:** wir-spec §7 (geeignet/ungeeignet-Beispiele!), Kanon §7,

realization-contracts §7.



**Schritte:**



1. Schema `trivium-world-state-v1`: flache Map dotted-key → JSON-Skalar/

   Array (exakt die Form aus wir-spec §7). Validator verbietet

   Objekt-Referenzen, Funktionen, NaN, zyklische Strukturen — native

   Engine-Referenzen KÖNNEN so gar nicht erst reisen.

2. Handoff-Protokoll v0.1: Datei-basiert (architecture Phase D.4:

   „Datei oder lokaler IPC"), atomar via write-to-temp + rename;

   `handoff.json` = `{ stateVersion, worldRef, sceneContractRef, state,

   exitAnchor, timestamp, hash }`.

3. Scene-Contract-Prüfung: `outputs[]` des abgebenden Kapitels müssen im

   Handoff vorhanden sein, sonst Verweigerung (Enthaltung).

4. Tests: Roundtrip, Ablehnung unzulässiger Werte, Contract-Abgleich (≈ 8).



**Prüfstein:** verify grün; das `clockwork_mansion`-Scene-Contract-Fixture

aus A1 + ein Beispiel-Handoff validieren gegeneinander.



**Umfang:** 1 Session.



---



### WP-E2 — Zwei-Runtime-Kapitel-Demonstrator



**Ziel:** Ein sichtbarer Engine-Hop (architecture Phase D.5): dieselbe

Welt läuft als Kapitel 1 in Runtime A und nach semantischem Übergang

(Tür/Kapitelgrenze) als Kapitel 2 in Runtime B, Zustand reist per E1.



**Realistische Runtime-Wahl für dieses Repo** (lokal, headless-fähig,

ohne kommerzielle Installation): Kapitel 1 = **SHADED-Driver** (der

existierende JS-Driver, headless via Playwright wie verify-live),

Kapitel 2 = **Ren'Py- oder LÖVE-Emission**, ersatzweise ein reiner

Node-Text-Runner (`adapters/`-Neuzugang `textrun/` — ein

Audio/Text-Kapitel ist kanonisch legitim: „Audio-only chapter",

architecture §5). Empfehlung: Text-Runner zuerst (keine externe

Installation), LÖVE als Stretch.



**Schritte:**



1. Adapter `textrun` (falls gewählt): WIR → lauffähiges Node-Skript, das

   Regeln/Momente als Text-Interaktion spielt. Voller Adapter-Vertrag

   (Manifest, Gains, Tests, verify-Aufnahme — CLAUDE.md-Arbeitsweise).

2. Beispielwelt `dorf-sturmnacht` in zwei Scene Contracts zerlegen

   (Kapitelgrenze am Moment-Übergang).

3. Runner-Skript `tools/demo-federation.js`: startet Kapitel 1, wartet

   auf `handoff.json`, validiert, startet Kapitel 2 mit importiertem

   Zustand; schreibt Evidence-Dossier (Zustand vorher/nachher,

   `world.guard_trust`-artige Schlüssel identisch).

4. Ledger: Route `federate` mit Scene-Contract-Referenz — zweite echte

   A2-Routen-Nutzung.



**Prüfstein:** `node tools/demo-federation.js` läuft durch, Dossier

beweist Zustandserhalt über die Grenze; verify grün (inkl. neuem Adapter

in der Matrix — Fidelity-Tabelle §2.1 erweitern).



**Umfang:** 3 Sessions.



---



### WP-F1 — Field-first-Korridor-Fixture



**Ziel:** Der kanonische Korridor (Kanon §9, engine-dolmetscher §6): ein

neutrales Stressfeld treibt mehrere Projektionen; der Contract

`corridor.stress-collapse` (A1-Fixture) wird erfüllbar und geprüft.



**Schritte:**



1. Neutrales Feldmodell als Daten, nicht als Engine-Code:

   `examples/fields/corridor-stress.js` — 1D/2D-Skalarfeld, Update-Regel

   (Stress steigt/fällt), Schwellen für `traversable`-Ableitung. Lebt

   NICHT im Kern (Kern bleibt WIR); ob Felder später WIR v1.1 werden, ist

   offene Entscheidung §11.4.

2. Zwei Projektionen desselben Feldes: (a) Logik-Projektion —

   `passage.blocked`-State + Navigation als Graph-Kantengewicht; (b)

   SHADED-Projektion — decay/storm-Parameter über den Driver (nur

   `window.SHADED`-API!).

3. Evidence gegen den Contract, wörtlich dessen `verify[]`:

   `player_cannot_cross_when_contract_says_blocked`,

   `npc_path_changes_with_corridor`, `stress_zero_restores_passage` —

   als Simulationstests über die Logik-Projektion; das SHADED-Visuelle

   via verify-live-Erweiterung (nur wo ../SHADED existiert; sonst

   `manual`-Check im Dossier).

4. `must_not`-Beweis: ein absichtlich kaputtes Fixture

   (visuell verformt, Kollision statisch) muss vom Evidence-Runner

   WIDERLEGT werden — der Negativtest ist hier der wichtigste Test.



**Prüfstein:** verify grün; Negativ-Fixture failt nachweislich;

Positiv-Fixture-Dossier vollständig.



**Umfang:** 2–3 Sessions.



---



### WP-G2 — End-to-End-Kleinspiel



**Ziel:** Das Erfolgskriterium (architecture §9) einmal ganz: „Dieses

Asset, diese Idee gefällt mir → mach daraus diese kleine spielbare Form."

Eine dritte Beispielwelt, deren Assets über C-Routen realisiert, deren

Logik über D-Lemmata emittiert, deren Ergebnis über G1-Evidence bewiesen

wird — und die in mindestens zwei Formen spielbar ist (Text-Runner +

SHADED-Driver oder LÖVE).



**Schritte:** Welt schreiben (klein! ≤ 8 Entities, ≤ 6 Regeln) →

Rollen-Contracts → Asset-Pläne → Emission → Evidence-Dossiers →

`docs/proof-routes.md`-Abschlusskapitel „Was das System heute

nachweislich kann / noch nicht kann".



**Prüfstein:** Ein einziger Befehl (`node tools/demo-e2e.js`) baut aus

Quellen die spielbare Form und legt alle Dossiers vor; verify grün.



**Umfang:** 3–4 Sessions.



---



### WP-X1 — CLI-Erweiterung (laufend)



`bin/trivium.js` wächst pro Phase um Subcommands, rückwärtskompatibel

(der bisherige Aufruf `trivium <welt> [--target ...]` bleibt exakt gleich):



```text

trivium <welt> [--target ...] [--out ...] [--no-strict]   (bestehend)

trivium --list                                            (bestehend)

trivium contracts validate <datei|dir>                    (ab A1)

trivium tools --list [--accepts X] [--produces Y]         (ab A3)

trivium plan --from <format> --to <format> [--contract C] (ab B2)

trivium evidence <evidence.json> --artifacts <dir>        (ab G1)

```



Regel: jedes Subcommand hat Tests in `test/test_cli.js` und einen

Exit-Code-Vertrag im Datei-Header. Exit 2 bleibt reserviert für

„fachlich ok, aber Review nötig" — überall.



### WP-X2 — verify.js-Erweiterung + Zahlen-Sync (laufend)



`tools/verify.js` bleibt DER eine Beweisbefehl. Pro Phase kommt ein

Abschnitt hinzu (Contracts validieren, Registry validieren, Pläne

validieren, Evidence-Fixtures laufen lassen). Er bleibt unter ~15 s ohne

externe Tools; alles, was externe Software braucht, lebt in

`verify-live.js`/`execute-plan.js` und wird in verify nur als

„vorhanden/nicht vorhanden" gemeldet, nie als FAIL bei Abwesenheit.

Nach JEDER Testzahl-Änderung: `CLAUDE.md` + `README.md` nachziehen.



---



## 6. Session-Protokoll für nachfolgende LLM-Agenten



**Start jeder Session:**



```bash

git status && git log --oneline -5    # Wo bin ich?

node tools/verify.js                  # Ist die Welt heil?

```



Dann §4 dieses Plans lesen, Paket wählen, dessen „Vorher lesen"-Liste

abarbeiten.



**Während der Arbeit:**



- Ein Arbeitspaket pro Branch. Branch-Namensmuster: `wp/<id>-<slug>`,

  z. B. `wp/a1-contract-schema` (bestehende `claude/…`-Branches sind

  Session-Artefakte der Hosting-Umgebung und kein Vorbild).

- Kleine Commits entlang der WP-Schritte; Commit-Messages nennen das WP:

  `WP-A1: Contract-Validator — kind-Kanon geschlossen`.

- Bei jeder Doku-berührenden Codeänderung: Status-Zeilen im selben Commit

  (Gebot 9). Der Reviewer eines Commits, der Code UND Doku-Statuszeilen

  ändert, sieht sofort, dass Anspruch und Stand synchron sind.



**Abschluss jeder Session:**



1. `node tools/verify.js` → PASS (nicht verhandelbar).

2. Falls SHADED-Adapter/Driver berührt UND `../SHADED` vorhanden:

   `npm i --no-save playwright && node tools/verify-live.js`.

   Falls `../SHADED` fehlt: im Commit vermerken.

3. Status in §4 aktualisieren; ggf. §12-Eintrag.

4. Push: `git push -u origin <branch>`.



**Wenn du steckenbleibst:** Nicht raten (Gebot 5 gilt auch für dich).

Den Stand als `in_arbeit` mit einem Absatz in §12 hinterlassen: was

versucht wurde, was blockiert, welche Entscheidung ein Mensch oder der

nächste Agent treffen muss. Ein ehrlicher halber Schritt ist kanonischer

als ein erfundener ganzer.



**Was du NIE tust (Konzentrat aller Verbote):**



- Engine-Vokabular in `packages/*` schreiben oder Kern→Adapter-Importe.

- Intent-Achsen, Entity-Kinds, Relation-Types, Contract-Kinds ad hoc

  erweitern — geschlossene Kanons wachsen nur mit Doku + Tests im selben

  Commit.

- `throw`s der Verlust-/Gewinn-/Provenienz-Pflicht abschwächen.

- `node_modules/`, `package-lock.json`, `tools/verify-out/`,

  `fixtures/out/` committen.

- Eine npm-Runtime-Dependency einführen. (YAML-Wunsch → JSON nehmen.)

- Doku als „implementiert" markieren, was kein Test beweist.

- Ein `.wir.json` doppelt an Artefakte hängen (macht der Router).

- Bei SHADED-API-Differenzen die Engine „nachbessern" wollen — Adapter

  zieht nach, nie umgekehrt (CLAUDE.md Cross-Repo-Verträge).

- Reverse-Engineering-/Portierungs-Arbeit an Quellen ohne geklärte

  Rechte und Provenienz (Kanon §8).



---



## 7. Qualitätsmaßstäbe für neuen Code



- **Stil:** wie der Bestand — ausführlicher Datei-Header (`/*! … */`) mit

  Abstammung und Zweck; deutsche oder englische Kommentare im Ton des

  Bestands; Konstanten `Object.freeze`; sprechende Fehlertexte, die die

  Regel MIT Begründung nennen (Vorbild: `wir.js` Zeile 118).

- **Fehlerphilosophie:** Validierung wirft früh und präzise; Sicherheit

  durch Enthaltung, nie durch Reparaturheuristik.

- **Tests:** jede neue Regel hat Positiv- UND Verletzungstest; Tests

  benutzen das schlichte `ok/assert`-Muster der bestehenden Testdateien

  (kein Test-Framework — Dependency!).

- **Determinismus:** keine Zeit-/Zufallsabhängigkeit in Artefakten

  (Ledger-`startedAt` ist die dokumentierte Ausnahme); Fixtures

  reproduzierbar aus Skripten.

- **Größe:** Module in der Größenordnung des Bestands (85–350 Zeilen).

  Wenn ein Modul 500 Zeilen übersteigt, ist es wahrscheinlich zwei Module.



---



## 8. Meilenstein-Abnahmen



| Meilenstein | Enthält | Abnahme-Satz (muss wahr und belegt sein) |

|---|---|---|

| M-A „Verträge" | A1–A4 | „Jede Vertragsart der Doku existiert als validiertes JSON mit Fixture; der Ledger kennt alle 13 Routen mit Pflichtnachweisen." |

| M-B „Planung" | B1–B3, G1 | „TRIVIUM emittiert aus Registry + Contract einen validierten, gerankten, hashbaren Plan und kann Evidence-Contracts ausführen." |

| M-C „Beweisrouten" | C1–C3 | „Drei Routen laufen reproduzierbar mit Contract, Ledger, Evidence-Dossier und dokumentiertem Restaufwand; erste Tools sind `verified`." |

| M-D „Esperanto" | D1–D3 | „30 Lemmata mit 3 Engine-Idiomen; Tests werden aus Verträgen generiert; ein Adapter emittiert Logik nachweislich über Lemmata; eine Rückanalyse liegt vor." |

| M-E „Föderation" | E1–E2 | „Weltzustand reist atomar und geprüft zwischen zwei Runtimes; ein sichtbarer Hop existiert als Demo mit Dossier." |

| M-F „Field-first" | F1 | „Der Stress-Korridor erfüllt seinen Contract in zwei Projektionen; das must_not-Negativfixture wird widerlegt." |

| M-G „Ende zu Ende" | G2 | „Ein Befehl macht aus Quellen eine kleine spielbare Form mit vollständiger Rechenschaft." |



Nach M-G gilt das Erfolgskriterium aus architecture §9 als erstmals

demonstriert — im kleinen, ehrlichen Maßstab (Kanon-Invariante 12).



---



## 9. Was dieser Plan bewusst NICHT enthält



- AAA-Portierung, MMO, riesige Open Worlds (Kanon §4.12 / §10).

- Automatische Lizenz-Rechtsprechung — Lizenzfelder sind Pflichtdaten

  und Ranking-Flags; Entscheidungen trifft ein Mensch.

- Einen universellen `.uasset`-/`.unitypackage`-Parser — Katalog-Tools

  prüfen, Lücken belegen, erst dann bauen.

- Verlustfreie Universalportierung als Anspruch (Kanon §10).

- Framegenaue Cross-Engine-Physik (explizit kein Frühziel).



---



## 10. Sofortiger Einstieg (wenn du GENAU JETZT anfangen willst)



Der schnellste kanonisch korrekte erste Beitrag ist **WP-A2** (klein,

kernnah, entsperrt das Vokabular für alles Weitere):



```bash

git checkout -b wp/a2-realization-routes

# lies: src/ledger.js, src/registry.js, src/router.js, test/test_router.js,

#        docs/loss-taxonomy.md §2+§5

# implementiere WP-A2 Schritte 1–6

node tools/verify.js       # PASS + neue Tests grün + Baseline unverändert

# Status in docs/llm-handoff-plan.md §4: A2 → fertig (selber Commit)

git push -u origin wp/a2-realization-routes

```



---



## 11. Offene Entscheidungen (mit Empfehlung, aber ohne Vorgriff)



1. **Paketname/-schnitt für Contracts:** Plan sagt

   `packages/trivium-contracts` (getrennt vom Kern). Alternative: alles in

   den Kern. Empfehlung: getrennt — WIR-Versionsvertrag bleibt unberührt.

2. **Zählweise neuer Routen in `fidelity`:** Plan sagt „alle außer

   preserve/unknown zählen als realisiert". Alternative: eigene

   Realization-Fidelity-Kennzahl. Entscheidung fällt in WP-A2 und wird in

   loss-taxonomy §5 dokumentiert.

3. **Echte Unity-/Unreal-Quellfixtures:** brauchen lizenzgeklärte

   Binärdateien. Bis ein Mensch welche bereitstellt, arbeiten C-Routen

   mit generierten CC0-Fixtures. (Blockiert nichts; ehrlich vermerkt.)

4. **Felder in WIR v1.1?** F1 hält Felder außerhalb des Kerns. Ob ein

   `fields`-Stratum in eine WIR v1.1 gehört, entscheidet sich NACH F1

   anhand echter Erfahrung — Schemaerweiterung nur mit Fixtures,

   Migration und Roundtrip-Tests (wir-spec §8).

5. **Text-Runner als siebter Adapter (E2):** Empfehlung ja (beweist

   „Wirkung ist der Maßstab für Projektion" ohne Installationslast);

   Alternative: LÖVE-Kapitel direkt.



## 12. Entscheidungslog / Abweichungen



> Format: `JJJJ-MM-TT — WP — Entscheidung/Abweichung — Begründung — wer`



- 2026-07-12 — Plan — Contracts/Manifeste/Pläne werden als **JSON**

  implementiert, obwohl die Docs YAML zeigen — Null-Dependency-Invariante;

  YAML-Blöcke in Docs bleiben als Illustration stehen — Verfasser dieses

  Plans.

- 2026-07-12 — C1 — Beweisroute 1 startet mit generiertem CC0-Fixture

  statt echtem Unity-Asset — Rechte + Repogröße; Mechanismus-Beweis davon

  unabhängig — Verfasser dieses Plans.



---



> **Schlusssatz für jeden Agenten, der hier weiterbaut:** Du erbst kein

> Feature-Backlog, sondern ein Übersetzungsethos. Wenn du zwischen einem

> beeindruckenden Output und einer ehrlichen Enthaltung wählen musst,

> wähle die Enthaltung und schreibe auf, warum. Genau dafür ist dieses

> System gebaut.





