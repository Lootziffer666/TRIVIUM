# TRIVIUM-Kanon — v1.1

**Status:** Kanonisches Richtungsdokument. Wo spätere Dokumente widersprechen,
wird der Widerspruch dokumentiert, nie still gemerged. Der Quellstand bleibt
beweisbar; neue Einsichten ersetzen ihn nicht unsichtbar.

---

## 0. Was TRIVIUM ist

TRIVIUM ist ein **semantischer Game-Translation- und Realization-Compiler**.
Es überträgt die drei Grundpfeiler des klassischen Triviums auf Spielwelten:

| Pfeiler | Klassisch | In TRIVIUM |
|---|---|---|
| **Grammatik** | Struktur der Sprache | Struktur der Welt: Entities, Relationen, Räume, Rollen und Fähigkeiten |
| **Rhetorik** | Wirkung der Rede | Ausdruck der Welt: Wahrnehmung, Atmosphäre, Spannung, Lesbarkeit und Spielerwirkung |
| **Logik** | Gültigkeit des Schließens | Regeln der Welt: State, Trigger, Gedächtnis, Invarianten und Konsequenzen |

Eine Welt wird einmal als Bedeutung formuliert und anschließend in geeignete
technische Formen transkribiert. Unity, Unreal, Godot, LÖVE, Ren'Py, SHADED,
Browser, Audio-only, 2D, 2.5D und 3D sind Zielsprachen und Projektionen — keine
Zugehörigkeiten.

TRIVIUM verfolgt dabei vier miteinander verbundene Aufgaben:

1. **Weltbedeutung bewahren:** Was existiert, was gilt und was eine Handlung
   bewirkt.
2. **Realisierung planen:** Welche technische Form die benötigte Wirkung mit
   dem geringsten unvertretbaren Verlust erzeugt.
3. **Vorhandene Werkzeuge orchestrieren:** Konverter, Importer, DCC-Werkzeuge,
   Engine-Editoren und Skripte werden verkettet, statt neu erfunden.
4. **Äquivalenz beweisen:** Das Ziel muss die relevanten Verpflichtungen der
   Quelle erfüllen; Kompilierbarkeit allein genügt nicht.

## 1. Der Kernsatz

> **Engines sind natürliche Sprachen und Brennöfen. Übersetze niemals bloß
> Syntax oder Dateiendungen. Berge Bedeutung, forme neu und beweise Funktion.**

Präzise Form:

> TRIVIUM bildet Weltbedeutung, Assetrollen, Funktionsverträge und
> Wahrnehmungsabsichten auf neutrale Koordinaten ab, bevor irgendeine
> Entscheidung fällt, wie eine Zielengine sie ausspricht. Emission,
> Konvertierung und Enginewahl sind nachgelagerte, geroutete Handlungen.

Das ist Manifolds Kernsatz — *The relationship is the key. Grammar is
secondary.* — auf Spielwelten, Code und Assets übertragen:

> **Die Beziehung ist der Schlüssel. Die Engine ist sekundär.**

## 2. Quellen statt Kategorien

Für TRIVIUM sind die folgenden Dinge zunächst dieselbe Art Problem:

- eine Spielidee,
- ein Unity-Prefab,
- ein Unreal-Asset,
- ein 3D-Modell,
- ein Sprite,
- ein Shader,
- eine Szene,
- ein dekompiliertes Programmfragment,
- ein altes Spiel,
- ein Dialog oder Roman,
- eine Audioaufnahme,
- ein vorhandenes GitHub-Werkzeug.

Sie sind **Quellen**. Jede Quelle ist Evidenz für etwas, das in einer neuen Form
weiterleben soll.

Der Ablauf lautet daher:

```text
Quelle
→ Verpflichtungen und Beziehungen bergen
→ gewünschte Zielwirkung bestimmen
→ passende Transformationsroute planen
→ neue Verkörperung erzeugen
→ Äquivalenz und Verluste prüfen
```

Das Original ist nicht seine Datei, Engine oder Syntax. Das Original ist das,
was erhalten bleiben muss.

## 3. Abstammung

1. **MANIFOLD / FLOW-SPIN-SMASH**
   - Schutz → Struktur → Routing → Realisierung.
   - Beziehungen vor Oberflächentokens.
   - `unknown` ist designte Enthaltung, kein Versagen.
   - Jede Intervention braucht Trace, Regel und Begründung.
2. **SHADED**
   - High-Level-Absichten statt isolierter Effekt-Schalter.
   - Wahrnehmbare Zustände sind Projektionen derselben Weltwahrheit.
   - Shader-first ist ein wichtiger Zielkanal; field-first bleibt die
     allgemeinere Architektur für Geometrie, Physik, Navigation, Audio und
     Darstellung.
