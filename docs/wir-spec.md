# WIR-Spezifikation — World Intermediate Representation v1.0.0

Die WIR ist die engine-agnostische Bedeutung einer Spielwelt. Drei Strata,
kein Engine-Vokabular. Builder-API in `packages/trivium-core/src/wir.js`.

**Wichtig:** Die folgenden Kernfelder sind implementiert. Asset-, Function-,
Perception-, Scene- und Tool-Contracts sind angrenzende Repräsentationen und
werden nicht still in WIR v1.0.0 hineinerfunden. Sie sind in
`realization-contracts.md` spezifiziert und werden versioniert angebunden.

```js
{
  wirVersion: "1.0.0",
  meta: { id, title, description, dims },     // dims: '2d' | '2.5d' | '3d' (Hinweis, kein Gesetz)

  grammar: {
    entities:  [{ id, kind, name, tags[], props{} }],
    relations: [{ id, type, from, to, props{} }],
    spaces:    [{ id, dims, topology, anchors{ entityId: {x,y[,z]} } }]  // 0..1-Raum
  },

  rhetoric: {
    moments: [{ id, label, intents{ axis: 0..1 }, durationSec }],
    arc:     [momentId, ...]
  },

  logic: {
    state:    [{ id, scope, key, initial, visibility }],
    rules:    [{ id, when:{trigger, conditions[]}, then[], onFail[], priority, exclusiveGroup }],
    machines: [{ id, entity, states[], initial, transitions[{from,to,on}] }],
    memories: [{ id, records, surfaces }]
  }
}
```

## 1. Grammatik

- `kind` ∈ `place | character | thing | zone | evidence` (`ENTITY_KINDS`).
- `type` ∈ `contains | adjacent | owns | knows | blocks | reveals | remembers |
  desires | fears` (`RELATION_TYPES`).
- Räumliche und soziale Bindungen sind Grammatik: **bindings before tokens**.
- `anchors` verorten Entities in einem normierten 0..1-Raum; Adapter skalieren
  auf ihre Koordinatensysteme.
- Enginekonstrukte wie GameObject, AActor, Node, Collider oder Blueprint sind
  keine WIR-Grammatik. Sie gehören in EIR oder Zieladapter.

## 2. Rhetorik

Intent-Achsen sind ein geschlossener Kanon (`INTENT_AXES`). Aktuelle Achsen:

`timeOfDay, turbulence, precipitation, wetness, visibility, wind,
warmthLight, decay, coldness, seasonAutumn, seasonBloom, tension, intimacy`

Achsen sind Bedeutungen, keine Parameter. `precipitation` + `coldness`
entscheidet erst im Adapter, ob eine Zielsprache Regen, Schnee, Text,
Geräusch oder eine andere Projektion spricht.

Rhetorik ist nicht auf Grafik beschränkt. Ein später angebundener Perception
Contract kann festlegen, ob ein Intent primär über:

- Bild,
- Geometrie,
- Shader,
- Audio,
- Sprache,
- Haptik,
- Timing

ausgedrückt wird.

## 3. Logik

- `when.trigger` — Context/Timing: was versucht wird oder geschieht.
- `when.conditions` — Hidden Relational State: Gates auf State oder Momente.
- `then` — World Reaction: Effekte.
- `onFail` — Hint/Memory: ein Fehlversuch muss lehren.
- `exclusiveGroup` + `priority` verhindern widersprüchliche Weltreaktionen.

Logik beschreibt Verpflichtungen der Welt. Sie schreibt nicht vor, ob diese in
C#, C++, GDScript, Blueprint, Lua oder einem externen Runtime-Modul umgesetzt
werden.

## 4. Konzepte

`conceptsOf(world)` flacht die WIR zu Routing-Einheiten ab:

```text
grammar.entity.<kind>      grammar.relation.<type>   grammar.space.<dims>
rhetoric.moment            rhetoric.intent.<axis>    rhetoric.arc
logic.state.<visibility>   logic.rule                logic.machine   logic.memory
```

Adapter-Manifeste matchen exakt oder per `*`-Präfix. Ohne Match routet das
Konzept `unknown` und erzeugt Review-Arbeit.

## 5. WIR ist Weltwahrheit, nicht Gesamtcontainer

TRIVIUM v1.1 führt mehrere angrenzende Repräsentationen ein:

- **AIR:** Assetrolle und technische Bestandteile.
- **SIR:** Shader- und Materialbedeutung.
- **EIR:** Engine-Idiome.
- **FIR:** Funktionsverträge und Codebedeutung.
- **PIR:** Wahrnehmung und Lesbarkeit.
- **TIR:** Toolchain-Plan.

Diese Repräsentationen referenzieren WIR-Entities, Regeln, Momente oder States,
statt dieselben Wahrheiten zu duplizieren.

Beispiel:

```yaml
world_ref: grammar.entities.guard
asset_contract_ref: contracts/guard.asset.yaml
function_contract_ref: contracts/guard-interaction.function.yaml
perception_contract_ref: contracts/guard-presence.perception.yaml
```

## 6. Dimension ist Projektion, nicht Identität

`meta.dims` und `space.dims` sind Hinweise auf eine gewünschte oder vorhandene
räumliche Form. Sie verbieten keine andere Realisierung.

Eine 3D-Figur kann als:

- 3D-Mesh,
- 2.5D-Diorama,
- acht Richtungs-Sprites,
- Textrolle,
- Audio-Präsenz

verkörpert werden. Ob dies zulässig ist, entscheidet der Realization Contract,
nicht das `dims`-Feld allein.

## 7. Engine Federation

WIR-State darf zwischen unterschiedlichen Runtimes reisen. Ein Scene Contract
legt Inputs, Outputs, Entry, Exit und Handoff fest. Native Engineobjekte dürfen
nicht Teil des kanonischen Zustands werden.

Geeignet:

```json
{
  "player.health": 72,
  "player.inventory": ["key_red"],
  "world.guard_trust": 0.41,
  "world.bridge_destroyed": true
}
```

Ungeeignet:

```text
Unity GameObject reference
Unreal UObject pointer
Godot Node instance id
```

## 8. Versionierungsregel

- WIR v1.0.0 bleibt lesbar und roundtrip-fähig.
- Neue Contract-Referenzen werden zunächst außerhalb des Kerns geführt.
- Eine WIR-Schemaerweiterung braucht neue Fixtures, Migration und Roundtrip-
  Tests.
- Dokumentation darf geplante Felder nicht als implementiert ausgeben.

## 9. Designregel

> Die WIR sagt, was die Welt ist. Contracts sagen, was eine neue Verkörperung
> bewahren muss. Adapter und Toolchains sagen, wie die Zielgrammatik dies
> realisiert.
