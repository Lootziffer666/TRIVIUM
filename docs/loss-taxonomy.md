# Verlust-Taxonomie — Routing, Realisierung und Rechenschaft

**Status:** `native`, `bridge`, `approximate`, `decompose`, `preserve` und
`unknown` sind im aktuellen Core implementiert. Die zusätzlichen
Realisierungsrouten dieses Dokuments sind kanonische Entwicklungsziele und
dürfen erst nach Code- und Testunterstützung als implementiert gemeldet werden.

Abgeleitet aus Manifolds Routing→Action-Tabelle und erweitert für Assets, Code,
Wahrnehmungsprojektionen und Engine Federation.

## 1. Implementierte Kernrouten

| Route | Bedeutung | Verlust-Pflicht | Analogie |
|---|---|---|---|
| `native` | Ziel spricht das Konzept direkt | — | Wort existiert 1:1 |
| `bridge` | äquivalentes Zielkonstrukt | Mapping erforderlich | Lehnübersetzung |
| `approximate` | bewusst verlustbehaftete Realisierung | **`loss` erzwungen** | Umschreibung |
| `decompose` | ein Konzept wird mehrere Zielkonstrukte | Mapping erforderlich | Wort→Nebensatz |
| `preserve` | Bedeutung bleibt inert erhalten | **`loss` erzwungen** | Originalzitat |
| `unknown` | designte Enthaltung | Review erforderlich | schweigen statt raten |

## 2. Geplante Realisierungsrouten

| Route | Bedeutung | Pflichtnachweis |
|---|---|---|
| `reconstruct` | Zielstruktur wird aus Vertrag neu aufgebaut | Zielvertrag + Vergleichstest |
| `normalize` | Achsen, Units, Channels, Pivot oder Benennung werden vereinheitlicht | Vorher/Nachher-Metadaten |
| `bake` | dynamische Funktion wird in feste Frames, Texturen, Geometrie oder Daten überführt | deklarierter Dynamikverlust |
| `project` | Bedeutung wechselt Dimension oder Wahrnehmungskanal | Perception-/Asset-Contract |
| `degrade` | Fähigkeit wird absichtlich reduziert | begründeter Verlust + Akzeptanz |
| `enrich` | Ziel fügt eine neue Fähigkeit hinzu | Gain + Konfliktprüfung |
| `federate` | Quelle bleibt in eigener Runtime; World State wird übergeben | Scene Contract + Handoff-Test |

Diese Routen sind nicht bloß Synonyme. Sie beeinflussen Planner, Toolauswahl,
Evidence und Recovery.

## 3. Verlustklassen

### Semantischer Verlust

Eine Regel, Rolle, Beziehung oder Spielerwirkung kann nicht vollständig
erhalten werden.

Beispiel: freie kontinuierliche Raumverformung wird zu drei diskreten
Szenenzuständen.

### Funktionaler Verlust

Das Ziel sieht ähnlich aus, tut aber nicht dasselbe.

Beispiel: eine Tür wird unsichtbar, blockiert aber weiterhin Kollision und
Navigation.

### Dynamikverlust

Laufzeitverhalten wird gebacken.

Beispiel: ein prozeduraler 3D-Charakter wird zum Spriteatlas.

### Präzisionsverlust

Werte, Koordinaten, Kurven, Physik oder Timing werden angenähert.

### Wahrnehmungsverlust

Ein Ausdruckskanal entfällt.

Beispiel: visuelle Mimik wird in Text und Atemgeräusch umgeschrieben.

### Strukturverlust

Quellhierarchie, Prefab-/Blueprint-Komposition oder Modulgrenzen können nicht
beibehalten werden.

### Provenienzverlust

Herkunft, Lizenz, Autor oder Originalartefakt sind nicht mehr nachvollziehbar.
Dieser Verlust ist nicht akzeptabel; die Route wird blockiert.

### Reversibilitätsverlust

Die Zielausgabe kann nicht zuverlässig auf die neutrale Bedeutung oder Quelle
zurückgeführt werden.

## 4. Gewinnklassen

Eine Übersetzung dokumentiert nicht nur Verluste.

- **Affordance Gain:** Ziel kann etwas ausdrücken, wonach die Quelle nie fragte.
- **Accessibility Gain:** neue Wahrnehmungs- oder Eingabekanäle.
- **Observability Gain:** besserer Trace, Debugging oder Evidence.
- **Performance Gain:** günstigere Verkörperung bei gleichem Vertrag.
- **Portability Gain:** neutrales oder offeneres Format.
- **Composability Gain:** Asset oder Code wird modularer und wiederverwendbarer.

Ein Gain darf keinen stillen Bedeutungswechsel legitimieren.

## 5. Durchsetzung

Aktuell implementiert:

- `ledger.record()` verlangt `ruleId` und nicht-leeren `reason`.
- `approximate` und `preserve` verlangen `loss`.
- `unknown` erreicht keinen Adapter.
- die WIR reist mit jedem Output.

Für den Realization Planner zusätzlich erforderlich:

- jeder Toolschritt schreibt Input-/Output-Hashes,
- Version und Lizenz jedes Tools werden gespeichert,
- jeder Route wird ein Contract zugeordnet,
- `reconstruct`, `project`, `bake` und `federate` brauchen eigene Evidence,
- Provenienzverlust blockiert Production,
- ein kompiliertes Ziel ohne Vertragsprüfung gilt nicht als Erfolg.

## 6. Beispiel

```yaml
source: unity.prefab.guard
target: godot.sprite.guard
route: project
steps:
  - extract
  - normalize_rig
  - render_eight_directions
  - pack_atlas
losses:
  - type: dynamics
    detail: cloth simulation baked into frames
  - type: precision
    detail: continuous rotation reduced to eight directions
gains:
  - type: performance
    detail: no skeletal runtime required
  - type: portability
    detail: PNG atlas and JSON metadata
verify:
  - silhouette_preserved
  - required_animations_present
  - collision_role_preserved
```

## 7. Regel

> Eine neue Form darf vom Original abweichen. Sie darf aber weder verschweigen,
> worin sie abweicht, noch behaupten, dieselbe Funktion zu erfüllen, ohne es zu
> beweisen.