3. **adult_game**
   - Context/Timing, Hidden Relational State, World Reaction und Hint/Memory.
   - Wiederholte Fehlversuche müssen lernbaren Fortschritt erzeugen.
   - Nicht-Reaktion, Verzögerung und Grenzschutz sind aktive Weltreaktionen.
4. **SWIFT**
   - Form ist wandelbar. 3D, 2D, Sprite, Voxel, SDF, Tile, Atlas oder
     vorgerenderte Projektion können verschiedene Verkörperungen derselben
     Rolle sein.
5. **ANVIL**
   - Produktionscompiler und Orchestrator. ANVIL entwickelt keine Spiele für
     Engines, sondern enginefreie Welten und lässt sie auf der letzten Meile
     realisieren.
6. **WIZARD**
   - Sucht nicht nach enginepassenden Dateien, sondern nach Quellen, die
     benötigte Rollen erfüllen oder erfüllbar gemacht werden können.
7. **MYTHIC und CUE-AGENT**
   - MYTHIC provisioniert und führt Toolchains aus.
   - CUE-AGENT akzeptiert Completion nur mit Evidenz.

## 4. Unverhandelbare Invarianten

1. **Der Kern kennt keine Zielengine.** Enginevokabular lebt in Adaptern,
   Corpus-Einträgen und Toolmanifesten.
2. **Bedeutung vor Implementierung.** Kein `GameObject`, `AActor`, `Node3D`,
   `Collider` oder Shadername ist kanonische Weltwahrheit.
3. **Verpflichtung vor Kopie.** Eine neue Verkörperung muss nur das erhalten,
   was ihre Rolle im neuen Spiel benötigt — aber dieses vollständig und
   überprüfbar.
4. **Keine stillen Verluste.** Jede Approximation, Zerlegung, Rekonstruktion,
   Vereinfachung oder bewusste Auslassung landet im Ledger.
5. **Keine erfundenen Sicherheiten.** Unbekannte Semantik wird als `unknown`
   geroutet und erzeugt Review-Arbeit.
6. **Das Original reist mit.** Quellartefakte, Provenienz, Lizenzhinweise,
   Reports und Zwischenrepräsentationen bleiben referenzierbar.
7. **Funktion ist der Maßstab für Code.** Codekonvertierung bedeutet
   Übertragung eines Funktionsvertrags in eine andere technische Grammatik.
8. **Wirkung ist der Maßstab für Projektion.** Grafik, Audio, Text, Haptik,
   Geometrie und Shader sind austauschbare Ausdruckskanäle, sofern die
   relevanten Weltverpflichtungen erhalten bleiben.
9. **Werkzeuge werden bevorzugt verbunden statt neu gebaut.** Eigene
   Entwicklung konzentriert sich auf IRs, Planung, Adapter, Evidenz,
   Fehlerbehandlung und fehlende Fugen.
10. **Die Engine darf kein kreativer Türsteher sein.** Ein geeignetes Asset
    wird nicht verworfen, nur weil es aus einer anderen Engine stammt.
11. **Kohärenz vor Emission.** Eine inkonsistente neutrale Welt wird nicht durch
    hübschen Zielcode korrekt.
12. **Scope bleibt klein und praktisch.** TRIVIUM optimiert zuerst kleine Spiele,
    Szenen, Assets und klar begrenzte Erfahrungen — nicht AAA-Portierung,
    MMO-Synchronisation oder riesige Open Worlds.

## 5. Code-Esperanto

TRIVIUMs Code-Esperanto ist kein neuer Programmiersprachenersatz. Es ist eine
neutrale Schicht aus Absichten, Zuständen, Effekten, Invarianten und
Verpflichtungen.

```yaml
intent: passage.make_traversable
requires:
  - visual_state_matches_accessibility
  - collision_no_longer_blocks
  - navigation_can_cross
  - state_persists
forbidden:
  - visually_open_but_physically_blocked
```

Engineadapter ordnen dieses Lemma ihren eigenen Konstrukten zu:

```text
Unity  → GameObject/Collider/NavMesh/State
Unreal → Actor/CollisionComponent/NavModifier/State
Godot  → Node/CollisionShape/NavigationRegion/Resource
```

Die Syntax wird erst beim Neuaufbau ergänzt. Die Datenbank dient dabei nicht
nur als Wörterbuch, sondern als belegter Corpus aus:

- gemeinsamem Sinn,
- Quell- und Zielidiomen,
- Vorbedingungen,
- Nebenwirkungen,
- Lebenszyklus,
- Verlusten und Gewinnen,
- Tests und Confidence.

## 6. Realization Contracts

Jede Quelle wird nur soweit übertragen, wie es die neue Rolle verlangt.

