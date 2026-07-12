/*!
 * TRIVIUM adapter: Unreal Engine 5
 *
 * Target language: ein C++-Framework mit Reflection-Makros und einem
 * Editor als zweiter Hälfte der Sprache. Blueprints sind binär — sie
 * ehrlich zu emittieren ist unmöglich, also emittiert dieser Adapter
 * das, was Unreal im Quelltext fließend spricht: einen AActor
 * (<Id>World.h/.cpp), der die Grammatik bei BeginPlay spawnt
 * (contains wird AttachToActor), die Rhetorik als Intent-TMaps mit
 * Delegate-Andockstellen (PostProcess/Niagara/Lumen verdrahtet der
 * Autor), und die Logik-Schicht als vollwertige C++-Runtime.
 *
 * Der dokumentierte Gain: alles ist UFUNCTION(BlueprintCallable) /
 * BlueprintAssignable — Designer greifen die übersetzte Welt in
 * Blueprints ab, ohne eine Zeile C++ anzufassen.
 *
 * Wahrheits-Notiz: wie in Unity werden State-Booleans 0/1 (float) —
 * dokumentierte Brücke, kein stilles Umdeuten.
 */
"use strict";

const { ROUTES } = require("../../packages/trivium-core/src/ledger");

const adapter = {
  name: "unreal",
  engine: "Unreal Engine 5 — AActor/C++ mit Blueprint-Exposition",
  dialect: "actor-reflection-cpp",

  capabilities: {
    "grammar.entity.*": {
      route: ROUTES.BRIDGE, via: "bei BeginPlay gespawnte AActors mit Tags",
      note: "Editor-Platzierung (.umap) bleibt Autorenarbeit; der Spawn trägt die Bedeutung",
      gain: "jede Entity ist ein voller AActor — Physik, Replikation, Blueprint-Zugriff inklusive",
    },
    "grammar.relation.contains": { route: ROUTES.NATIVE, via: "AttachToActor (KeepWorldTransform)" },
    "grammar.relation.blocks": { route: ROUTES.BRIDGE, via: "Kollisions-Vormerkung (Tag + Relationstabelle)" },
    "grammar.relation.*": { route: ROUTES.BRIDGE, via: "Relations-TArray (abfragbar, BlueprintReadOnly)" },
    "grammar.space.3d": { route: ROUTES.NATIVE, via: "FVector-Welt", gain: "freie Kamera, Lumen-Licht, Weltpartitionierung — der Raum ist Muttersprache" },
    "grammar.space.2.5d": { route: ROUTES.BRIDGE, via: "3D-Bühne mit fixierter Kameraachse" },
    "grammar.space.2d": {
      route: ROUTES.APPROXIMATE, via: "XZ-Ebene (Y = 0)",
      loss: "echtes 2D braucht authored Paper2D-Setup; die Ebene trägt nur die Anordnung",
    },

    "rhetoric.moment": { route: ROUTES.BRIDGE, via: "TMap<FName, float> + OnMomentApplied-Delegate" },
    "rhetoric.arc": { route: ROUTES.BRIDGE, via: "PlayArc() mit FTimerHandle-Kette" },
    "rhetoric.intent.*": {
      route: ROUTES.APPROXIMATE, via: "Intent-TMaps 0..1",
      loss: "Achsen werden erst sichtbar, wenn der Autor sie an PostProcess/Niagara/Sky verdrahtet — Unreal simuliert keine Bedeutung von selbst",
      note: "OnMomentApplied/OnAmbienceChanged sind die vorgesehenen Andockstellen",
    },

    "logic.state.hidden": { route: ROUTES.BRIDGE, via: "TMap<FName, float> (privat)", note: "Booleans werden 0/1 — dokumentierte Brücke" },
    "logic.state.visible": { route: ROUTES.BRIDGE, via: "TMap + OnStateChanged-Delegate" },
    "logic.rule": {
      route: ROUTES.NATIVE, via: "Regel-TArray + Trigger(FName)-Runtime",
      gain: "Trigger ist BlueprintCallable — Level-Skripte feuern Weltregeln ohne C++",
    },
    "logic.machine": { route: ROUTES.NATIVE, via: "FSM-TMaps + Advance()" },
    "logic.memory": { route: ROUTES.NATIVE, via: "Memory-TArray + OnHint-Delegate (BlueprintAssignable)" },
  },

  gains: [
    "Blueprint-Exposition: die gesamte übersetzte Logik ist von Designern abgreifbar (BlueprintCallable/BlueprintAssignable)",
    "Replikations-Potenzial: State und Trigger liegen in einer Form, die UPROPERTY(Replicated) direkt erlaubt",
    "die 3D-Bühne skaliert von Blockout bis Nanite ohne Compiler-Änderung",
  ],

  realize(world, routed, ledger) {
    const cls = "A" + pas(world.meta.id) + "World";
    const base = pas(world.meta.id) + "World";
    const anchors = Object.assign({}, ...world.grammar.spaces.map((s) => s.anchors));
    const contains = world.grammar.relations.filter((r) => r.type === "contains");

    // ── Header ──────────────────────────────────────────────────────────
    const H = [];
    H.push(`// TRIVIUM → Unreal world for '${world.meta.id}' (generated scaffold).`);
    H.push(`// Die WIR (${world.meta.id}.wir.json) ist die Quelle der Wahrheit; neu generieren, nicht forken.`);
    H.push(`// Nutzung: beide Dateien in ein C++-Modul legen, ${cls} ins Level ziehen (oder spawnen).`);
    H.push(`// OnMomentApplied an PostProcess/Niagara/Sky verdrahten — dort entsteht die Sichtbarkeit.`);
    H.push(`#pragma once`);
    H.push(``);
    H.push(`#include "CoreMinimal.h"`);
    H.push(`#include "GameFramework/Actor.h"`);
    H.push(`#include "${base}.generated.h"`);
    H.push(``);
    H.push(`USTRUCT(BlueprintType)`);
    H.push(`struct FTriviumCond`);
    H.push(`{`);
    H.push(`\tGENERATED_BODY()`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName State;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) bool bHasGte = false; UPROPERTY(BlueprintReadOnly) float Gte = 0.f;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) bool bHasLte = false; UPROPERTY(BlueprintReadOnly) float Lte = 0.f;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) bool bHasEq = false;  UPROPERTY(BlueprintReadOnly) float Eq = 0.f;`);
    H.push(`};`);
    H.push(``);
    H.push(`USTRUCT(BlueprintType)`);
    H.push(`struct FTriviumEffect`);
    H.push(`{`);
    H.push(`\tGENERATED_BODY()`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName Set;      // NAME_None = kein State-Effekt`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) bool bHasTo = false; UPROPERTY(BlueprintReadOnly) float To = 0.f;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) float Add = 0.f;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName MomentId; // NAME_None = kein Momentwechsel`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FString Hint;   // leer = kein Hint`);
    H.push(`};`);
    H.push(``);
    H.push(`USTRUCT(BlueprintType)`);
    H.push(`struct FTriviumRule`);
    H.push(`{`);
    H.push(`\tGENERATED_BODY()`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName Id;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName Trigger;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) FName Group;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) int32 Priority = 0;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) TArray<FTriviumCond> Conditions;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) TArray<FTriviumEffect> Then;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly) TArray<FTriviumEffect> OnFail;`);
    H.push(`};`);
    H.push(``);
    H.push(`DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FTriviumHint, const FString&, Hint);`);
    H.push(`DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FTriviumStateChanged, FName, Key, float, Value);`);
    H.push(`DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FTriviumMoment, FName, MomentId);`);
    H.push(``);
    H.push(`UCLASS()`);
    H.push(`class ${cls} : public AActor`);
    H.push(`{`);
    H.push(`\tGENERATED_BODY()`);
    H.push(``);
    H.push(`public:`);
    H.push(`\t${cls}();`);
    H.push(``);
    H.push(`\t// ── Logik-API (Blueprint-abgreifbar) ──`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") TArray<FName> Trigger(FName Name);`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") float GetState(FName Id) const;`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") FName Advance(FName MachineId, FName Event);`);
    H.push(``);
    H.push(`\t// ── Rhetorik-API ──`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") void ApplyMoment(FName Id);`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") void PlayArc();`);
    H.push(`\tUFUNCTION(BlueprintCallable, Category = "Trivium") float GetIntent(FName MomentId, FName Axis) const;`);
    H.push(``);
    H.push(`\tUPROPERTY(BlueprintAssignable, Category = "Trivium") FTriviumHint OnHint;`);
    H.push(`\tUPROPERTY(BlueprintAssignable, Category = "Trivium") FTriviumStateChanged OnStateChanged;`);
    H.push(`\tUPROPERTY(BlueprintAssignable, Category = "Trivium") FTriviumMoment OnMomentApplied;`);
    H.push(``);
    H.push(`\tUPROPERTY(BlueprintReadOnly, Category = "Trivium") TArray<FString> Memory;`);
    H.push(`\tUPROPERTY(BlueprintReadOnly, Category = "Trivium") TArray<FName> Arc;`);
    H.push(``);
    H.push(`protected:`);
    H.push(`\tvirtual void BeginPlay() override;`);
    H.push(``);
    H.push(`private:`);
    H.push(`\tTMap<FName, float> State;                       // Booleans als 0/1 (dokumentierte Brücke)`);
    H.push(`\tTMap<FName, TMap<FName, float>> Moments;        // Bedeutungs-Achsen 0..1`);
    H.push(`\tTMap<FName, float> Durations;`);
    H.push(`\tTArray<FTriviumRule> Rules;`);
    H.push(`\tTMap<FName, FName> MachineState;`);
    H.push(`\tTMap<FName, TArray<TTuple<FName, FName, FName>>> Machines; // From, To, On`);
    H.push(`\tTMap<FName, AActor*> Spawned;`);
    H.push(`\tFTimerHandle ArcTimer;`);
    H.push(`\tint32 ArcIndex = 0;`);
    H.push(`\tvoid ArcStep();`);
    H.push(`\tvoid ApplyEffect(const FTriviumEffect& E);`);
    H.push(`\tAActor* SpawnEntity(const FString& Label, FName Kind, const FVector& Pos);`);
    H.push(`};`);
    H.push(``);

    // ── Source ──────────────────────────────────────────────────────────
    const S = [];
    S.push(`// TRIVIUM → Unreal world for '${world.meta.id}' (generated scaffold). Siehe ${base}.h.`);
    S.push(`#include "${base}.h"`);
    S.push(`#include "TimerManager.h"`);
    S.push(``);
    S.push(`${cls}::${cls}()`);
    S.push(`{`);
    S.push(`\tPrimaryActorTick.bCanEverTick = false;`);
    S.push(``);
    S.push(`\t// ── Logik: Zustand ──`);
    for (const st of world.logic.state) {
      S.push(`\tState.Add("${st.id}", ${cppNum(st.initial)}f); // ${st.visibility}, scope: ${st.scope}`);
    }
    S.push(``);
    S.push(`\t// ── Rhetorik: Momente tragen BEDEUTUNG, keine Effekte ──`);
    for (const m of world.rhetoric.moments) {
      const pairs = Object.entries(m.intents).map(([k, v]) => `{ "${k}", ${cppNum(v)}f }`).join(", ");
      S.push(`\tMoments.Add("${m.id}", TMap<FName, float>{ ${pairs} });`);
      S.push(`\tDurations.Add("${m.id}", ${cppNum(m.durationSec)}f);`);
    }
    S.push(`\tArc = { ${world.rhetoric.arc.map((a) => `"${a}"`).join(", ")} };`);
    S.push(``);
    S.push(`\t// ── Logik: Regeln (Fehlversuche lehren — onFail) ──`);
    for (const r of world.logic.rules) {
      S.push(`\t{`);
      S.push(`\t\tFTriviumRule R;`);
      S.push(`\t\tR.Id = "${r.id}"; R.Trigger = "${r.when.trigger}"; R.Priority = ${r.priority}; R.Group = ${r.exclusiveGroup ? `"${r.exclusiveGroup}"` : "NAME_None"};`);
      for (const c of r.when.conditions) {
        const parts = [`C.State = "${c.state}"`];
        if (c.gte != null) parts.push(`C.bHasGte = true; C.Gte = ${cppNum(c.gte)}f`);
        if (c.lte != null) parts.push(`C.bHasLte = true; C.Lte = ${cppNum(c.lte)}f`);
        if (c.eq != null) parts.push(`C.bHasEq = true; C.Eq = ${cppNum(c.eq)}f`);
        S.push(`\t\t{ FTriviumCond C; ${parts.join("; ")}; R.Conditions.Add(C); }`);
      }
      for (const [list, effs] of [["Then", r.then], ["OnFail", r.onFail]]) {
        for (const e of effs) {
          const parts = [];
          if (e.set != null) parts.push(`E.Set = "${e.set}"`);
          if (e.to != null) parts.push(`E.bHasTo = true; E.To = ${cppNum(e.to)}f`);
          if (e.add != null) parts.push(`E.Add = ${cppNum(e.add)}f`);
          if (e.moment != null) parts.push(`E.MomentId = "${e.moment}"`);
          if (e.hint != null) parts.push(`E.Hint = TEXT(${JSON.stringify(e.hint)})`);
          S.push(`\t\t{ FTriviumEffect E; ${parts.join("; ")}; R.${list}.Add(E); }`);
        }
      }
      S.push(`\t\tRules.Add(R);`);
      S.push(`\t}`);
    }
    S.push(``);
    S.push(`\t// ── Logik: Maschinen ──`);
    for (const m of world.logic.machines) {
      S.push(`\tMachineState.Add("${m.id}", "${m.initial}");`);
      S.push(`\tMachines.Add("${m.id}", { ${m.transitions.map((t) => `MakeTuple(FName("${t.from}"), FName("${t.to}"), FName("${t.on}"))`).join(", ")} });`);
    }
    S.push(`}`);
    S.push(``);
    S.push(`void ${cls}::BeginPlay()`);
    S.push(`{`);
    S.push(`\tSuper::BeginPlay();`);
    S.push(``);
    S.push(`\t// ── Grammatik: die Welt spawnt (Editor-Platzierung bleibt Autorenarbeit) ──`);
    for (const e of world.grammar.entities) {
      S.push(`\tSpawned.Add("${e.id}", SpawnEntity(TEXT(${JSON.stringify(e.name)}), "${e.kind}", ${cppVec(anchors[e.id], world.meta.dims)}));`);
    }
    for (const rel of contains) {
      S.push(`\tif (Spawned["${rel.to}"] && Spawned["${rel.from}"]) // ${rel.id}: contains`);
      S.push(`\t\tSpawned["${rel.to}"]->AttachToActor(Spawned["${rel.from}"], FAttachmentTransformRules::KeepWorldTransform);`);
    }
    S.push(`}`);
    S.push(``);
    S.push(`AActor* ${cls}::SpawnEntity(const FString& Label, FName Kind, const FVector& Pos)`);
    S.push(`{`);
    S.push(`\tFActorSpawnParameters P;`);
    S.push(`\tAActor* A = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), Pos, FRotator::ZeroRotator, P);`);
    S.push(`\tif (A)`);
    S.push(`\t{`);
    S.push(`#if WITH_EDITOR`);
    S.push(`\t\tA->SetActorLabel(Label); // editor-only API — Shipping-Builds kennen sie nicht`);
    S.push(`#endif`);
    S.push(`\t\tA->Tags.Add(Kind);`);
    S.push(`\t}`);
    S.push(`\treturn A;`);
    S.push(`}`);
    S.push(``);
    S.push(`void ${cls}::ApplyMoment(FName Id)`);
    S.push(`{`);
    S.push(`\tif (!Moments.Contains(Id)) return;`);
    S.push(`\tOnMomentApplied.Broadcast(Id); // PostProcess/Niagara/Sky docken hier an`);
    S.push(`}`);
    S.push(``);
    S.push(`float ${cls}::GetIntent(FName MomentId, FName Axis) const`);
    S.push(`{`);
    S.push(`\tconst TMap<FName, float>* M = Moments.Find(MomentId);`);
    S.push(`\treturn M ? M->FindRef(Axis) : 0.f;`);
    S.push(`}`);
    S.push(``);
    S.push(`void ${cls}::PlayArc()`);
    S.push(`{`);
    S.push(`\tArcIndex = 0;`);
    S.push(`\tArcStep();`);
    S.push(`}`);
    S.push(``);
    S.push(`void ${cls}::ArcStep()`);
    S.push(`{`);
    S.push(`\tif (!Arc.IsValidIndex(ArcIndex)) return;`);
    S.push(`\tconst FName Id = Arc[ArcIndex++];`);
    S.push(`\tApplyMoment(Id);`);
    S.push(`\tGetWorldTimerManager().SetTimer(ArcTimer, this, &${cls}::ArcStep, FMath::Max(0.1f, Durations.FindRef(Id)), false);`);
    S.push(`}`);
    S.push(``);
    S.push(`TArray<FName> ${cls}::Trigger(FName Name)`);
    S.push(`{`);
    S.push(`\tTArray<FName> Fired;`);
    S.push(`\tTSet<FName> Groups;`);
    S.push(`\tTArray<const FTriviumRule*> Candidates;`);
    S.push(`\tfor (const FTriviumRule& R : Rules) if (R.Trigger == Name) Candidates.Add(&R);`);
    S.push(`\tCandidates.Sort([](const FTriviumRule& A, const FTriviumRule& B) { return A.Priority > B.Priority; });`);
    S.push(`\tfor (const FTriviumRule* R : Candidates)`);
    S.push(`\t{`);
    S.push(`\t\tif (R->Group != NAME_None && Groups.Contains(R->Group)) continue;`);
    S.push(`\t\tbool bOk = true;`);
    S.push(`\t\tfor (const FTriviumCond& C : R->Conditions)`);
    S.push(`\t\t{`);
    S.push(`\t\t\tconst float V = State.FindRef(C.State);`);
    S.push(`\t\t\tif (C.bHasGte && !(V >= C.Gte)) bOk = false;`);
    S.push(`\t\t\tif (C.bHasLte && !(V <= C.Lte)) bOk = false;`);
    S.push(`\t\t\tif (C.bHasEq && !FMath::IsNearlyEqual(V, C.Eq)) bOk = false;`);
    S.push(`\t\t}`);
    S.push(`\t\tconst TArray<FTriviumEffect>& Effects = bOk ? R->Then : R->OnFail; // failure still teaches`);
    S.push(`\t\tfor (const FTriviumEffect& E : Effects) ApplyEffect(E);`);
    S.push(`\t\tif (Effects.Num() > 0) Fired.Add(R->Id);`);
    S.push(`\t\tif (bOk && R->Group != NAME_None) Groups.Add(R->Group);`);
    S.push(`\t}`);
    S.push(`\treturn Fired;`);
    S.push(`}`);
    S.push(``);
    S.push(`void ${cls}::ApplyEffect(const FTriviumEffect& E)`);
    S.push(`{`);
    S.push(`\tif (E.Set != NAME_None)`);
    S.push(`\t{`);
    S.push(`\t\tState.Add(E.Set, E.bHasTo ? E.To : State.FindRef(E.Set) + E.Add);`);
    S.push(`\t\tOnStateChanged.Broadcast(E.Set, State.FindRef(E.Set));`);
    S.push(`\t}`);
    S.push(`\tif (E.MomentId != NAME_None) ApplyMoment(E.MomentId);`);
    S.push(`\tif (!E.Hint.IsEmpty()) { Memory.Add(E.Hint); OnHint.Broadcast(E.Hint); }`);
    S.push(`}`);
    S.push(``);
    S.push(`float ${cls}::GetState(FName Id) const`);
    S.push(`{`);
    S.push(`\treturn State.FindRef(Id);`);
    S.push(`}`);
    S.push(``);
    S.push(`FName ${cls}::Advance(FName MachineId, FName Event)`);
    S.push(`{`);
    S.push(`\tconst TArray<TTuple<FName, FName, FName>>* Ts = Machines.Find(MachineId);`);
    S.push(`\tif (!Ts) return NAME_None;`);
    S.push(`\tFName& Cur = MachineState.FindOrAdd(MachineId);`);
    S.push(`\tfor (const auto& T : *Ts)`);
    S.push(`\t\tif (T.Get<0>() == Cur && T.Get<2>() == Event) { Cur = T.Get<1>(); break; }`);
    S.push(`\treturn Cur;`);
    S.push(`}`);
    S.push(``);

    return [
      { path: `${base}.h`, content: H.join("\n") },
      { path: `${base}.cpp`, content: S.join("\n") },
    ];
  },
};

function pas(id) { return id.replace(/(^|[_\-\s])(\w)/g, (_, __, c) => c.toUpperCase()); }
function cppNum(v) {
  // C++ verlangt einen Dezimalpunkt vor dem f-Suffix: 1.f, nicht 1f (C#-Falle)
  if (typeof v === "boolean") return v ? "1." : "0.";
  return Number.isInteger(v) ? `${v}.` : String(v);
}
function cppVec(a, dims) {
  if (!a) return "FVector::ZeroVector";
  // 0..1-Anker → 1000-Unit-Bühne (UE: X vor, Y rechts, Z hoch)
  if (dims === "3d") return `FVector(${r1(a.x * 1000)}f, ${r1(a.y * 1000)}f, ${r1((a.z || 0) * 1000)}f)`;
  return `FVector(${r1(a.x * 1000)}f, 0.f, ${r1((1 - a.y) * 1000)}f)`; // 2D/2.5D: XZ-Ebene
}
function r1(x) { return cppNum(Math.round(x * 10) / 10); }

module.exports = { adapter };
