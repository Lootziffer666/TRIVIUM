# LAB — Legacy Adventure Bridge

LAB is TRIVIUM's cross-repository module for reconstructing an authorized legacy adventure as a semantic, inspectable pipeline instead of pretending that extraction output is original source code.

```text
owned source
→ DECOMPILE evidence
→ TRIVIUM meaning/contracts
→ WIZARD asset bindings
→ SWIFT actor realization
→ SHADED scene runtime
```

BELLOWS is the mandatory gateway for every LLM/provider call made by the pipeline. LAB stores only the environment-variable names needed to reach BELLOWS; it never writes the local API key into a bundle.

```text
BELLOWS_BASE_URL  e.g. http://<phone-or-host-ip>:8080
BELLOWS_API_KEY   Bellows local bearer key
BELLOWS_MODEL     model name Bellows should route
```

Deterministic local runtimes are not forced through a chat API. In particular, SWIFT's optional `rembg` + ONNX background removal remains local CPU/RAM processing. BELLOWS handles interpretation and provider routing; ONNX handles image segmentation.

## Vision through BELLOWS

ANVIL-BELLOWS supports the OpenAI-compatible multimodal message contract: text-only messages keep string `content`, while vision messages use a content-parts array containing `text` and `image_url`.

`packages/trivium-lab/bellows-client.js` validates both forms and provides helpers for vision requests. Local image files are converted to data URLs only at execution time. The resulting inline bytes must never be serialized into LAB bundles, handoffs, source manifests, or evidence ledgers.

The wire contract being available does not guarantee that the selected `BELLOWS_MODEL` can see images. BELLOWS remains responsible for routing to a vision-capable model/provider.

## What was retained from the prototypes

- asset/archive intake and visible progress become a DECOMPILE evidence job;
- video-to-sheet, smart crop and pixel normalization become SWIFT jobs;
- live image/sprite injection becomes a SHADED runtime adapter;
- shader/world-state experiments become explicit SHADED parameters, not fabricated image analysis;
- the multi-repository orchestrator becomes a versioned handoff bundle that ANVIL can execute.

The Vid2Sheet launcher and installer behavior are third-party source material supplied for analysis. They are not authored by the LAB/SWIFT owner and are not copied into the module. Only capabilities independently implemented or wired into SWIFT may be advertised as SWIFT capabilities.

## What was deliberately rejected

- simulated extraction lists;
- fake DLL/registry patch success;
- random matrices labelled as image-derived physics;
- placeholder SVG parsing presented as a real SDF compiler;
- hidden guessing when original behavior cannot be recovered;
- direct provider calls that bypass BELLOWS.

## Source manifests

`source.manifestPath` may point to a local evidence manifest containing filenames, sizes, hashes, roles and exclusions. Original game files, firmware ROMs and user save files remain external inputs. They must never be committed or packed into LAB.

For SCUMM v5-era data, DECOMPILE includes a deterministic probe that validates the XOR-obfuscated chunk graph and inventories rooms, objects, scripts, sounds, costumes and charsets before semantic reconstruction begins.

## CLI

```bash
node bin/trivium-lab.js examples/lab-request.example.json --out lab-out/demo --json
```

LAB writes one TRIVIUM plan and five repository-specific request envelopes. It does not clone repositories, inject patches, bypass ownership checks, or redistribute source assets. Deployment remains ANVIL/MYTHIC territory.

## Invariants

1. DECOMPILE emits observations plus confidence, not reconstructed truth.
2. TRIVIUM owns semantic reconstruction and the loss/gain ledger.
3. WIZARD resolves roles and missing assets; it does not reinterpret game rules.
4. SWIFT creates presentation artifacts and reports unwired preprocessing honestly.
5. SHADED owns material truth and visual world-state; actors never mutate its classification grid.
6. Every LLM/provider call goes through BELLOWS.
7. Local deterministic processing such as `rembg`/ONNX remains local and does not upload images.
8. Vision calls use BELLOWS `text`/`image_url` content parts; inline image bytes exist only during execution.
