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
