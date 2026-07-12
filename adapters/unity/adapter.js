/*!
 * TRIVIUM adapter: Unity
 *
 * Target language: a component engine. Everything is a GameObject with
 * components; the editor is half the language. We cannot emit .unity
 * scene files honestly (YAML mit Objekt-GUIDs ist Editor-Territorium),
 * also emittiert dieser Adapter das, was Unity fließend spricht: EINE
 * C#-Datei, die die Welt zur Laufzeit aufbaut — GameObjects aus der
 * Grammatik (Anker → Positionen, contains → Transform-Parenting),
 * Momente als Ambience-Dictionary mit Lerp-Blending, die komplette
 * Logik-Schicht als ehrliche C#-Runtime (Trigger/Advance/Hints).
 *
 * Wahrheits-Notiz: State-Werte werden als float geführt; Booleans
 * werden 0/1 (im Manifest als bridge dokumentiert, nicht versteckt).
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

const adapter = {
  name: "unity",
  engine: "Unity 2022+ — component engine, C# MonoBehaviour",
  dialect: "component-scene",

  capabilities: {
    "grammar.entity.*": {
      route: ROUTES.NATIVE, via: "GameObject + TriviumEntity component per entity",
      gain: "jede Entity ist sofort inspectorfähig und kann beliebige Components wachsen lassen",
    },
    "grammar.relation.contains": { route: ROUTES.NATIVE, via: "Transform-Parenting", note: "Enthaltensein IST die Szenenhierarchie" },
    "grammar.relation.blocks": { route: ROUTES.BRIDGE, via: "Collider-Vormerkung (Kommentar + Relationstabelle)", note: "physisches Blocken braucht authored Collider" },
    "grammar.relation.*": { route: ROUTES.BRIDGE, via: "Relations-Tabelle (abfragbar)", note: "soziale Bindungen als Daten, nicht als Hierarchie" },
    "grammar.space.2d": { route: ROUTES.NATIVE, via: "XY-Ebene (Unity-2D-Modus)" },
    "grammar.space.2.5d": { route: ROUTES.BRIDGE, via: "XY + Z-Tiefe aus Anker.y", note: "2.5D ist Sortier-Disziplin" },
    "grammar.space.3d": { route: ROUTES.NATIVE, via: "Vector3-Positionen" },

    "rhetoric.moment": { route: ROUTES.BRIDGE, via: "Ambience-Dictionary + OnMoment-Event" },
    "rhetoric.arc": { route: ROUTES.BRIDGE, via: "PlayArc()-Coroutine mit Lerp-Blending" },
    "rhetoric.intent.*": {
      route: ROUTES.APPROXIMATE, via: "Ambience-Werte 0..1",
      loss: "Unity hat keine lebende Welt ab Werk; jede Achse braucht authored Wiring (Volume-Profile, VFX Graph, Lichter), um sichtbar zu werden",
      note: "OnMoment/OnAmbience-Events sind die vorgesehene Andockstelle",
    },

    "logic.state.hidden": { route: ROUTES.BRIDGE, via: "float-Dictionary (privat)", note: "Booleans werden 0/1 — Wahrheit ist hier ein float, dokumentiert" },
    "logic.state.visible": { route: ROUTES.BRIDGE, via: "float-Dictionary + OnStateChanged-Event" },
    "logic.rule": { route: ROUTES.NATIVE, via: "Rule-Tabelle + Trigger()-Runtime", gain: "Regeln können an Physik, Input, Timer und UI-Events gehängt werden" },
    "logic.machine": { route: ROUTES.NATIVE, via: "FSM-Tabellen + Advance()" },
    "logic.memory": { route: ROUTES.NATIVE, via: "Hint-Liste + OnHint-Event" },
  },

  gains: [
    "Inspector-Sichtbarkeit: die übersetzte Welt ist zur Laufzeit anfassbar und debugbar",
    "das volle Component-Ökosystem: Physik, NavMesh, Timeline, Cinemachine docken ohne Compiler-Änderung an",
    "ein Prefab-Schritt macht jede Entity zur wiederverwendbaren Vorlage",
  ],

  realize(world, routed, ledger) {
    const cls = pas(world.meta.id) + "World";
    const anchors = Object.assign({}, ...world.grammar.spaces.map((s) => s.anchors));
    const is3d = world.meta.dims === "3d";
    const contains = world.grammar.relations.filter((r) => r.type === "contains");

    const C = [];
    C.push(`// TRIVIUM → Unity world for '${world.meta.id}' (generated scaffold).`);
    C.push(`// Die WIR (${world.meta.id}.wir.json) ist die Quelle der Wahrheit; neu generieren, nicht forken.`);
    C.push(`// Nutzung: Datei nach Assets/ kopieren, ${cls} auf ein leeres GameObject legen, Play.`);
    C.push(`// OnMoment/OnAmbience an Volume-Profile/VFX/Lichter verdrahten — dort entsteht die Sichtbarkeit.`);
    C.push(`using System;`);
    C.push(`using System.Collections;`);
    C.push(`using System.Collections.Generic;`);
    C.push(`using System.Linq;`);
    C.push(`using UnityEngine;`);
    C.push(``);
    C.push(`public sealed class TriviumEntity : MonoBehaviour`);
    C.push(`{`);
    C.push(`    public string Kind;`);
    C.push(`    public string[] Tags;`);
    C.push(`}`);
    C.push(``);
    C.push(`public sealed class ${cls} : MonoBehaviour`);
    C.push(`{`);
    C.push(`    // ── Logik: Zustand (Booleans als 0/1 — Wahrheit ist hier ein float) ──`);
    C.push(`    private readonly Dictionary<string, float> _state = new()`);
    C.push(`    {`);
    for (const s of world.logic.state) {
      C.push(`        ["${s.id}"] = ${csNum(s.initial)}f,  // ${s.visibility}, scope: ${s.scope}`);
    }
    C.push(`    };`);
    C.push(`    public readonly List<string> Memory = new();`);
    C.push(`    public event Action<string> OnHint;`);
    C.push(`    public event Action<string, float> OnStateChanged;`);
    C.push(`    public event Action<string, Dictionary<string, float>> OnMoment;`);
    C.push(``);
    C.push(`    // ── Rhetorik: Momente tragen BEDEUTUNG (Achsen 0..1), keine Effekte ──`);
    C.push(`    public readonly Dictionary<string, Dictionary<string, float>> Moments = new()`);
    C.push(`    {`);
    for (const m of world.rhetoric.moments) {
      const pairs = Object.entries(m.intents).map(([k, v]) => `["${k}"] = ${csNum(v)}f`).join(", ");
      C.push(`        ["${m.id}"] = new() { ${pairs} },`);
    }
    C.push(`    };`);
    C.push(`    public readonly string[] Arc = { ${world.rhetoric.arc.map((a) => `"${a}"`).join(", ")} };`);
    C.push(`    private readonly Dictionary<string, float> _durations = new() { ${world.rhetoric.moments.map((m) => `["${m.id}"] = ${csNum(m.durationSec)}f`).join(", ")} };`);
    C.push(`    public readonly Dictionary<string, float> Ambience = new();`);
    C.push(`    private Dictionary<string, float> _ambTarget = new();`);
    C.push(``);
    C.push(`    private sealed class Cond { public string State; public float? Gte, Lte, Eq; }`);
    C.push(`    private sealed class Effect { public string Set; public float? To; public float Add; public string MomentId, Hint; }`);
    C.push(`    private sealed class Rule`);
    C.push(`    {`);
    C.push(`        public string Id, Trigger, Group;`);
    C.push(`        public int Priority;`);
    C.push(`        public List<Cond> Conditions = new();`);
    C.push(`        public List<Effect> Then = new(), OnFail = new();`);
    C.push(`    }`);
    C.push(``);
    C.push(`    private readonly List<Rule> _rules = new()`);
    C.push(`    {`);
    for (const r of world.logic.rules) {
      C.push(`        new Rule`);
      C.push(`        {`);
      C.push(`            Id = "${r.id}", Trigger = "${r.when.trigger}", Priority = ${r.priority}, Group = ${r.exclusiveGroup ? `"${r.exclusiveGroup}"` : "null"},`);
      if (r.when.conditions.length) {
        C.push(`            Conditions = { ${r.when.conditions.map(csCond).join(", ")} },`);
      }
      if (r.then.length) C.push(`            Then = { ${r.then.map(csEffect).join(", ")} },`);
      if (r.onFail.length) C.push(`            OnFail = { ${r.onFail.map(csEffect).join(", ")} },`);
      C.push(`        },`);
    }
    C.push(`    };`);
    C.push(``);
    C.push(`    // ── Logik: Maschinen ──`);
    C.push(`    public readonly Dictionary<string, string> MachineState = new() { ${world.logic.machines.map((m) => `["${m.id}"] = "${m.initial}"`).join(", ")} };`);
    C.push(`    private readonly Dictionary<string, (string From, string To, string On)[]> _machines = new()`);
    C.push(`    {`);
    for (const m of world.logic.machines) {
      C.push(`        ["${m.id}"] = new[] { ${m.transitions.map((t) => `("${t.from}", "${t.to}", "${t.on}")`).join(", ")} },`);
    }
    C.push(`    };`);
    C.push(``);
    C.push(`    // ── Grammatik: die Welt baut sich beim Start ──`);
    C.push(`    private void Awake()`);
    C.push(`    {`);
    C.push(`        var byId = new Dictionary<string, GameObject>();`);
    for (const e of world.grammar.entities) {
      const a = anchors[e.id];
      C.push(`        byId["${e.id}"] = Spawn("${e.name}", "${e.kind}", new[] { ${e.tags.map((t) => `"${t}"`).join(", ")} }, ${csVec(a, is3d)});`);
    }
    for (const rel of contains) {
      C.push(`        byId["${rel.to}"].transform.SetParent(byId["${rel.from}"].transform, true); // ${rel.id}: contains`);
    }
    C.push(`    }`);
    C.push(``);
    C.push(`    private GameObject Spawn(string label, string kind, string[] tags, Vector3 pos)`);
    C.push(`    {`);
    C.push(`        var go = new GameObject(label);`);
    C.push(`        go.transform.SetParent(transform, false);`);
    C.push(`        go.transform.localPosition = pos;`);
    C.push(`        var te = go.AddComponent<TriviumEntity>();`);
    C.push(`        te.Kind = kind; te.Tags = tags;`);
    C.push(`        return go;`);
    C.push(`    }`);
    C.push(``);
    C.push(`    // ── Rhetorik-Runtime ──`);
    C.push(`    public void ApplyMoment(string id)`);
    C.push(`    {`);
    C.push(`        if (!Moments.TryGetValue(id, out var intents)) return;`);
    C.push(`        _ambTarget = new Dictionary<string, float>(intents);`);
    C.push(`        OnMoment?.Invoke(id, intents);`);
    C.push(`    }`);
    C.push(``);
    C.push(`    public IEnumerator PlayArc()`);
    C.push(`    {`);
    C.push(`        foreach (var id in Arc)`);
    C.push(`        {`);
    C.push(`            ApplyMoment(id);`);
    C.push(`            yield return new WaitForSeconds(_durations.GetValueOrDefault(id, 8f));`);
    C.push(`        }`);
    C.push(`    }`);
    C.push(``);
    C.push(`    private void Update()`);
    C.push(`    {`);
    C.push(`        foreach (var kv in _ambTarget)`);
    C.push(`            Ambience[kv.Key] = Mathf.Lerp(Ambience.GetValueOrDefault(kv.Key), kv.Value, Time.deltaTime * 1.5f);`);
    C.push(`    }`);
    C.push(``);
    C.push(`    // ── Logik-Runtime: Fehlversuche lehren (onFail), Gruppen sind exklusiv ──`);
    C.push(`    public List<(string Rule, bool Ok)> Trigger(string name)`);
    C.push(`    {`);
    C.push(`        var fired = new List<(string, bool)>();`);
    C.push(`        var groups = new HashSet<string>();`);
    C.push(`        foreach (var r in _rules.Where(r => r.Trigger == name).OrderByDescending(r => r.Priority))`);
    C.push(`        {`);
    C.push(`            if (r.Group != null && groups.Contains(r.Group)) continue;`);
    C.push(`            bool ok = r.Conditions.All(c =>`);
    C.push(`            {`);
    C.push(`                var v = _state.GetValueOrDefault(c.State);`);
    C.push(`                if (c.Gte.HasValue && !(v >= c.Gte.Value)) return false;`);
    C.push(`                if (c.Lte.HasValue && !(v <= c.Lte.Value)) return false;`);
    C.push(`                if (c.Eq.HasValue && !Mathf.Approximately(v, c.Eq.Value)) return false;`);
    C.push(`                return true;`);
    C.push(`            });`);
    C.push(`            var effects = ok ? r.Then : r.OnFail; // failure still teaches`);
    C.push(`            foreach (var e in effects) Apply(e);`);
    C.push(`            if (effects.Count > 0) fired.Add((r.Id, ok));`);
    C.push(`            if (ok && r.Group != null) groups.Add(r.Group);`);
    C.push(`        }`);
    C.push(`        return fired;`);
    C.push(`    }`);
    C.push(``);
    C.push(`    private void Apply(Effect e)`);
    C.push(`    {`);
    C.push(`        if (e.Set != null)`);
    C.push(`        {`);
    C.push(`            _state[e.Set] = e.To ?? _state.GetValueOrDefault(e.Set) + e.Add;`);
    C.push(`            OnStateChanged?.Invoke(e.Set, _state[e.Set]);`);
    C.push(`        }`);
    C.push(`        if (e.MomentId != null) ApplyMoment(e.MomentId);`);
    C.push(`        if (e.Hint != null) { Memory.Add(e.Hint); OnHint?.Invoke(e.Hint); }`);
    C.push(`    }`);
    C.push(``);
    C.push(`    public float GetState(string id) => _state.GetValueOrDefault(id);`);
    C.push(``);
    C.push(`    public string Advance(string machineId, string ev)`);
    C.push(`    {`);
    C.push(`        if (!_machines.TryGetValue(machineId, out var ts)) return null;`);
    C.push(`        foreach (var t in ts)`);
    C.push(`            if (t.From == MachineState[machineId] && t.On == ev) { MachineState[machineId] = t.To; break; }`);
    C.push(`        return MachineState[machineId];`);
    C.push(`    }`);
    C.push(`}`);
    C.push(``);

    return [{ path: `${cls}.cs`, content: C.join("\n") }];
  },
};

function pas(id) { return id.replace(/(^|[_\-\s])(\w)/g, (_, __, c) => c.toUpperCase()); }
function csNum(v) {
  if (typeof v === "boolean") return v ? "1" : "0";
  return String(v);
}
function csVec(a, is3d) {
  if (!a) return "Vector3.zero";
  // 0..1-Anker → 10-Unit-Bühne; 2D: y invertiert (Anker-y wächst nach unten)
  if (is3d) return `new Vector3(${r2(a.x * 10)}f, ${r2((a.z || 0) * 10)}f, ${r2(a.y * 10)}f)`;
  return `new Vector3(${r2(a.x * 10)}f, ${r2((1 - a.y) * 10)}f, 0f)`;
}
function r2(x) { return Math.round(x * 100) / 100; }
function csCond(c) {
  const parts = [`State = "${c.state}"`];
  if (c.gte != null) parts.push(`Gte = ${csNum(c.gte)}f`);
  if (c.lte != null) parts.push(`Lte = ${csNum(c.lte)}f`);
  if (c.eq != null) parts.push(`Eq = ${csNum(c.eq)}f`);
  return `new Cond { ${parts.join(", ")} }`;
}
function csEffect(e) {
  const parts = [];
  if (e.set != null) parts.push(`Set = "${e.set}"`);
  if (e.to != null) parts.push(`To = ${csNum(e.to)}f`);
  if (e.add != null) parts.push(`Add = ${csNum(e.add)}f`);
  if (e.moment != null) parts.push(`MomentId = "${e.moment}"`);
  if (e.hint != null) parts.push(`Hint = ${JSON.stringify(e.hint)}`);
  return `new Effect { ${parts.join(", ")} }`;
}

module.exports = { adapter };
