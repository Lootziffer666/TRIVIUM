# WIR-Spezifikation — World Intermediate Representation v1.0.0

Die WIR ist die engine-agnostische Bedeutung einer Spielwelt. Drei Strata,
kein Engine-Vokabular. Builder-API in `packages/trivium-core/src/wir.js`.

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
    state:    [{ id, scope, key, initial, visibility }],   // scope: 'world' | entityId
    rules:    [{ id, when:{trigger, conditions[]}, then[], onFail[], priority, exclusiveGroup }],
    machines: [{ id, entity, states[], initial, transitions[{from,to,on}] }],
    memories: [{ id, records, surfaces }]
  }
}
```

## Grammatik

- `kind` ∈ `place | character | thing | zone | evidence` (`ENTITY_KINDS`).
- `type` ∈ `contains | adjacent | owns | knows | blocks | reveals | remembers |
  desires | fears` (`RELATION_TYPES`). Räumliche UND soziale Bindungen sind
  Grammatik — Bindings before tokens (Manifold P1).
- `anchors` verorten Entities in einem normierten 0..1-Raum; Adapter skalieren
  auf ihre Koordinatensysteme.

## Rhetorik

Intent-Achsen sind ein **geschlossener Kanon** (`INTENT_AXES`): neue
Bedeutungen werden dort ergänzt, nie ad hoc erfunden (Builder wirft sonst).
Aktuelle Achsen, alle 0..1:

`timeOfDay, turbulence, precipitation, wetness, visibility, wind,
warmthLight, decay, coldness, seasonAutumn, seasonBloom, tension, intimacy`

Achsen sind Bedeutungen, keine Parameter. Beispiel: `precipitation` +
`coldness` entscheidet ERST IM ADAPTER, ob Regen oder Schnee gesprochen wird.
Das spiegelt SHADEDs Invariante 6 (High-Level-Parameter statt
Effekt-Schalter) auf der Bedeutungsebene.

## Logik (adult_game-Schichtung)

- `when.trigger` — Context/Timing-Schicht: was versucht wird / geschieht.
- `when.conditions` — Hidden-Relational-Schicht: Gates auf State
  (`{state, gte|lte|eq}`) oder Momente (`{moment}`).
- `then` — World-Reaction-Schicht: Effekte
  (`{set, to|add}`, `{moment}`, `{params}`, `{hint}`).
- `onFail` — Hint/Memory-Schicht: **ein Fehlversuch muss lehren.** Gated
  Rules ohne `onFail` sind ein `CHORE_LOOP_RISK`-Warning der Kohärenz-Engine.
- `exclusiveGroup` + `priority`: pro Trigger feuert je Gruppe nur die
  höchstpriore erfolgreiche Regel; gleiche Priorität in gleicher Gruppe am
  gleichen Trigger ist ein Konsistenz-FEHLER („die Welt kann sich nicht
  entscheiden").

## Konzepte (Routing-Einheiten)

`conceptsOf(world)` flacht die WIR zu Konzepten ab — TRIVIUMs
Kommunikationsakte. Routing-Entscheidungen hängen an Konzepten, nie an
rohen JSON-Schlüsseln. Kind-Schema:

```
grammar.entity.<kind>      grammar.relation.<type>   grammar.space.<dims>
rhetoric.moment            rhetoric.intent.<axis>    rhetoric.arc
logic.state.<visibility>   logic.rule                logic.machine   logic.memory
```

Adapter-Manifeste matchen exakt oder per `*`-Präfix (längster Präfix
gewinnt); ohne Match routet das Konzept `unknown` → Enthaltung.
