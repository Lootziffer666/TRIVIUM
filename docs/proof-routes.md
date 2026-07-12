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
