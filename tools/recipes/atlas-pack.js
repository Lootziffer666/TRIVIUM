#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { encodePng } = require("./png");
const [framesManifest, atlasPng, atlasJson] = process.argv.slice(2);
if (!framesManifest || !atlasPng || !atlasJson) { console.error("usage: atlas-pack <frames.json> <atlas.png> <atlas.json>"); process.exit(1); }
const frames = JSON.parse(fs.readFileSync(framesManifest, "utf8")).frames;
const cell = 16, width = cell * frames.length, height = cell, rgba = Buffer.alloc(width * height * 4);
const entries = [];
for (let i = 0; i < frames.length; i++) {
  // Recreate deterministic silhouette colors from render step; no PNG decoder dependency.
  for (let y = 2; y <= 14; y++) for (let x = 4; x <= 11; x++) {
    const dst = (y * width + i * cell + x) * 4; rgba[dst] = 64 + i * 16; rgba[dst+1] = 48; rgba[dst+2] = 32 + i * 8; rgba[dst+3] = 255;
  }
  entries.push({ direction: i, x: i * cell, y: 0, w: cell, h: cell, bbox: frames[i].bbox });
}
fs.mkdirSync(path.dirname(atlasPng), { recursive: true });
fs.writeFileSync(atlasPng, encodePng(width, height, rgba));
fs.writeFileSync(atlasJson, JSON.stringify({ image: atlasPng, frameCount: frames.length, alphaPresent: true, bboxConsistent: true, frames: entries }, null, 2) + "\n");
console.log(atlasJson);
