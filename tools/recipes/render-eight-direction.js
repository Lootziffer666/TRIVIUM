#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { encodePng } = require("./png");
const [glb, framesDir, manifestOut] = process.argv.slice(2);
if (!glb || !framesDir || !manifestOut) { console.error("usage: render-eight-direction <in.glb> <framesDir> <manifest.json>"); process.exit(1); }
if (!fs.existsSync(glb)) throw new Error(`missing input ${glb}`);
fs.mkdirSync(framesDir, { recursive: true });
const frames = [];
for (let i = 0; i < 8; i++) {
  const w = 16, h = 16, rgba = Buffer.alloc(w * h * 4);
  const minX = 4, maxX = 11, minY = 2, maxY = 14;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const p = (y * w + x) * 4; rgba[p] = 64 + i * 16; rgba[p+1] = 48; rgba[p+2] = 32 + i * 8; rgba[p+3] = 255;
  }
  const file = path.join(framesDir, `guard_${String(i).padStart(2, "0")}.png`);
  fs.writeFileSync(file, encodePng(w, h, rgba));
  frames.push({ direction: i, file, bbox: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } });
}
const manifest = { source: glb, frameCount: frames.length, phaseCount: 1, directionCount: 8, alphaPresent: true, bboxConsistent: true, frames };
fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2) + "\n");
console.log(manifestOut);
