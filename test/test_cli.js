"use strict";
// CLI: JSON in, Artefakte raus — und der Round-Trip ist bitidentisch.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CLI = path.join(ROOT, "bin", "trivium.js");
const EXAMPLE = path.join(ROOT, "examples", "dorf-sturmnacht.js");

let n = 0;
function t(name, fn) { fn(); n++; console.log("  ok " + name); }
function run(args, allowFail) {
  try {
    return { out: execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), code: 0 };
  } catch (e) {
    if (!allowFail) throw e;
    return { out: (e.stdout || "") + (e.stderr || ""), code: e.status };
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "trivium-cli-"));

t("--list shows all built-in adapters", () => {
  const { out } = run(["--list"]);
  for (const a of ["shaded", "godot", "love2d", "renpy"]) assert.ok(out.includes(a), a);
});

t("translates a .js world to one target", () => {
  const outDir = path.join(tmp, "run1");
  const { out } = run([EXAMPLE, "--target", "love2d", "--out", outDir]);
  assert.ok(out.includes("love2d"));
  assert.ok(fs.existsSync(path.join(outDir, "dorf-sturmnacht", "love2d", "main.lua")));
  assert.ok(fs.existsSync(path.join(outDir, "dorf-sturmnacht", "love2d", "TRANSLATION_REPORT.md")));
});

t("round-trip: emitted wir.json re-compiles to bit-identical artifacts", () => {
  const a = path.join(tmp, "runA"), b = path.join(tmp, "runB");
  run([EXAMPLE, "--target", "godot", "--out", a]);
  const wirPath = path.join(a, "dorf-sturmnacht", "godot", "dorf-sturmnacht.wir.json");
  run([wirPath, "--target", "godot", "--out", b]);
  for (const f of ["dorf-sturmnacht_world.gd", "dorf-sturmnacht.tscn", "dorf-sturmnacht.wir.json"]) {
    assert.strictEqual(
      fs.readFileSync(path.join(b, "dorf-sturmnacht", "godot", f), "utf8"),
      fs.readFileSync(path.join(a, "dorf-sturmnacht", "godot", f), "utf8"),
      `${f} differs after round-trip`);
  }
});

t("invalid JSON world fails loudly with the builder's law", () => {
  const bad = path.join(tmp, "bad.json");
  fs.writeFileSync(bad, JSON.stringify({
    meta: { id: "bad" },
    rhetoric: { moments: [{ id: "m", intents: { dayNight: 0.5 } }] }, // Engine-Vokabular!
  }));
  const { out, code } = run([bad], true);
  assert.strictEqual(code, 1);
  assert.ok(/unknown intent axis 'dayNight'/.test(out), out);
});

t("inconsistent world: strict refuses (exit 1), --no-strict translates with visible errors", () => {
  const dangling = path.join(tmp, "dangling.json");
  fs.writeFileSync(dangling, JSON.stringify({
    meta: { id: "dang" },
    grammar: { entities: [{ id: "a", kind: "place" }], relations: [{ id: "r", type: "knows", from: "a", to: "ghost" }] },
  }));
  const strict = run([dangling, "--target", "love2d", "--out", path.join(tmp, "s1")], true);
  assert.strictEqual(strict.code, 1);
  const loose = run([dangling, "--target", "love2d", "--out", path.join(tmp, "s2"), "--no-strict"], true);
  assert.strictEqual(loose.code, 0, loose.out);
  const report = fs.readFileSync(path.join(tmp, "s2", "dang", "love2d", "TRANSLATION_REPORT.md"), "utf8");
  assert.ok(report.includes("REL_DANGLING"));
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`test_cli: ${n} passed`);
