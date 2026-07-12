# Engine-Dolmetscher — Assets, Shader und Engine-Sprech-Corpus

**Status:** Entwurfsauftrag für TRIVIUM nach WIR v1.0.0. Dieses Dokument
beschreibt die Erweiterung vom Welt-Compiler zum Dolmetscher zwischen Engine-
Sprachen. Es ersetzt nicht die Invariante „Bedeutung, nie Syntax", sondern
wendet sie auf Assets, Shader und Engine-Idiome an.

## 1. Zielbild

TRIVIUM soll eine Szene, ein Asset, einen Shader oder ein Gameplay-Idiom nicht
als Dateiformat behandeln, sondern als Aussage in einer Engine-Sprache:

- Unity-Assets sollen in Unreal funktionieren und Unreal-Assets in Unity, ohne
  dass TRIVIUM behauptet, ein verlustfreier Binärkonverter zu sein.
- Shader sollen aus Bedeutung rekonstruiert und in HLSL, Shader Graph, Unreal
  Material Graph, Godot Shader Language, GLSL oder andere Zielsprachen
  übersetzt werden können.
- Ein Engine-Sprech-Corpus soll dokumentieren, welche Konzepte Engines nativ
  sprechen, welche sie nur umschreiben, welche sie zerlegen müssen und welche
  menschliche Autorenschaft brauchen.

Der Dolmetscher arbeitet deshalb nicht mit `UnityPrefab -> UnrealBlueprint`,
sondern mit `Quelle -> AIR/SIR/EIR -> Ziel`, wobei jede Stufe ihre Verluste,
Annahmen und Gewinne dokumentiert.

## 2. Drei neue Zwischenrepräsentationen

TRIVIUM behält die WIR für Weltbedeutung. Für Engine-Dolmetschen kommen drei
semantische IRs hinzu:

| IR | Aufgabe | Beispiele |
|---|---|---|
| **AIR — Asset Intermediate Representation** | Beschreibt Assets als Rollen, Bindungen, Maße, Materialien, Importabsichten und LOD-/Collision-Semantik. | Mesh-Rolle, Skeleton, Rig-Konvention, Collider-Absicht, Texture-Slots, Units, Pivot, Socket, Prefab-Komposition |
| **SIR — Shader Intermediate Representation** | Beschreibt visuelle Materialabsicht statt Shader-Syntax. | BRDF-Modell, Albedo/Normal/Roughness/Metallic, UV-Räume, Zeitfunktion, Masken, Transparenzmodus, Beleuchtungsannahmen |
| **EIR — Engine Idiom Representation** | Beschreibt Engine-spezifische Denkfiguren als übersetzbare Idiome. | Unity Prefab, Unreal Blueprint Actor, Godot Node Tree, ScriptableObject, DataAsset, Component-System, Signal/Event-Pattern |

Diese IRs sind keine Ersatzformate für FBX, glTF, `.mat`, `.uasset` oder
Shader-Dateien. Sie sind Bedeutungsschichten, die solche Dateien referenzieren,
annotieren und in andere Engine-Sprachen routen.

## 3. Corpus-Schema

Der Engine-Sprech-Corpus ist die Datenbasis des Dolmetschers. Jeder Eintrag ist
ein belegter Übersetzungsfall, kein Bauchgefühl:

```json
{
  "id": "unity.prefab.component.mesh_renderer.to.unreal.static_mesh_component",
  "source": { "engine": "unity", "version": "2022.3", "concept": "Prefab/MeshRenderer" },
  "target": { "engine": "unreal", "version": "5.4", "concept": "Actor/StaticMeshComponent" },
  "ir": "EIR",
  "route": "bridge",
  "mapping": {
    "sharedMeaning": ["renderable mesh component", "material slot binding"],
    "sourceOnly": ["Unity layer/tag semantics"],
    "targetOnly": ["Blueprint exposure", "mobility setting"]
  },
  "loss": [],
  "gain": ["BlueprintCallable attachment surface"],
  "evidence": ["fixture", "roundtrip-test", "human-review"],
  "confidence": 0.82,
  "notes": "Layer/tag must be routed separately as gameplay metadata."
}
```

