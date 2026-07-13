# TRIVIUM Proof Routes

## C1 — 3D Asset → normalized engine-importable artifact

**Status:** Implemented as dependency-free proof route. The documented Unity→Unreal
variant is intentionally deferred until a human provides a license-cleared Unity
fixture. C1 proves the route mechanism with a small CC0 procedural guard mesh.

### Source and contract

- Source generator: `fixtures/gen-guard-mesh.js`
- Generated source artifact: `fixtures/out/guard.obj`
- Asset Contract: `examples/contracts/actor.guard.asset.contract.json`

### Plan

- TIR plan: `examples/plans/guard-obj-normalize.plan.json`
- Route: `normalize`
- Tool: `trivium.obj-normalize` (`tools/recipes/obj-normalize.js`)
- Outputs:
  - `fixtures/out/guard.normalized.glb`
  - `fixtures/out/guard.normalize.report.json`

### Evidence

- Evidence Contract: `examples/contracts/verify.guard.obj-normalize.evidence.contract.json`
- Checks prove file existence, normalized pivot-at-ground metadata, bounding-box
  height, and ledger route count for `normalize`.

### Manual remainder

This route does **not** prove production-grade material, rig, animation, or
native engine importer fidelity. It proves the dependency-free mechanism:
Contract → Plan → Execution → Ledger → Evidence.

## C2 — normalized 3D guard → 8-direction sprite atlas

**Status:** Implemented as dependency-free proof route. Blender rendering remains
the production target, but the committed Node fixture proves the bake/project
mechanism without external DCC tools.

### Source and contract

- Source artifact: `fixtures/out/guard.normalized.glb` from C1
- Asset Contract: `examples/contracts/actor.guard.asset.contract.json`

### Plan

- TIR plan: `examples/plans/guard-sprite-bake.plan.json`
- Routes: `bake` and `project`
- Tools:
  - `trivium.render-eight-direction` (`tools/recipes/render-eight-direction.js`)
  - `trivium.atlas-pack` (`tools/recipes/atlas-pack.js`)
  - `trivium.godot-sprite-resource` (`tools/recipes/godot-sprite-resource.js`)
- Outputs:
  - `fixtures/out/frames/*.png`
  - `fixtures/out/guard.atlas.png`
  - `fixtures/out/guard.atlas.json`
  - `fixtures/out/guard.tres`
  - `fixtures/out/guard.sprite.report.json`

### Evidence

- Evidence Contract: `examples/contracts/verify.guard.sprite-bake.evidence.contract.json`
- Checks prove atlas/resource/report existence, eight frames, alpha metadata,
  bounding-box consistency, and ledger route counts for `bake` and `project`.

### Manual remainder

True silhouette similarity scoring is still research/manual review. The current
automated proof verifies non-empty, consistently bounded directional silhouettes
and explicit losses/gains in the ledger.

## C3 — Engine scene recovery and alternate projection

C3 exercises the reverse direction: an engine-facing scene artifact is lifted into a neutral description before being projected elsewhere.

### C3a: SHADED storyboard → WIR → Ren'Py

- Source fixture: `fixtures/shaded/sturmnacht.storyboard.json`.
- Plan: `examples/plans/shaded-storyboard-to-renpy.plan.json`.
- Contract: `examples/contracts/scene.shaded-import.scene.contract.json`.
- Evidence: `examples/contracts/verify.shaded-to-renpy.evidence.contract.json`.
- Tools: `trivium.shaded-storyboard-import` reconstructs WIR through the existing SHADED importer; `trivium.wir-to-renpy` projects the recovered WIR to a Ren'Py script.

The importer intentionally preserves SHADED-only parameters such as `flash` as documented import losses. A passing route must therefore prove both that WIR and Ren'Py artifacts exist and that the import dossier still records the engine-only residue.

### C3b: Godot `.tscn` fragment → EIR/WIR with review debt

- Source fixture: `fixtures/godot/five-node-scene.tscn`.
- Plan: `examples/plans/godot-tscn-fragment-to-wir.plan.json`.
- Contract: `examples/contracts/scene.godot-tscn-fragment.scene.contract.json`.
- Evidence: `examples/contracts/verify.godot-tscn-fragment.evidence.contract.json`.
- Tool: `trivium.tscn-fragment-reader` reads only dependency-free node headers and emits an EIR fragment plus a WIR scene fragment.

This is not a full Godot parser. Known node types (`Node2D`, `Area2D`, `CharacterBody2D`) are mapped into WIR entities; unsupported nodes (`CollisionShape2D`, `GPUParticles2D` in the fixture) are routed to `needs_human_review`. For C3, a zero-review recovery is suspicious rather than successful.
