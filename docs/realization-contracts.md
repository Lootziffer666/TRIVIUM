# Realization Contracts — von Quelle zu gleichwertiger Verkörperung

**Status:** Kanonische Vertragsschicht für TRIVIUM v1.1. Schema v0.1.0 ist in `packages/trivium-contracts` implementiert. JSON (`*.contract.json`) ist das maschinenlesbare Dateiformat; YAML-Blöcke in diesem Dokument sind Illustration.

Ein Realization Contract beschreibt nicht, wie ein Ziel technisch gebaut wird.
Er beschreibt, was die neue Verkörperung leisten, bewahren und beweisen muss.

## 1. Grundprinzip

```text
Quelle ≠ Dateiformat
Quelle = Evidenz für Verpflichtungen
```

Die neue Form darf anders aussehen, anders aufgebaut sein und andere technische
Mittel verwenden. Sie ist gültig, wenn sie die relevanten Verpflichtungen
äquivalent erfüllt.

## 2. Vertragsarten

| Vertrag | Zweck |
|---|---|
| **World Contract** | Was in der Welt gilt und nicht engineabhängig werden darf |
| **Asset Contract** | Welche Rolle ein Asset im Ziel erfüllen muss |
| **Function Contract** | Welche Zustandsänderungen, Nebenwirkungen und Invarianten Code bewahren muss |
| **Perception Contract** | Über welche Kanäle Wirkung und Lesbarkeit entstehen |
| **Scene Contract** | Welche Inputs eine Szene benötigt und welche Outputs sie zurückliefert |
| **Tool Contract** | Welche Transformation ein Werkzeug tatsächlich und belegbar ausführt |
| **Evidence Contract** | Welche Tests einen Erfolg bestätigen oder widerlegen |

## 3. Gemeinsames Schema

```yaml
id: corridor.stress-collapse
kind: world
source:
  type: concept
  provenance: author
scope:
  target: any
preserve:
  - stress_causes_instability
  - transformation_is_reversible
  - traversal_matches_geometry
project:
  - geometry
  - collision
  - navigation
  - audio
  - particles
may_approximate:
  - fragment_count
  - exact_debris_trajectory
must_not:
  - visual_deformation_with_static_collision
fallbacks:
  - staged_mesh_swap
  - precomputed_state_sequence
verify:
  - player_cannot_cross_when_contract_says_blocked
  - npc_path_changes_with_corridor
  - stress_zero_restores_passage
```

## 4. Asset Contract

Ein Asset Contract trennt Quellreichtum vom Zielbedarf.

```yaml
id: actor.guard
kind: asset
source:
  engine: unity
  type: prefab
  license_ref: asset-registry/guard-license
role:
  semantic: humanoid_guard
required:
  - recognizable_silhouette
  - idle
  - walk
  - blocking_collision
  - interaction_anchor
optional:
  - facial_rig
  - cloth
  - advanced_lod
acceptable_realizations:
  - unreal_skeletal_actor
  - godot_characterbody3d
  - eight_direction_sprite
  - audio_only_presence
```

Die Engine darf nicht entscheiden, ob das Asset grundsätzlich brauchbar ist.
Sie entscheidet nur, welche Realisierungskosten und Verluste anfallen.

## 5. Function Contract

Codekonvertierung ist Funktionsübertragung.

```yaml
id: door.make_inactive
kind: function
inputs:
  - door_state
preconditions:
  - door_exists
reads:
  - door.lock_state
writes:
  - door.active
  - passage.blocked
  - navigation.version
side_effects:
  - emit door_state_changed
postconditions:
  - door_not_interactable
  - collision_disabled
  - passage_traversable
error_behavior:
  - missing_door_is_reported
must_not:
  - visual_only_hide
```

Quellcode wird anhand von Datenfluss, Kontrollfluss, Lifecycle und
beobachtbarem Verhalten auf diesen Vertrag gehoben. Zielcode wird aus dem
Vertrag und dem Engine-Corpus erzeugt.

## 6. Perception Contract

Eine Welt ist nicht an Grafik gebunden.

```yaml
id: large_hall.readability
kind: perception
spatial_model: 3d
primary_channels:
  - binaural_audio
secondary_channels:
  - language
  - haptics
requirements:
  - direction_is_readable
  - distance_is_estimable
  - room_size_is_distinguishable
visuals:
  required: false
```

