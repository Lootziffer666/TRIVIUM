# TRIVIUM-Kanon — v1.0

**Status:** Gründungsdokument. Wo spätere Dokumente widersprechen, wird der
Widerspruch dokumentiert, nie still gemerged (Manifold-Disziplin).

---

## 0. Was TRIVIUM ist

TRIVIUM ist ein **universeller Game Translation Compiler**. Er überträgt die
drei Grundpfeiler des klassischen Triviums auf Spielwelten:

| Pfeiler | Klassisch | In TRIVIUM |
|---|---|---|
| **Grammatik** | Struktur der Sprache | Struktur der Welt: Entities, Relationen, Räume — was existiert und wie es gebunden ist |
| **Rhetorik** | Wirkung der Rede | Ausdruck der Welt: Intents (0..1-Bedeutungsachsen), Momente, Bogen — wie die Welt den Spieler anspricht |
| **Logik** | Gültigkeit des Schließens | Regeln der Welt: State, Trigger, Maschinen, Gedächtnis — warum die Welt reagiert und kohärent bleibt |

Eine Welt wird EINMAL als Bedeutung formuliert (WIR — World Intermediate
Representation) und in beliebige Engines übersetzt. Godot, Unity, Unreal,
LÖVE, Ren'Py, SHADED — 2D, 2.5D, 3D: Zielsprachen, keine Zugehörigkeiten.
Es gibt keinen Architektur-Rassismus; es gibt nur Sprachen mit
unterschiedlichen Registern.

## 1. Der Kernsatz

> **Engines sind natürliche Sprachen. Übersetze niemals Syntax.
> Übersetze Bedeutung.**

Präzise Form:

> TRIVIUM bildet Weltbedeutung auf **kommunikative Koordinaten** ab — was
> existiert, wie es wirkt, warum es reagiert — **bevor** irgendeine
> Entscheidung fällt, wie ein Ziel-Engine es ausspricht. Emission ist eine
> nachgelagerte, geroutete Handlung. Sie ist nie der Einstiegspunkt.

Das ist Manifolds Kernsatz („The relationship is the key. Grammar is
secondary." — FLOW-SPIN-SMASH, `research/MANIFOLD_CANON_v0.7.md` §1),
übertragen vom Sprach- auf das Weltendesign: *Die Beziehung ist der
Schlüssel. Die Engine ist sekundär.*

## 2. Abstammung (nichts hiervon ist erfunden)

1. **Manifold** (`lootziffer666/FLOW-SPIN-SMASH`, research/MANIFOLD_*):
   - *Erst klassifizieren, dann entscheiden ob interveniert werden darf* →
     erst routen, dann entscheiden was emittiert werden darf.
   - Stage 0–3 als Ordnung von **Verpflichtungen**: Schutz → Struktur →
     Routing → Realisierung. Keine spätere Stufe hebt frühere Schutzrechte auf.
   - Routing-Taxonomie → `ROUTES`: native / bridge / approximate / decompose /
     preserve / **unknown = designte Enthaltung**. Passivität ist Sicherheit,
     kein Versagen.
   - Jede Änderung traceable: `ruleId` + nicht-leerer `reason`. Kein
     verstecktes Rewrite. Das Original reist mit jeder Übersetzung mit
     (`<id>.wir.json` liegt in jedem Output).
2. **SHADED** (`lootziffer666/SHADED`): High-Level-Parameter statt
   Effekt-Schalter (Invariante 6) → Intent-Achsen sind Bedeutungen, nie
   Engine-Parameter. SHADED ist zugleich der erste fließend rhetorische
   Zieladapter (`adapters/shaded/`).
3. **adult_game** (`lootziffer666/adult_game`, docs/ssot/SYSTEMS_OVERVIEW.md):
   die vier Labor-Schichten (Context/Timing, Hidden Relational State,
   World-Reaction Trigger, Hint/Memory) → das Logik-Stratum der WIR und die
   Kohärenz-Engine. Deren Kernhypothese wird messbar: *wiederholte
   Fehlversuche müssen lernbaren Fortschritt erzeugen, keine Chore-Loops*
   (`CHORE_LOOP_RISK`, `learnability`-Metrik).

## 3. Unverhandelbare Invarianten

1. **Die Kernbibliothek kennt keine Engine.** `packages/trivium-core` enthält
   kein Engine-Vokabular — kein `dayNight`, kein `Node2D`, kein `label`.
   Adapter sind Plugins (`adapters/*`), registriert über `createRegistry()`.
   Der Kern importiert nie einen Adapter.
2. **Bedeutung, nie Syntax.** Die WIR spricht Intent-Achsen
   (`precipitation`, `coldness`, …), nie Parameter. Dass kalter Niederschlag
   in SHADED zu `snowfall` und warmer zu `rain` wird, ist eine
   ÜBERSETZUNGS-Entscheidung des Adapters — eine Bedeutung, zwei
   Oberflächenformen, wie in jeder natürlichen Sprache.
3. **Jede Übersetzung dokumentiert ihren Verlust.** Routen `approximate` und
   `preserve` ERZWINGEN einen Verlusteintrag (Ledger wirft sonst). Ein
   Adapter, der `approximate` deklariert ohne `loss`, wird von der Registry
   abgewiesen. Eine Übersetzung ohne Ledger ist keine Übersetzung, sondern
   ein Gerücht.
4. **Jede Semantik bietet neue Möglichkeiten.** Adapter deklarieren `gains`:
   was die Zielsprache sagen kann, wonach die Quelle nie gefragt hat
   (SHADEDs Weltgesetze, Godots Physik, Ren'Pys Rollback). Ein leeres
   Gain-Feld im Report ist als verdächtig markiert.
5. **Die Quelle ist heilig.** Stage 0 friert die WIR ein (deep-freeze);
   kein Adapter mutiert sie. Unbekannte Konzepte werden nicht geraten,
   sondern routen `unknown` → `needs_human_review`.
6. **Kohärenz vor Emission.** Eine Welt, die in der WIR inkonsistent ist,
   ist in jeder Engine inkonsistent. Strict-Mode verweigert die
   Realisierung; non-strict trägt die Fehler sichtbar im Report.
   *Fix meaning, not output.*

## 4. Abgrenzung

TRIVIUM ist **kein** Transpiler (übersetzt keine GDScript→C#-Syntax), kein
Asset-Konverter, kein Engine-Wrapper und keine Runtime. TRIVIUM übersetzt
Weltbedeutung in Engine-Scaffolds plus vollständige Rechenschaft. Die
letzte Meile — echte Assets, echtes VFX-Tuning — bleibt Autorenarbeit und
wird vom Report als solche benannt.
