# Tool Candidate Catalog — Converter, Importer und Realization-Werkzeuge

**Status:** Kanonischer Kandidatenkatalog aus der Screenshot- und Repo-Recherche
vom 12. Juli 2026.

Dieser Katalog ist absichtlich kein Versprechen, dass jedes Repository
produktionsreif ist. Er bewahrt die Recherche als Entwicklungsgrundlage und
verhindert, dass TRIVIUM bereits vorhandene Fähigkeiten unnötig neu baut.

## Bewertungsstatus

- **P0 — sofort prüfen:** strategischer Kern oder direkte Beweisroute.
- **P1 — Pipeline-Stein:** klarer spezialisierter Transformationsschritt.
- **P2 — Referenz:** wertvoll für Mappingregeln, aber vermutlich nicht direkt
  produktionsfähig.
- **Experimental:** jung, archiviert, versionsgebunden oder unbewiesen.

Vor Production müssen für jeden Kandidaten geprüft werden:

- tatsächlicher Funktionsumfang,
- letzte Aktivität und unterstützte Versionen,
- Lizenz,
- CLI-/Headless-Fähigkeit,
- Ein- und Ausgabeformate,
- reproduzierbarer Test,
- Rechte an verarbeiteten Assets.

---

## 1. Unity ↔ Unreal und Unreal-Assetzugriff

### P0