Beispiel: Ein komplexer Unity-Charakter enthält 48 Animationen, Cloth,
Gesichtsrig, Shader Graph und LODs. Das Zielspiel benötigt nur:

- erkennbare Silhouette,
- Idle,
- Laufen,
- eine Aktion,
- Kollision,
- Blickrichtung.

Dann ist eine reduzierte Unreal-Figur, ein Godot-GLB oder ein Acht-Richtungs-
Spritesheet eine gültige Verkörperung, sofern der Vertrag erfüllt ist.

Ein Realization Contract beschreibt:

- **preserve:** Was unverändert bleiben muss.
- **project:** Wie es wahrnehmbar wird.
- **approximate:** Was vereinfacht werden darf.
- **bake:** Was von dynamisch zu statisch werden darf.
- **reconstruct:** Was im Ziel neu aufgebaut werden muss.
- **degrade:** Welche Fähigkeit bewusst reduziert wird.
- **enrich:** Welche neue Fähigkeit das Ziel hinzufügt.
- **verify:** Wie Gleichwertigkeit gemessen wird.

## 7. Engine Federation

Ein Spiel muss nicht vollständig in einer Engine laufen. Es muss durchgehend in
derdelben Welt laufen.

TRIVIUM erlaubt daher zwei Strategien:

1. **Transkription:** Quelle wird in die Zielengine neu verkörpert.
2. **Föderation:** Eine Szene bleibt in ihrer geeigneten Engine und wird über
   einen neutralen Scene Contract mit anderen Runtimes verbunden.

```yaml
scene: clockwork_mansion
runtime: unity
inputs:
  - player.inventory
  - player.health
  - world.guard_trust
outputs:
  - world.mansion_state
  - player.stress
entry: front_gate
exit: escape_tunnel
```

Übergänge sollen zunächst an semantischen Schnittpunkten erfolgen: Türen,
Portale, Fahrstühle, Kapitelgrenzen, Träume, Erinnerungen, Schwarzblenden oder
bewusste Engine-Hops. Gemeinsame framegenaue Physik über mehrere Engines ist
kein Frühziel.

## 8. Reverse Engineering als Bedeutungsbergung

Dekompilierter Code ist kein Quellcode, sondern Evidenz.

TRIVIUM rekonstruiert nicht primär Dateibäume, sondern:

- Daten- und Kontrollfluss,
- Zustandsbesitz,
- Lifecycle,
- Events und Callbacks,
- Lese-/Schreibbeziehungen,
- Nebenwirkungen,
- Invarianten,
- Featuregrenzen,
- beobachtbares Verhalten.

So können tausende obfuskierte Fragmente zu belegten Featuregruppen
vorsortiert werden. Ein LLM erhält anschließend keinen Müllhaufen, sondern einen
Funktionsvertrag und einen Beziehungsgraphen. Es erzeugt neuen, lesbaren Code
nicht durch Raten, sondern weil die Teile nach Evidenz zusammengehören.

Reverse Engineering und Portierung gelten nur für eigene, freie oder
entsprechend lizenzierte Quellen. Rechte und Provenienz sind Bestandteil jedes
Contracts.

## 9. Field-first und verformbare Welten

Shader sind eine außerordentlich starke Projektionsschicht, aber nicht allein
die Weltwahrheit. Für echte verformbare Räume muss derselbe neutrale Zustand
mehrere Projektionen antreiben:

```text
Stressfeld
→ Geometrie
→ Kollision
→ Navigation
→ Audio
→ Licht/Shader
→ Partikel
```

Ein Flur, der bei steigendem Stress zerfällt und bei Besinnung rekonstruiert
wird, darf nicht nur visuell verbogen sein, wenn Traversierbarkeit und NPCs der
Verformung folgen sollen. SDFs, Voxel, Dynamic Meshes, Geometry Scripts,
Collision-Rebuilds und Navigation-Rebuilds sind mögliche Zielmittel; die
kanonische Wahrheit bleibt das Feld und sein Vertrag.

## 10. Abgrenzung

TRIVIUM ist:

- Welt- und Funktionscompiler,
- Transformationsplaner,
- Toolchain-Router,
- Corpus und Beweisledger,
- Engine-Dolmetscher,
- optionaler Föderationsplaner für mehrere Runtimes.

TRIVIUM ist nicht:

- eine neue Rendering- oder Physikengine,
- ein Anspruch auf verlustfreie Universalportierung,
- ein Ersatz für Blender, AssetRipper, FFmpeg, Engine-Editoren oder bestehende
  Konverter,
- ein AAA-Rebuilder,
- eine Lizenzumgehung.

Die letzte Meile darf automatisch, halbautomatisch oder menschlich erfolgen.
Entscheidend ist, dass sie aus demselben belegten Vertrag entsteht und ihr
Ergebnis überprüft wird.