Für ein gehörloses Spiel könnte derselbe Raum über Blickachsen, Licht,
Vibration, Bewegung und Gebärdenchoreografie realisiert werden. Die Welt bleibt
räumlich; nur ihre Projektion ändert sich.

## 7. Scene Contract und Engine Federation

```yaml
id: clockwork_mansion
kind: scene
runtime: unity
inputs:
  - player.health
  - player.inventory
  - world.guard_trust
outputs:
  - player.stress
  - world.mansion_state
  - world.antagonist_status
entry:
  semantic_anchor: front_gate
exit:
  semantic_anchor: escape_tunnel
handoff:
  format: trivium-world-state-v1
  atomic: true
```

Eine Szene darf in einer anderen Engine laufen, solange:

- World State eindeutig übergeben wird,
- native Objektreferenzen nicht über die Grenze lecken,
- Entry und Exit semantisch definiert sind,
- Fehler und Wiederaufnahme geregelt sind,
- der Wechsel getestet ist.

## 8. Tool Contract

```yaml
id: candidate.scene2sprite
kind: tool
accepts:
  - godot_scene_animated
produces:
  - png_frames
capabilities:
  - render_animation
  - preserve_transparency
unknown:
  - collision_export
  - atlas_metadata
execution:
  headless: unknown
status: candidate
```

Ein Tool Contract darf Lücken enthalten. Diese werden vom Planner entweder
über weitere Werkzeuge geschlossen oder als Review-Aufgabe ausgewiesen.

## 9. Evidence Contract

Evidence Contracts sind mit dem CUE-light Runner `tools/verify-evidence.js` ausführbar (`file_exists`, `file_hash`, `json_path`, `image_dimensions`, `report_route_count`, `manual`). Jede Route braucht Beweise, die auf den eigentlichen Vertrag zielen.

```yaml
id: verify.guard.sprite
kind: evidence
checks:
  - idle_frame_count_matches_plan
  - walk_loop_has_no_missing_direction
  - collision_footprint_matches_role
  - silhouette_score_above_threshold
artifacts:
  - source_preview.png
  - target_atlas.png
  - translation_report.md
  - test-results.json
```

Ein Ziel, das importiert oder kompiliert, ist noch nicht gleichwertig.

## 10. Routingoperationen

- `native` — Ziel spricht die Verpflichtung direkt.
- `bridge` — äquivalentes Zielidiom.
- `decompose` — eine Verpflichtung wird mehrere Zielkonstrukte.
- `reconstruct` — Zielstruktur wird aus Bedeutung neu aufgebaut.
- `bake` — dynamische Bedeutung wird in feste Ausgabe überführt.
- `project` — anderer Wahrnehmungs- oder Dimensionskanal.
- `approximate` — dokumentierte Vereinfachung.
- `preserve` — Bedeutung wird inert mitgeführt.
- `federate` — Quelle bleibt in eigener Runtime.
- `unknown` — keine Ausführung ohne Review.

## 11. Minimaler Scope für kleine Spiele

Der erste Corpus konzentriert sich auf:

- Entity und Rolle,
- State,
- Input,
- Bewegung,
- Kollision,
- Trigger,
- Interaktion,
- Inventar,
- Dialog,
- Gedächtnis und Beziehung,
- Kamera,
- Audio,
- UI,
- Szenenübergang,
- Save State.

Nicht Teil der ersten Zielmenge:

- riesige Open Worlds,
- MMOs,
- vollständige AAA-Projektmigration,
- framegenaue Multi-Engine-Physik,
- beliebige proprietäre Middleware.

## 12. Definition of Done

Eine Realisierung gilt als fertig, wenn:

1. Quelle und Provenienz erfasst sind.
2. Vertrag und Zielrolle klar sind.
3. Transformationsroute reproduzierbar ist.
4. alle Verluste und Gewinne im Ledger stehen.
5. unbekannte Teile sichtbar markiert sind.
6. Evidence die Vertragsanforderungen prüft.
7. das Ziel in seiner vorgesehenen Runtime funktioniert.
8. ein Mensch nur dort entscheiden muss, wo die Evidenz nicht genügt.
