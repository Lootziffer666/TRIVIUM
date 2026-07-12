#!/usr/bin/env node
/*!
 * trivium — das CLI des Game Translation Compilers.
 *
 *   node bin/trivium.js <welt.json|welt.js> [optionen]
 *
 *   --target <name[,name…]|all>   Zielsprachen (default: all)
 *   --out <dir>                   Ausgabeverzeichnis (default: ./trivium-out)
 *   --no-strict                   inkonsistente Welten trotzdem übersetzen
 *                                 (Fehler bleiben sichtbar im Report)
 *   --list                        registrierte Adapter zeigen und beenden
 *
 * Eingabe: eine WIR als JSON (validiert durch dieselben Builder wie die
 * JS-API — ein Eingang, eine Wahrheit) oder ein .js-Modul mit build().
 * Ausgabe: pro Ziel ein Ordner mit Artefakten + TRANSLATION_REPORT.md;
 * das Original (<id>.wir.json) reist immer mit.
 *
 * Exit-Codes: 0 ok · 1 Fehler · 2 Übersetzung ok, aber Konzepte in
 * needs_human_review (Enthaltung ist Sicherheit, kein Erfolg).
 */
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const T = require(path.join(ROOT, "packages/trivium-core"));

// Das CLI kennt Adapter — der Kern nicht. Neue Engines hier registrieren.
const BUILTIN_ADAPTERS = ["shaded", "godot", "love2d", "renpy"];

function usage(code) {
  console.log("usage: trivium <welt.json|welt.js> [--target all|name,name] [--out dir] [--no-strict] [--list]");
  process.exit(code);
}

const args = process.argv.slice(2);
const opts = { target: "all", out: "trivium-out", strict: true, list: false };
let input = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--target") opts.target = args[++i];
  else if (a === "--out") opts.out = args[++i];
  else if (a === "--no-strict") opts.strict = false;
  else if (a === "--list") opts.list = true;
  else if (a === "--help" || a === "-h") usage(0);
  else if (!input) input = a;
  else usage(1);
}

const reg = T.createRegistry();
for (const name of BUILTIN_ADAPTERS) {
  reg.register(require(path.join(ROOT, "adapters", name, "adapter")).adapter);
}

if (opts.list) {
  for (const name of reg.list()) {
    const a = reg.get(name);
    console.log(`${name.padEnd(8)} ${a.dialect.padEnd(22)} ${a.engine}`);
  }
  process.exit(0);
}
if (!input) usage(1);

let world;
try {
  const p = path.resolve(input);
  if (p.endsWith(".js")) {
    const mod = require(p);
    if (typeof mod.build !== "function") throw new Error(`${input}: module has no build()`);
    world = mod.build();
  } else {
    world = T.fromJSON(fs.readFileSync(p, "utf8"));
  }
} catch (err) {
  console.error(`trivium: ${err.message}`);
  process.exit(1);
}

const targets = opts.target === "all" ? reg.list() : opts.target.split(",");
let review = false, failed = false;

for (const target of targets) {
  try {
    const res = T.translate(world, target, reg, { strict: opts.strict });
    const dir = path.join(path.resolve(opts.out), world.meta.id, target);
    fs.mkdirSync(dir, { recursive: true });
    for (const a of res.artifacts) {
      const ap = path.join(dir, a.path);
      fs.mkdirSync(path.dirname(ap), { recursive: true });
      fs.writeFileSync(ap, a.content);
    }
    fs.writeFileSync(path.join(dir, "TRANSLATION_REPORT.md"), res.report);
    const s = res.summary;
    console.log(
      `${target.padEnd(8)} fidelity=${String(s.fidelity).padEnd(5)} ` +
      `losses=${s.losses} gains=${s.gains}` +
      (s.needsHumanReview ? `  ⚠ ${res.ledger.review.length} Konzept(e) → needs_human_review` : "")
    );
    if (s.needsHumanReview) review = true;
  } catch (err) {
    failed = true;
    console.error(`${target.padEnd(8)} FAIL: ${err.message}`);
  }
}

if (!failed) console.log(`\nArtefakte + Reports: ${path.join(opts.out, world.meta.id)}/<target>/`);
process.exit(failed ? 1 : review ? 2 : 0);
