/*!
 * TRIVIUM adapter: LÖVE (love2d)
 *
 * Target language: a minimal Lua framework — no scene tree, no editor,
 * everything is code. Grammar becomes plain tables, rhetoric becomes an
 * interpolated ambience table the draw loop reads, logic ports almost 1:1
 * (Lua speaks rules fluently). LÖVE's honesty: nothing exists until you
 * draw it, so every visual claim is APPROXIMATE until authored.
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

const adapter = {
  name: "love2d",
  engine: "LÖVE 11 — Lua 2D framework, code-only",
  dialect: "2d-immediate-code",

  capabilities: {
    "grammar.entity.*": { route: ROUTES.BRIDGE, via: "entity tables in world.lua", note: "entities are data; rendering them is authored" },
    "grammar.relation.*": { route: ROUTES.BRIDGE, via: "relation list (queryable)" },
    "grammar.space.2d": { route: ROUTES.NATIVE, via: "love.graphics coordinate plane" },
    "grammar.space.2.5d": { route: ROUTES.APPROXIMATE, via: "y-sorted draw order", loss: "no depth buffer; 2.5D is draw-order discipline only" },
    "grammar.space.3d": { route: ROUTES.PRESERVE, loss: "LÖVE is 2D; 3D space carried as data only" },

    "rhetoric.moment": { route: ROUTES.BRIDGE, via: "ambience table + moment(id)" },
    "rhetoric.arc": { route: ROUTES.BRIDGE, via: "arc playback in love.update with lerp blending" },
    "rhetoric.intent.*": {
      route: ROUTES.APPROXIMATE, via: "ambience values 0..1 read by love.draw",
      loss: "the scaffold renders only a tinted sky/ground readout; real weather/particles are authored per project",
    },

    "logic.state.*": { route: ROUTES.NATIVE, via: "world.state table" },
    "logic.rule": { route: ROUTES.NATIVE, via: "world.trigger(name)" },
    "logic.machine": { route: ROUTES.NATIVE, via: "FSM tables" },
    "logic.memory": { route: ROUTES.NATIVE, via: "world.memory + on-screen hint line" },
  },

  gains: [
    "total transparency: the whole translated world is one readable Lua file",
    "runs anywhere LÖVE runs — a zip is a shipped game",
  ],

  realize(world, routed, ledger) {
    const anchors = Object.assign({}, ...world.grammar.spaces.map((s) => s.anchors));
    const L = [];
    L.push(`-- TRIVIUM → LÖVE world for '${world.meta.id}' (generated scaffold).`);
    L.push(`-- The WIR (${world.meta.id}.wir.json) is the source of truth.`);
    L.push(`local world = {}`);
    L.push(``);
    L.push(`-- Grammatik: entities and relations as data`);
    L.push(`world.entities = ${lua(world.grammar.entities.map((e) => ({ id: e.id, kind: e.kind, name: e.name, x: anchors[e.id] && anchors[e.id].x, y: anchors[e.id] && anchors[e.id].y })))}`);
    L.push(`world.relations = ${lua(world.grammar.relations.map((r) => ({ id: r.id, type: r.type, from: r.from, to: r.to })))}`);
    L.push(``);
    L.push(`-- Rhetorik: moments carry meaning axes 0..1; ambience is the live blend`);
    L.push(`world.moments = ${lua(Object.fromEntries(world.rhetoric.moments.map((m) => [m.id, m.intents])))}`);
    L.push(`world.arc = ${lua(world.rhetoric.arc)}`);
    L.push(`world.durations = ${lua(Object.fromEntries(world.rhetoric.moments.map((m) => [m.id, m.durationSec])))}`);
    L.push(`world.ambience = {}`);
    L.push(``);
    L.push(`-- Logik: state, rules (failure still teaches), memory`);
    L.push(`world.state = ${lua(Object.fromEntries(world.logic.state.map((s) => [s.id, s.initial])))}`);
    L.push(`world.rules = ${lua(world.logic.rules.map((r) => ({ id: r.id, trigger: r.when.trigger, conditions: r.when.conditions, effects: r.then, on_fail: r.onFail, priority: r.priority, group: r.exclusiveGroup })))}`);
    L.push(`world.memory = {}`);
    L.push(``);
    L.push(`local function passes(c)`);
    L.push(`  if c.state then`);
    L.push(`    local v = world.state[c.state]`);
    L.push(`    if c.gte and not (v >= c.gte) then return false end`);
    L.push(`    if c.lte and not (v <= c.lte) then return false end`);
    L.push(`    if c.eq ~= nil and v ~= c.eq then return false end`);
    L.push(`  end`);
    L.push(`  return true`);
    L.push(`end`);
    L.push(``);
    L.push(`local function apply(e)`);
    L.push(`  if e.set then world.state[e.set] = e.to or (world.state[e.set] + (e.add or 0)) end`);
    L.push(`  if e.moment then world.moment(e.moment) end`);
    L.push(`  if e.hint then table.insert(world.memory, e.hint) end`);
    L.push(`end`);
    L.push(``);
    L.push(`function world.trigger(name)`);
    L.push(`  local fired, groups = {}, {}`);
    L.push(`  local rs = {}`);
    L.push(`  for _, r in ipairs(world.rules) do if r.trigger == name then rs[#rs + 1] = r end end`);
    L.push(`  table.sort(rs, function(a, b) return a.priority > b.priority end)`);
    L.push(`  for _, r in ipairs(rs) do`);
    L.push(`    if not (r.group and groups[r.group]) then`);
    L.push(`      local ok = true`);
    L.push(`      for _, c in ipairs(r.conditions) do if not passes(c) then ok = false end end`);
    L.push(`      local effects = ok and r.effects or r.on_fail -- failure still teaches`);
    L.push(`      for _, e in ipairs(effects) do apply(e) end`);
    L.push(`      if #effects > 0 then fired[#fired + 1] = { rule = r.id, ok = ok } end`);
    L.push(`      if ok and r.group then groups[r.group] = true end`);
    L.push(`    end`);
    L.push(`  end`);
    L.push(`  return fired`);
    L.push(`end`);
    L.push(``);
    L.push(`local arcIdx, arcT = 0, 0`);
    L.push(`function world.moment(id)`);
    L.push(`  for k, v in pairs(world.moments[id] or {}) do world.ambience[k] = v end`);
    L.push(`end`);
    L.push(``);
    L.push(`function world.play() arcIdx, arcT = 1, 0; if world.arc[1] then world.moment(world.arc[1]) end end`);
    L.push(``);
    L.push(`function world.update(dt)`);
    L.push(`  if arcIdx == 0 or arcIdx > #world.arc then return end`);
    L.push(`  arcT = arcT + dt`);
    L.push(`  local id = world.arc[arcIdx]`);
    L.push(`  if arcT >= (world.durations[id] or 8) then`);
    L.push(`    arcIdx, arcT = arcIdx + 1, 0`);
    L.push(`    if world.arc[arcIdx] then world.moment(world.arc[arcIdx]) end`);
    L.push(`  end`);
    L.push(`end`);
    L.push(``);
    L.push(`-- Minimal readable rendering of the ambience (author real VFX per project)`);
    L.push(`function world.draw()`);
    L.push(`  local a = world.ambience`);
    L.push(`  local night = a.timeOfDay or 0`);
    L.push(`  love.graphics.clear(0.5 - 0.45 * night, 0.6 - 0.5 * night, 0.8 - 0.6 * night)`);
    L.push(`  love.graphics.setColor(1, 1, 1)`);
    L.push(`  local y = 20`);
    L.push(`  for k, v in pairs(a) do`);
    L.push(`    love.graphics.print(string.format("%s %.2f", k, v), 20, y); y = y + 16`);
    L.push(`  end`);
    L.push(`  if #world.memory > 0 then love.graphics.print("hint: " .. world.memory[#world.memory], 20, y + 10) end`);
    L.push(`end`);
    L.push(``);
    L.push(`return world`);
    L.push(``);

    const M = [];
    M.push(`-- TRIVIUM → LÖVE entry point for '${world.meta.id}'`);
    M.push(`local world = require("${world.meta.id}_world")`);
    M.push(`function love.load() world.play() end`);
    M.push(`function love.update(dt) world.update(dt) end`);
    M.push(`function love.draw() world.draw() end`);
    M.push(`function love.keypressed(key) world.trigger("key_" .. key) end`);
    M.push(``);

    return [
      { path: `${world.meta.id}_world.lua`, content: L.join("\n") },
      { path: "main.lua", content: M.join("\n") },
    ];
  },
};

// JSON → Lua table literal
function lua(v) {
  if (v === null || v === undefined) return "nil";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "{ " + v.map(lua).join(", ") + " }";
  const parts = [];
  for (const [k, val] of Object.entries(v)) {
    if (val === undefined) continue;
    const key = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : `[${JSON.stringify(k)}]`;
    parts.push(`${key} = ${lua(val)}`);
  }
  return "{ " + parts.join(", ") + " }";
}

module.exports = { adapter };
