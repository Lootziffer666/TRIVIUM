/*!
 * TRIVIUM — Adapter Registry
 *
 * Engine adapters are plugins. The core knows no engine — it knows only
 * this contract. An adapter is to TRIVIUM what a language bank is to
 * MANIFOLD: a declaration of competence, honest about its limits.
 *
 * Adapter contract:
 *   {
 *     name: string,                  // registry key, e.g. 'shaded'
 *     engine: string,                // human-readable engine description
 *     dialect: string,               // e.g. '2d-living-image', '2d/3d-scene-tree'
 *     capabilities: {                // concept kind (or kind prefix) → capability
 *       'rhetoric.intent.precipitation': { route, via, note?, loss?, gain? },
 *       'grammar.entity.*':             { ... }   // '*' suffix = prefix match
 *     },
 *     gains: [string],               // affordances the engine adds unprompted
 *     realize(world, routed, ledger) // → [{ path, content }]
 *   }
 *
 * capabilities[].route uses ledger.ROUTES. A kind with no matching
 * capability routes UNKNOWN — passivity as safety, never a crash.
 * Adapters never receive concepts routed UNKNOWN; the core withholds them.
 */
"use strict";

const { ROUTES } = require("./ledger");

const REQUIRED_FIELDS = ["name", "engine", "dialect", "capabilities", "realize"];

function createRegistry() {
  const adapters = new Map();

  function register(adapter) {
    for (const f of REQUIRED_FIELDS) {
      if (!adapter || adapter[f] == null) {
        throw new Error(`registry.register: adapter is missing '${f}'`);
      }
    }
    if (typeof adapter.realize !== "function") {
      throw new Error(`registry.register(${adapter.name}): realize must be a function`);
    }
    for (const [kind, cap] of Object.entries(adapter.capabilities)) {
      if (!Object.values(ROUTES).includes(cap.route)) {
        throw new Error(`adapter ${adapter.name}: capability '${kind}' has unknown route '${cap.route}'`);
      }
      if (cap.route === ROUTES.APPROXIMATE && !cap.loss) {
        throw new Error(`adapter ${adapter.name}: capability '${kind}' routes approximate but declares no loss — losses are documented up front, not discovered in production`);
      }
    }
    adapters.set(adapter.name, adapter);
    return adapter;
  }

  function get(name) {
    const a = adapters.get(name);
    if (!a) {
      throw new Error(`registry.get: no adapter '${name}' registered (have: ${[...adapters.keys()].join(", ") || "none"})`);
    }
    return a;
  }

  function list() { return [...adapters.keys()]; }

  /** Look up the capability for a concept kind: exact match wins,
   *  then longest '*' prefix match, else null (→ UNKNOWN). */
  function capabilityFor(adapter, kind) {
    const caps = adapter.capabilities;
    if (caps[kind]) return { key: kind, ...caps[kind] };
    let best = null;
    for (const key of Object.keys(caps)) {
      if (!key.endsWith("*")) continue;
      const prefix = key.slice(0, -1);
      if (kind.startsWith(prefix) && (!best || prefix.length > best.prefix.length)) {
        best = { prefix, key, cap: caps[key] };
      }
    }
    return best ? { key: best.key, ...best.cap } : null;
  }

  return { register, get, list, capabilityFor };
}

module.exports = { createRegistry };
