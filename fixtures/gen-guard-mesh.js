#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
const obj = `# TRIVIUM CC0 low-poly guard fixture\n# Deterministic procedural mesh: prism body + head marker\no guard_low_poly\nv -0.25 0 -0.15\nv 0.25 0 -0.15\nv 0.25 0 0.15\nv -0.25 0 0.15\nv -0.20 1.25 -0.12\nv 0.20 1.25 -0.12\nv 0.20 1.25 0.12\nv -0.20 1.25 0.12\nv -0.15 1.55 -0.10\nv 0.15 1.55 -0.10\nv 0.15 1.55 0.10\nv -0.15 1.55 0.10\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 4 8 5 1\nf 9 10 11 12\nf 5 9 12 8\nf 6 7 11 10\n`;
fs.writeFileSync(path.join(outDir, "guard.obj"), obj);
fs.writeFileSync(path.join(outDir, "guard.ppm"), "P3\n1 1\n255\n96 72 48\n");
console.log(path.join(outDir, "guard.obj"));
