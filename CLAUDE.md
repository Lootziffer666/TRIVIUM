# CLAUDE.md – Projektregeln TRIVIUM

TRIVIUM ist ein universeller Game Translation Compiler: Weltbedeutung wird
EINMAL als WIR (Grammatik/Rhetorik/Logik) formuliert und in Engines
übersetzt, wie man zwischen natürlichen Sprachen übersetzt. Kanonische
Dokumente: `docs/trivium-canon.md` (Invarianten), `docs/wir-spec.md`,
`docs/loss-taxonomy.md`.

## Unverhandelbare Invarianten (Kurzform; Langform im Kanon)

1. **Der Kern kennt keine Engine.** In `packages/trivium-core` steht nie
   Engine-Vokabular (kein `dayNight`, kein `Node2D`, kein `label`). Der Kern
   importiert nie einen Adapter. Adapter sind Plugins unter `adapters/*`.
2. **Bedeutung, nie Syntax.** Neue Ausdrucksmittel werden als Intent-Achsen
   in `INTENT_AXES` ergänzt (geschlossener Kanon, Builder wirft bei ad-hoc
   Achsen), nie als Engine-Parameter in die WIR geschmuggelt.
3. **Verlust-Pflicht.** Routen `approximate`/`preserve` erzwingen `loss`;
   `ledger.record()` erzwingt `ruleId` + `reason`. Diese Würfe sind
   Produktverhalten, keine Debug-Asserts — niemals aufweichen.
4. **Gewinn-Pflicht.** Adapter deklarieren `gains`. Ein Adapter ohne
   dokumentierte neue Möglichkeiten ist unvollständig.
5. **Quelle heilig, Enthaltung sicher.** Stage 0 friert die WIR ein;
   unbekannte Konzepte routen `unknown` → `needs_human_review`, erreichen
   nie einen Adapter. Kein Raten.
6. **Kohärenz vor Emission.** Strict-Mode verweigert inkonsistente Welten.
   Fix meaning, not output.

## Verifikation (Pflicht vor jedem Commit)

```bash
node tools/verify.js   # 130 Tests + beide Beispielwelten in alle Adapter, Exit ≠ 0 bei FAIL
```

Bei Änderungen am SHADED-Adapter oder am Driver-Generator zusätzlich der
Beweisritt in der echten Engine (Schwester-Repo `../SHADED` erforderlich):

```bash
npm i --no-save playwright     # einmalig, dev-only, nie committen
node tools/verify-live.js      # Driver läuft headless in echtem window.SHADED
```

`tools/verify-out/` wird nie committet. Null Runtime-Dependencies — kein
`npm install` für den Kern einführen (Playwright bleibt dev-only via
`--no-save`; weder `node_modules/` noch ein `package-lock.json` committen).

## Cross-Repo-Verträge

- **SHADED-Adapter** (`adapters/shaded/`): spricht ausschließlich das
  `window.SHADED`-API (setParams, story.board/play/stop, addActor,
  getMaterialTypeAt). Rührt NIE Engine-Interna an — SHADEDs Invariante 2
  (Eine Material-Wahrheit) gilt hier genauso. Palette-Werte in
  `CANONICAL_PALETTE` sind Kopien; `SHADED/index.html` bleibt die Wahrheit.
  Bei SHADED-API-Änderungen: Adapter nachziehen, nie umgekehrt fordern.
- **Manifold-Abstammung** (`FLOW-SPIN-SMASH/research/MANIFOLD_*`): die
  Routing-Semantik (Stage 0–3, Enthaltung, Traceability) ist übernommen,
  nicht geforkt. Konzeptuelle Abweichungen im Kanon dokumentieren, nie
  still einbauen.
- **adult_game-Schichtung** (`docs/ssot/SYSTEMS_OVERVIEW.md`): das
  Logik-Stratum spiegelt die vier Labor-Schichten; `onFail`-Pflicht für
  gated Rules (Anti-Chore-Loop) nicht entfernen.

## Arbeitsweise

- Neue Engines = neuer Adapter-Ordner mit Capability-Manifest + Tests in
  `test/test_adapters.js` + Aufnahme in `tools/verify.js`. Kern bleibt
  unangetastet.
- Ledger-/Router-Änderungen zuerst gegen `docs/loss-taxonomy.md` prüfen;
  bei gewollten Abweichungen die Doku im selben Commit nachziehen.
- Git: Branch pro Aufgabe, Push mit `git push -u origin <branch>`.
  Nie committen: `node_modules/`, `tools/verify-out/`.
