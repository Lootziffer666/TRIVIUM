# TRIVIUM ↔ LAB

The canonical Legacy Adventure Bridge now lives in [`Lootziffer666/LAB`](https://github.com/Lootziffer666/LAB).

TRIVIUM no longer owns the LAB planner, CLI, BELLOWS client, request examples or cross-repository bundle writer. TRIVIUM owns only the semantic reconstruction stage:

```text
DECOMPILE evidence
→ TRIVIUM World IR + realization contracts + loss/gain ledger
→ WIZARD / SWIFT / SHADED
```

## Adapter

`packages/lab-adapter/index.js` validates the `reconstruct-semantic-world` handoff and TRIVIUM-compatible reconstruction plan.

The v1 wire identifier remains `trivium-lab` for compatibility with the already integrated DECOMPILE, WIZARD, SWIFT and SHADED adapters. Repository ownership and wire protocol naming are deliberately separate.

## TRIVIUM responsibilities

- interpret evidence without presenting inference as recovered truth;
- preserve uncertainty from DECOMPILE;
- produce World IR, realization contracts, loss/gain ledger and asset needs;
- use BELLOWS for every model/provider call;
- never persist provider keys or inline vision bytes;
- leave extraction, asset matching, actor realization and scene runtime to their specialist repositories.

## Not owned here

- LAB request normalization and bundle generation;
- the LAB command-line interface;
- BELLOWS text/vision transport helpers;
- source manifests and generic LAB examples;
- ANVIL execution, retries and completion tracking.

This separation prevents TRIVIUM from becoming a second orchestration root and keeps LAB independently usable by the whole tool ecosystem.