- [Fillexa/UnityToUE](https://github.com/Fillexa/UnityToUE) — früher direkter
  Unity→Unreal-Versuch; Architektur- und Grenzstudie, nicht ungeprüft als
  heutige Production-Route einsetzen.
- [approved/UnrealUAssetConverter](https://github.com/approved/UnrealUAssetConverter)
  — UAsset lesen, schreiben und modifizieren; möglicher Unreal-Binäradapter.
- [PedroMartinsMenezes/AssetTools](https://github.com/PedroMartinsMenezes/AssetTools)
  — UAsset↔JSON-orientierte Werkzeuge; interessant für neutrale
  Analyseoberflächen.
- [josuerf/uasset-json-converter](https://github.com/josuerf/uasset-json-converter)
  — Unreal Asset↔JSON-Kandidat.
- [Tractatuz/JsonToAsset](https://github.com/Tractatuz/JsonToAsset) — JSON→Unreal
  Asset; gemeinsam mit Exportwerkzeugen als Roundtrip-Kandidat prüfen.
- [oranguthang/ue_blueprint_converter](https://github.com/oranguthang/ue_blueprint_converter)
  — Blueprint-/Leveldaten↔YAML; besonders wertvoll für Diff, Agentenbearbeitung
  und EIR.
- [p3rl/AssetRegToJson](https://github.com/p3rl/AssetRegToJson) — Unreal Asset
  Registry→JSON; starker WIZARD-Inventaradapter.
- [WorldsIdraft/UnityToUnrealCoords](https://github.com/WorldsIdraft/UnityToUnrealCoords)
  — Koordinaten-, Achsen- und Raumkonvertierung Unity→Unreal.
- [chun8933/Unity-Unreal-Projection-Matrix](https://github.com/chun8933/Unity-Unreal-Projection-Matrix)
  — Kameraprojektionsmatrizen zwischen Unity und Unreal; wichtig für
  identische Perspektiven, Baking und Screenshotvergleiche.
- [iainmckay/com.jollysamurai.unrealengine4-import](https://github.com/iainmckay/com.jollysamurai.unrealengine4-import)
  — Unreal-4-Materialien in Unity rekonstruieren.
- [iainmckay/unity-unreal-converter-example](https://github.com/iainmckay/unity-unreal-converter-example)
  — Integrations- und Fixture-Repo zum vorherigen Materialkonverter.

### P1

- [Mansoor1619/UE-RuntimeGLBLoader](https://github.com/Mansoor1619/UE-RuntimeGLBLoader)
  — GLB zur Laufzeit in Unreal laden und Static Meshes erzeugen.
- [KvesDev/RuntimeStaticMeshImporter](https://github.com/KvesDev/RuntimeStaticMeshImporter)
  — FBX-Runtimeimport nach Unreal.
- [FROEST-NL/BSP2FBX_Converter](https://github.com/FROEST-NL/BSP2FBX_Converter)
  — BSP-Karten samt Texturen nach FBX normalisieren.
- [north-star-calibration-converter](https://github.com/SafariMonkey/north-star-calibration-converter)
  — Unity-Kalibrierungen nach Unreal; spezialisierte Referenz für
  koordinatentreue Migration.
- [enziop/mixamo_converter](https://github.com/enziop/mixamo_converter) — Mixamo
  via Blender für Unreal, Bone-Renaming, Root Motion und Batch-Konvertierung.
- [Julz876/Rig2UE](https://github.com/Julz876/Rig2UE) — Blender-Rigs in
  Unreal-kompatible Figuren überführen.
- [Sandy10000/mh2ueaddon](https://github.com/Sandy10000/mh2ueaddon) —
  MakeHuman/Blender→Unreal-Skeleton als spezialisierte Rig-Referenz.
- [romaktion/SkeletalToProceduralUnreal](https://github.com/romaktion/SkeletalToProceduralUnreal)
  — Skeletal→Procedural-Repräsentation in Unreal.
- [KevesDev/RuntimeStaticMeshImporter](https://github.com/KevesDev/RuntimeStaticMeshImporter)
  — weiterer Fund desselben Runtime-Importers; Dublette im Registry-Import
  deduplizieren.

### P2 / Experimental

- [gpostolskiy-work3/uasset-decompiler](https://github.com/gpostolskiy-work3/uasset-decompiler)
  — UAsset-Decompiler-Anspruch; erst Substanz und Versionen beweisen.
- [gpostolskiy-work2/uasset-decompiler](https://github.com/gpostolskiy-work2/uasset-decompiler)
  — alternative/ältere Variante; nicht parallel übernehmen, sondern vergleichen.
- [Where44444/BP_To_CPP](https://github.com/Where44444/BP_To_CPP) —
  Blueprint-Graph→C++, experimentell und versionsgebunden.
- [Krowe-moh/BlueprintToCpp](https://github.com/Krowe-moh/BlueprintToCpp) —
  Blueprintanalyse/CPP-Konvertierung als FIR/EIR-Referenz.
- [GGosu/UE-Blueprint-to-UML](https://github.com/GGosu/UE-Blueprint-to-UML) —
  Blueprint→Mermaid/UML; stark für Beziehungsgraphen und Reverse Engineering.
- [rcdrodrigo/Blueprint-Converter](https://github.com/rcdrodrigo/Blueprint-Converter)
  — C++→Blueprint-Nodes, jung und ungeprüft.
- [SafakOnol/UE_BlueprintsToCpp](https://github.com/SafakOnol/UE_BlueprintsToCpp)
  — Demo- und Mappingreferenz.
- [ta-david-yu/Unreal-TwinStick-Blueprint](https://github.com/ta-david-yu/Unreal-TwinStick-Blueprint)
  — überschaubares Blueprint/C++-Vergleichsfixture.
- [tagabalon/RPGSystem](https://github.com/tagabalon/RPGSystem) — Unity-RPG-Code
  als Unreal-Plugin neu verkörpert; Fallstudie, kein Universaltool.
- [dstcyr/ActionRPG_Sample](https://github.com/dstcyr/ActionRPG_Sample) —
  Unreal-Migrationsreferenz.
- [Thor110/UnrealPort](https://github.com/Thor110/UnrealPort) und
  [xtremexp/UT4X-Converter](https://github.com/xtremexp/UT4X-Converter) —
  historische Unreal-Level-/Versionsmigration als Mappingstudien.

---

## 2. Unity ↔ Godot und andere Projektmigrationen

### P0

- [Anthogonyst/UnityToGodot](https://github.com/Anthogonyst/UnityToGodot) —
  umfassender Unity→Godot-Migrationsversuch.
- [Zylann/unity_to_godot_converter](https://github.com/Zylann/unity_to_godot_converter)
  — zweite unabhängige Unity→Godot-Route; gemeinsame Mappingmuster extrahieren.
- [surendra019/unity-to-godot-prefab-animation-converter](https://github.com/surendra019/unity-to-godot-prefab-animation-converter)
  — Prefab-Animationen nach Godot-Szene/AnimationPlayer.
- [DeniedWorks/synty-godot-converter](https://github.com/DeniedWorks/synty-godot-converter)
  — Synty-POLYGON-Pakete für Godot 4.6+, inklusive Material-/Shaderreparatur;
  idealer Asset-Pack-Pilot.
- [Infiland/GM2Godot](https://github.com/Infiland/GM2Godot) — GameMaker→Godot;
  wichtig für ganze kleine Projekte und Event-/Objektmapping.
- [promptpirate-x/renpy2godot-converter](https://github.com/promptpirate-x/renpy2godot-converter)
  — Ren'Py→Godot; Brücke von narrativer zu räumlicher Realisierung.
- [Br0tcraft/Scratch2Godot](https://github.com/Br0tcraft/Scratch2Godot) —
  visuelle Blocklogik→Godot; FIR-Referenz.

### P1

- [xarray/UnityToOSG](https://github.com/xarray/UnityToOSG) — Unity-Szene→OpenSceneGraph.
- [primaryobjects/unity-to-aframe](https://github.com/primaryobjects/unity-to-aframe)
  — Unity-Szene→A-Frame/WebXR.
- [Haynster/Godot-to-DS](https://github.com/Haynster/Godot-to-DS) — Godot→Nintendo
  DS; extremer Capability-/Degrade-Test.
- [DexrrnZacAttack/Mine2GD](https://github.com/DexrrnZacAttack/Mine2GD) —
  Minecraft-Classic-Welt→Godot-TSCN.
- [mister91jiao/ConverTuanjieToUnity](https://github.com/mister91jiao/ConverTuanjieToUnity)
  — Tuanjie→Unity; erst technischen Scope prüfen.

---

## 3. Neutrale Szenen-, Daten- und Engine-Idiome

### P0

- [phosxd/Any-JSON](https://github.com/phosxd/Any-JSON) — Godot-Daten↔JSON.
- [saperio/tscn2json](https://github.com/saperio/tscn2json) — Godot-TSCN→JSON;
  Szenengraph für Agenten und EIR lesbar machen.
- [applejag/Newtonsoft.Json-for-Unity.Converters](https://github.com/applejag/Newtonsoft.Json-for-Unity.Converters)
  — Unity-Typen wie Vector, Color und Quaternion sauber serialisieren.
- [Zylann/godot_scene_code_converter](https://github.com/Zylann/godot_scene_code_converter)
  — Godot-Szenenast→C++-Realisierung.

### P1

- [Team-Tototototoro/UnityCSV2SO](https://github.com/Team-Tototototoro/UnityCSV2SO)
  — CSV→Unity ScriptableObjects.
- [Benzino/ExcelToJsonConverter](https://github.com/Benzino/ExcelToJsonConverter)
  — Excel→JSON in Unity.
- [June12138/ue-excel-converter](https://github.com/June12138/ue-excel-converter)
  — Excel→Unreal Data Tables.
- [rayxuln/Config-Table-Plugin](https://github.com/rayxuln/Config-Table-Plugin)
  — Excel→GDScript.
- [jeremy-mccarty/unreal-loc-tool](https://github.com/jeremy-mccarty/unreal-loc-tool)
  — CSV↔Unreal `.po`, relevant für MANIFOLD-geprüfte Lokalisierung.
- [Wiechciu/csv-to-gettext-converter](https://github.com/Wiechciu/csv-to-gettext-converter)
  — CSV→gettext für Godot.
- [mar-wir/dict_tools_godot](https://github.com/mar-wir/dict_tools_godot) —
  verschachtelte Dictionaries/CSV.
- [pietrum/godot-binary-serialization](https://github.com/pietrum/godot-binary-serialization)
  — Godot Variant Binary State.
- [Unity-Technologies/unityscript2csharp](https://github.com/Unity-Technologies/unityscript2csharp)
  — alte UnityScript-Bestände nach C# heben.

---

## 4. Shader, Materialien und Field-first

### P0

- [ShiyumeMeguri/Ruri.ShaderDecompiler](https://github.com/ShiyumeMeguri/Ruri.ShaderDecompiler)
  — universeller Shader-Decompiler-Kandidat für Unity/Unreal und DXBC;
  strategisch wichtig für SIR.
- [smkplus/ShaderMan](https://github.com/smkplus/ShaderMan) — ShaderToy→Unity
  HLSL/CG; etablierte Übersetzungsmuster.
- [dfranx/GodotShaderTranscompiler](https://github.com/dfranx/GodotShaderTranscompiler)
  — Godot Shader→GLSL.
- [radial-hks/uetx](https://github.com/radial-hks/uetx) — HLSL-Templates→Unreal
  Materialgraph-Snippets, CLI-freundlich.
- [EmmetOT/IsoMesh](https://github.com/EmmetOT/IsoMesh) — Mesh/Voxel/SDF/
  Isosurface-Werkzeuge; Kernkandidat für field-first.
- [aman-tiwari/MeshToSDF](https://github.com/aman-tiwari/MeshToSDF) — Mesh→SDF
  für Unity VFX Graph.

### P1

- [Shaderboy/ShaderToyToUnity](https://github.com/Shaderboy/ShaderToyToUnity)
  — alternative ShaderToy→Unity-Route.
- [marcozakaria/Unity-Shaders-from-Shader-Toy](https://github.com/marcozakaria/Unity-Shaders-from-Shader-Toy)
  — Vergleichskorpus manueller Übersetzungen.
- [Dimev/shadertoy-to-unreal-engine](https://github.com/Dimev/shadertoy-to-unreal-engine)
  — ShaderToy→Unreal.
- [XanderXu/RealityShaderExtension](https://github.com/XanderXu/RealityShaderExtension)
  — Unity-Shadergraph-Konzepte in RealityKit; Mappingreferenz.
- [HectorShin/TextureConverterTool](https://github.com/HectorShin/TextureConverterTool)
  — Unreal-PBR-Texturen→ORM.
- [Pseudopode/UnityPBRStandardRoughnessConvert](https://github.com/Pseudopode/UnityPBRStandardRoughnessConvert)
  — Smoothness↔Roughness-Normalisierung.
- [TLabAltoh/Unity-SDF-UI-Toolkit](https://github.com/TLabAltoh/Unity-SDF-UI-Toolkit)
  — SDF-basierte UI-Projektion.
- [dev-n-it/blender-volume-mri](https://github.com/dev-n-it/blender-volume-mri)
  — Mesh→Volumen/3D-Textur via Blender/Godot.

---

## 5. 2D ↔ 3D, Sprite, Voxel und Baking

### P0

- [LudiDorici/scene2sprite](https://github.com/LudiDorici/scene2sprite) —
  animierte Godot-Szene→PNG-Sprites.
- [MeanLight-Studio/ToPixel](https://github.com/MeanLight-Studio/ToPixel) —
  Godot-Animation→Pixel-Art-Ausgabe.
- [jantepya/Unity-Sprite-Voxelizer](https://github.com/jantepya/Unity-Sprite-Voxelizer)
  — Sprite→3D-Voxelmesh.
- [narredey/godot-3D-tilemaps](https://github.com/narredey/godot-3D-tilemaps)
  — Tilemap→3D-Struktur.
- [Supercoolkayy/voxbridge](https://github.com/Supercoolkayy/voxbridge) —
  VoxEdit glTF/GLB→enginefertige Voxelassets.
- [unitycoder/PointCloudConverter](https://github.com/unitycoder/PointCloudConverter)
  — Point-Cloud-Konverter mit CLI und Unity-Anbindung.

### P1

- [poohcom1/godot-animated-sprite-2-player](https://github.com/poohcom1/godot-animated-sprite-2-player)
  — SpriteFrames→AnimationPlayer.
- [Magodra/SceneToMeshConverter](https://github.com/Magodra/SceneToMeshConverter)
  — hierarchische Godot-Szene→Mesh-Struktur.
- [StrayEddy/GodotPlugin-CSGToMeshInstance](https://github.com/StrayEddy/GodotPlugin-CSGToMeshInstance)
  und [KoB-Kirito/csg_converter](https://github.com/KoB-Kirito/csg_converter)
  — CSG→exportierbares Mesh.
- [folt-a/godot4-rpgmaker-tile-converter](https://github.com/folt-a/godot4-rpgmaker-tile-converter),
  [jumpravs/autotile-converter](https://github.com/jumpravs/autotile-converter)
  und [newold3/AutotileEditor](https://github.com/newold3/AutotileEditor) —
  RPG-Maker-Tileformate→Godot; später besten Kandidaten auswählen.
- [Pocku/godot-sparrowatlas-editor](https://github.com/Pocku/godot-sparrowatlas-editor)
  — Flash/Sparrow-Atlas→Godot-Animation.
- [MrEliptik/godot_video_to_animated_texture](https://github.com/MrEliptik/godot_video_to_animated_texture)
  und [Crystalwarrior/Gif-To-Godot](https://github.com/Crystalwarrior/Gif-To-Godot)
  — Video/GIF→animierte Godot-Ressourcen.
- [BastiaanOlij/skybox_to_panorama](https://github.com/BastiaanOlij/skybox_to_panorama)
  und [marcosbitetti/godot_skybox_converter_plugin](https://github.com/marcosbitetti/godot_skybox_converter_plugin)
  — Skybox/Cubemap/Panorama-Transformationen.

---

## 6. Rigs und Animation

### P0

- [AlexLemminG/Rigify-To-Unity](https://github.com/AlexLemminG/Rigify-To-Unity)
  — Blender Rigify→Unity Humanoid.
- [m-danya/godot-mixamo-glb-generator](https://github.com/m-danya/godot-mixamo-glb-generator)
  — Mixamo→Godot-GLB.
- [geowarin/godot-anim-lib-export](https://github.com/geowarin/godot-anim-lib-export)
  — Mixamo→Godot AnimationLibrary.
- [Dharengo/Spriter2UnityDX](https://github.com/Dharengo/Spriter2UnityDX)
  — Spriter SCML→Unity Prefabs/Animationen.
- [zhouzhanglin/Bones2D](https://github.com/zhouzhanglin/Bones2D) — Spine/
  DragonBones→Unity-Animationen.

### P1

- [malaybaku/AnimationClipToVrmaSample](https://github.com/malaybaku/AnimationClipToVrmaSample)
  — Unity AnimationClip→VRMA.
- [Arnklit/godot-anim-track-converter](https://github.com/Arnklit/godot-anim-track-converter)
  — reguläre Animationtracks→Bezier-Tracks.
- [keijiro/CMUMocap](https://github.com/keijiro/CMUMocap) — Testkorpus für
  Humanoid-Retargeting.
- [BrandonBartram98/MediaPipe-UnitySolver](https://github.com/BrandonBartram98/MediaPipe-UnitySolver)
  — MediaPipe-Bewegung→Unity-Kinematik.

---

## 7. Terrain, Geodaten und Raum

### P0

- [jinsek/MightyTerrainMesh](https://github.com/jinsek/MightyTerrainMesh) —
  Unity Terrain→Mesh/Daten; Terrain aus Enginekäfig lösen.
- [fhagerstrom/ue-geodata-landscape-plugin](https://github.com/fhagerstrom/ue-geodata-landscape-plugin)
  — LiDAR/GeoTIFF→Unreal Landscape.
- [gkjohnson/coordinate-frame-converter](https://github.com/gkjohnson/coordinate-frame-converter)
  — Koordinatenrahmen, Rotationen und Euler-Konventionen.

### P1

- [MichaelTaylor3d/UnityGPSConverter](https://github.com/MichaelTaylor3d/UnityGPSConverter)
  — GPS↔Unity-Koordinaten.
- [DimaShevchenkoo/EditorGeoLocation](https://github.com/DimaShevchenkoo/EditorGeoLocation)
  — Geo↔Unreal-Koordinaten.
- [blake-tisbury/TifftoUE4Map](https://github.com/blake-tisbury/TifftoUE4Map)
  — Heightmapdaten→Unreal-Importbild.

---

## 8. UI, Web und Designsysteme

### P0

- [fake-skate/html2uikit](https://github.com/fake-skate/html2uikit) — HTML/CSS→Unity
  UI Toolkit.
- [kuma-gee/godot-css-theme](https://github.com/kuma-gee/godot-css-theme) —
  CSS→Godot Theme.
- [Inbestigator/godact](https://github.com/Inbestigator/godact) — React-Komponenten→Godot-Szenen.
- [folt-a/psd_to_layer_scene](https://github.com/folt-a/psd_to_layer_scene) —
  PSD-Ebenen→Godot-Szene.
- [wellingfeng/pencil2umg](https://github.com/wellingfeng/pencil2umg) —
  Pencil-Designtree→Unreal UMG JSON.

### P1

- [ruxailab/figma-vr-unity-converter](https://github.com/ruxailab/figma-vr-unity-converter)
  — Figma-VR→Unity.
- [glegoo/ngui-cocos-Creator-convertor](https://github.com/glegoo/ngui-cocos-Creator-convertor)
  — Unity NGUI→Cocos Creator.
- [InitialPrefabs/UGUIDOTS](https://github.com/InitialPrefabs/UGUIDOTS) —
  UGUI→DOTS-Strukturen.
- [MerlinVR/Unity-MSDF-Fonts](https://github.com/MerlinVR/Unity-MSDF-Fonts)
  — Fonts→MSDF.
- [codewriter-packages/textmeshpro-spriteatlas-support](https://github.com/codewriter-packages/textmeshpro-spriteatlas-support)
  — Unity SpriteAtlas→TMP Sprite Asset.

---

## 9. Audio und nichtvisuelle Projektionen

### P0

- [Zylann/godot_audiopaint](https://github.com/Zylann/godot_audiopaint) —
  Bild→Klang; Forschungsbaustein für audio-first Räume.
- [yasirkula/UnitySpeechToText](https://github.com/yasirkula/UnitySpeechToText)
  — mobile Speech-to-Text-Eingabe.
- [arghyasur1991/Spark-TTS-Unity](https://github.com/arghyasur1991/Spark-TTS-Unity)
  — On-device TTS in Unity.

### P1

- [Louis-GRANGE/PluginUE-Files-Converter-Text-To-Speech](https://github.com/Louis-GRANGE/PluginUE-Files-Converter-Text-To-Speech)
  — Unreal Editor TTS/File-Conversion.
- [CNhbg78/WAV-Converter](https://github.com/CNhbg78/WAV-Converter) —
  Audio→Unreal-kompatibles WAV; wahrscheinlich durch FFmpeg ersetzbar.
- [GamagoRat/godot-video-converter](https://github.com/GamagoRat/godot-video-converter)
  — FFmpeg-Importweg nach Godot.
- [lyy1119/ConvertOggstrCLI](https://github.com/lyy1119/ConvertOggstrCLI)
  — Godot OGG-Stream→gewöhnliches OGG.

---

## 10. Evidence und CUE

- [tt-thammawat/UnrealScreenRecorder](https://github.com/tt-thammawat/UnrealScreenRecorder)
  — Aufnahme von Unreal-Testläufen als Evidence.
- [mashiro-no-rabo/csvchart](https://github.com/mashiro-no-rabo/csvchart) —
  Unreal-Performance-CSV→Diagramm; archiviert, eher Referenz.
- [EnoxSoftware/AVProWithOpenCVForUnityExample](https://github.com/EnoxSoftware/AVProWithOpenCVForUnityExample)
  — Unity-Videoframes→OpenCV-Mat, relevant für automatisierte visuelle Prüfung.

---

## 11. Kommerzielle Werkzeuge

TRIVIUMs Register darf kommerzielle Werkzeuge enthalten. Beispiel aus der
Recherche: ein fertiger Unity→Unreal Converter auf Fab für ungefähr 45 Euro.
Der genaue Produkteintrag, Lizenzumfang, unterstützte Versionen und
Automatisierbarkeit müssen vor Aufnahme verifiziert werden.

Regel:

> Kaufen, verbinden oder selbst bauen wird anhand von Vertragserfüllung,
> Gesamtaufwand, Lizenz und Beweisbarkeit entschieden — nicht anhand von
> Ideologie.

---

## 12. Erste verpflichtende Evaluationsmatrix

Für jeden P0-Kandidaten wird ein Datensatz angelegt:

```yaml
id:
repository:
license:
last_verified:
source_versions:
target_versions:
execution_mode:
headless:
accepts:
produces:
capabilities:
known_losses:
manual_steps:
fixture:
evidence:
confidence:
status: candidate | verified | rejected | superseded
```

Ein Link allein ist kein Tooladapter. Ein Candidate wird erst nach einem
reproduzierbaren Fixture zu `verified`.
