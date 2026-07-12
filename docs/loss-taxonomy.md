# Verlust-Taxonomie — Routen und ihre Rechenschaft

Abgeleitet aus Manifolds Routing→Action-Tabelle
(FLOW-SPIN-SMASH `research/MANIFOLD_ROUTING_TAXONOMY_v0.7.md` §2).
Quelle im Code: `packages/trivium-core/src/ledger.js` (`ROUTES`).

| Route | Bedeutung | Verlust-Pflicht | Analogie (Sprache) |
|---|---|---|---|
| `native` | Ziel spricht das Konzept fließend | — | Wort existiert 1:1 |
| `bridge` | äquivalentes Konstrukt, Mapping dokumentiert | — | Lehnübersetzung |
| `approximate` | verlustbehaftete Realisierung | **`loss` erzwungen** | Umschreibung („Schadenfreude" auf Englisch) |
| `decompose` | ein Konzept wird mehrere Zielkonstrukte | — | ein Wort → Nebensatz |
| `preserve` | Ziel kann es nicht aussprechen; Bedeutung wird inert mitgeführt | **`loss` erzwungen** | Zitat in Originalsprache |
| `unknown` | designte Enthaltung — Sicherheitszustand | → `needs_human_review` | Übersetzer schweigt statt zu raten |

## Durchsetzung (nicht aspirational)

- `ledger.record()` wirft ohne `ruleId` + nicht-leeren `reason` —
  *no hidden rewrite*.
- `approximate`/`preserve` ohne `loss` → Wurf.
- Registry weist Adapter ab, deren Manifest `approximate` ohne
  deklarierten `loss` enthält — Verluste werden vorab deklariert, nicht in
  Produktion entdeckt.
- `unknown` erreicht nie einen Adapter: der Router hält solche Konzepte
  zurück (Passivität als Sicherheit; vgl. Manifold `ROUTE_ACTION.UNKNOWN
  === 'preserve'`).
- Das Original (`<id>.wir.json`) liegt in JEDEM Übersetzungsoutput — die
  Projektion ersetzt nie die Quelle.

## Gewinn-Pflicht (TRIVIUMs Erweiterung)

Jede Übersetzung dokumentiert auch **Gains**: Affordanzen der Zielsprache,
nach denen die Quelle nie gefragt hat. Beispiele aus den mitgelieferten
Adaptern:

- **SHADED:** 31 Weltgesetze reagieren ungefragt auf jeden Parametersatz;
  Pfützen spiegeln Warmlicht, Rost akkumuliert, Atemwolken erscheinen im Frost.
- **Godot:** Entities werden lebendige, signalfähige Objekte; die übersetzte
  Welt kann Systeme wachsen lassen, die TRIVIUM nie beschrieb.
- **Ren'Py:** Rollback + Saves geben Wiederspielbarkeits-Instrumentierung
  gratis; Interpretations-Progression (adult_game-Hypothese) ist dort testbar.
- **LÖVE:** totale Transparenz — die ganze Welt ist eine lesbare Lua-Datei.

Ein Report ohne Gains ist als verdächtig markiert: eine Übersetzung, die
keine Türen öffnet, hat ihr Ziel nicht verstanden.