Pflichtfelder: Quelle, Ziel, IR, Route, Mapping, Evidenz und Confidence. Jede
`approximate`- oder `preserve`-Route braucht einen konkreten Verlust; jede
`unknown`-Route erzeugt Review-Arbeit statt geratenen Output.

## 4. Shader-Dolmetschen

Shader werden in TRIVIUM nicht primär von Sprache zu Sprache transpiliert.
Stattdessen wird ein Shader in SIR zerlegt:

1. **Oberflächenmodell:** unlit, Lambert, PBR metallic/roughness, clear coat,
   subsurface, toon, volumetrisch.
2. **Datenflüsse:** Texturen, Konstanten, Vertex-Daten, Instanzdaten,
   Zeitachsen, Noise-Funktionen.
3. **Räume:** object, world, view, tangent, screen, UV-Sets.
4. **Render-State:** blending, depth, culling, transparency, shadow behavior.
5. **Nicht-portable Idiome:** Engine-Makros, Custom Nodes, Pipeline-Hooks,
   Lighting-Model-Erweiterungen.

Erst danach emittiert ein Zieladapter Material Graph Nodes, HLSL, GLSL, Godot
Shader Code oder einen Report mit menschlichen To-dos. Ein Shader, der in URP
einen Screen-Space-Pass nutzt, kann nach Unreal eventuell nur `approximate`
werden; das ist ein dokumentierter Bedeutungsverlust, kein stiller Bug.

## 5. Asset-Dolmetschen

Assets werden als AIR plus Originalartefakte übersetzt:

- **Geometrie:** Einheiten, Achsen, Pivot, Bounds, Submeshes, LODs.
- **Rigging:** Skeleton-Namen, Retargeting-Hinweise, Humanoid-/Generic-Rolle,
  Sockets/Bones, Animation-Clips.
- **Materialbindung:** Slots, Texturrollen, Shader-SIR-Verweis.
- **Physik:** Collider-Intent, Trigger vs. Blocking, Mass/Drag/Constraints.
- **Komposition:** Prefab/Blueprint/Node-Hierarchie als EIR, nicht als bloßer
  Ordnerbaum.
- **Metadaten:** Tags, Layers, Gameplay-Kategorien, Import-Settings,
  Lizenz-/Provenienz-Hinweise.

Das Original reist weiterhin mit. Wenn ein `.uasset` nicht direkt gelesen
werden kann, bleibt es als Quelle erhalten und wird durch AIR-Metadaten,
Export-Artefakte und Review-Schritte ergänzt.

## 6. Roadmap

1. **Corpus v0:** JSON-Schema, Fixtures und erste Unity↔Unreal↔Godot-Einträge
   für Mesh, Material, Prefab/Actor, Collider, Animation Clip.
2. **SIR v0:** PBR-Kernmodell, Texture-Slots, UV-/Space-Konventionen,
   Render-State und Zieladapter für Unity Material, Unreal Material-Textplan
   und Godot Shader.
3. **AIR v0:** glTF/FBX-nahe Asset-Bedeutung mit Units, Pivot, LOD, Collider,
   Materialbindung und Rig-Hinweisen.
4. **EIR v0:** Engine-Idiome für Unity Prefab/MonoBehaviour, Unreal
   Actor/Component/Blueprint und Godot Node/Scene.
5. **Roundtrip-Harness:** Import -> IR -> Export -> Reimport -> Report, mit
   Snapshot-Artefakten und menschlichem Review für `unknown`.
6. **Authoring-UI:** Corpus-Einträge kuratieren, Konflikte anzeigen,
   Confidence erhöhen oder senken und Übersetzungen als Lernfälle speichern.

## 7. Unverhandelbare Regeln

- Keine Behauptung von Verlustfreiheit ohne Ledger-Beweis.
- Keine Übersetzung über Dateiendungen; immer über Bedeutung und Route.
- Kein Erraten proprietärer Engine-Semantik; `unknown` ist erlaubt und sicher.
- Shader-Syntax ist Zielausgabe, nicht Quelle der Wahrheit.
- Corpus-Einträge brauchen Evidenz: Fixture, Test, Dokumentation oder
  menschliche Review.
