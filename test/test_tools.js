"use strict";
// Tool Candidate Registry: manifests, dedupe, format warnings, and queries.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const C = require("../packages/trivium-contracts");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }

const ROOT = path.join(__dirname, "..");
const TOOLS = path.join(ROOT, "registry", "tools");

function manifest(id, extra = {}) {
  return {
    contractVersion: "0.1.0",
    id,
    kind: "tool",
    source: { type: "github", provenance: "test", license: "unknown" },
    repository: `https://example.test/${id}`,
    license: "unknown",
    last_verified: "2026-07-12",
    source_versions: ["unknown"],
    target_versions: ["unknown"],
    execution_mode: "unknown",
    headless: "unknown",
    execution: { mode: "unknown", headless: "unknown" },
    accepts: ["gltf"],
    produces: ["glb"],
    capabilities: ["convert"],
    unknown: ["fixture"],
    known_losses: ["unknown until verified"],
    manual_steps: ["review"],
    fixture: null,
    evidence: null,
    confidence: 0.2,
    status: "candidate",
    ...extra,
  };
}
function tempRegistry(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trivium-tools-"));
  fs.writeFileSync(path.join(dir, "formats.md"), "- `gltf`\n- `glb`\n- `json`\n");
  const tools = path.join(dir, "tools");
  fs.mkdirSync(tools);
  for (const [name, doc] of Object.entries(files)) fs.writeFileSync(path.join(tools, name), JSON.stringify(doc, null, 2));
  return { dir, tools, formats: path.join(dir, "formats.md") };
}

t("registry loads all P0 candidates", () => {
  const registry = C.loadToolRegistry(TOOLS, { formatsPath: path.join(ROOT, "registry", "formats.md") });
  assert.ok(registry.size >= 35);
  assert.strictEqual(registry.warnings.length, 0);
});

t("registry contains only candidate tools without evidence claims", () => {
  const registry = C.loadToolRegistry(TOOLS, { formatsPath: path.join(ROOT, "registry", "formats.md") });
  for (const tool of registry.values()) {
    assert.strictEqual(tool.status, "candidate");
    assert.strictEqual(tool.evidence, null);
    assert.ok(tool.confidence <= 0.3);
  }
});

t("toolsAccepting filters by input format", () => {
  const registry = C.loadToolRegistry(TOOLS, { formatsPath: path.join(ROOT, "registry", "formats.md") });
  assert.ok(C.toolsAccepting(registry, "unity.project").some((tool) => tool.id === "anthogonyst-unitytogodot"));
});

t("toolsProducing filters by output format", () => {
  const registry = C.loadToolRegistry(TOOLS, { formatsPath: path.join(ROOT, "registry", "formats.md") });
  assert.ok(C.toolsProducing(registry, "png.frames").some((tool) => tool.id === "ludidorici-scene2sprite"));
});

t("duplicate tool ids throw", () => {
  const tmp = tempRegistry({ "a.tool.json": manifest("dup"), "b.tool.json": manifest("dup") });
  assert.throws(() => C.loadToolRegistry(tmp.tools, { formatsPath: tmp.formats }), /duplicate id/);
});

t("invalid manifest throws with matrix-field error", () => {
  const tmp = tempRegistry({ "broken.tool.json": { ...manifest("broken"), confidence: 2 } });
  assert.throws(() => C.loadToolRegistry(tmp.tools, { formatsPath: tmp.formats }), /confidence/);
});

t("unknown format tokens warn but do not throw", () => {
  const tmp = tempRegistry({ "warn.tool.json": manifest("warn", { accepts: ["mystery.format"] }) });
  const registry = C.loadToolRegistry(tmp.tools, { formatsPath: tmp.formats });
  assert.strictEqual(registry.size, 1);
  assert.ok(registry.warnings.some((w) => w.includes("mystery.format")));
});

t("verified tool manifests require evidence", () => {
  const tmp = tempRegistry({ "verified.tool.json": manifest("verified", { status: "verified" }) });
  assert.throws(() => C.loadToolRegistry(tmp.tools, { formatsPath: tmp.formats }), /verified.*evidence/);
});

console.log(`test_tools: ${n} passed`);
