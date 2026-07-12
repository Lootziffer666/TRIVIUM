#!/usr/bin/env node
/*!
 * TRIVIUM verify-live — der Beweisritt.
 *
 * Übersetzt die Beispielwelt nach SHADED und führt den generierten Driver
 * in der ECHTEN Engine aus: headless Chromium lädt SHADED/index.html
 * (unverändert, aus dem Schwester-Repo), erstellt die Szene, injiziert
 * den Driver und prüft dann Verhalten, nicht Text:
 *
 *   - installArc() schreibt ein abspielbares Storyboard in story.board()
 *   - moment('sturmnacht') setzt echte Engine-Parameter (getParams)
 *   - Regeln feuern in der richtigen Reihenfolge: erst Fehlversuch
 *     (onFail lehrt), dann Sturm, dann Erfolg — adult_games
 *     Anti-Chore-Loop-Hypothese, im Browser ausgeführt
 *   - der Fund der Laterne springt in den Moment 'der_tag_danach'
 *   - story.play() läuft ohne Konsolen-/GL-Fehler
 *
 * Nutzung:  npm i --no-save playwright   (einmalig, nie committen)
 *           node tools/verify-live.js [pfad/zu/SHADED]
 * SHADED-Repo-Pfad: Argument 1, env SHADED_REPO, sonst ../SHADED.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SHADED_REPO = path.resolve(process.argv[2] || process.env.SHADED_REPO || path.join(ROOT, "..", "SHADED"));
const SCENE_IMG = path.join(SHADED_REPO, "file_00000000974871f49fe71f6b456f9579.png");
const PORT = 8942;

if (!fs.existsSync(path.join(SHADED_REPO, "index.html"))) {
  console.error(`SHADED repo not found at ${SHADED_REPO} — pass the path as argument 1`);
  process.exit(2);
}

// ── 1. translate: WIR → SHADED driver (in-process, wie jeder Nutzer) ─────
const T = require(path.join(ROOT, "packages/trivium-core"));
const { build } = require(path.join(ROOT, "examples/dorf-sturmnacht"));
const reg = T.createRegistry();
reg.register(require(path.join(ROOT, "adapters/shaded/adapter")).adapter);
const res = T.translate(build(), "shaded", reg);
const driver = res.artifacts.find((a) => a.path.endsWith(".shaded.driver.js"));

// ── 2. serve SHADED unverändert ──────────────────────────────────────────
const server = http.createServer((req, res2) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "") || "index.html";
  try {
    const data = fs.readFileSync(path.join(SHADED_REPO, rel));
    res2.writeHead(200, { "Content-Type": rel.endsWith(".html") ? "text/html" : "image/png" });
    res2.end(data);
  } catch { res2.writeHead(404); res2.end(); }
});

(async () => {
  const { chromium } = require("playwright");
  await new Promise((r) => server.listen(PORT, r));
  const launchOpts = { args: ["--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"] };
  if (process.env.CHROMIUM) launchOpts.executablePath = process.env.CHROMIUM;
  else if (fs.existsSync("/opt/pw-browsers/chromium")) launchOpts.executablePath = "/opt/pw-browsers/chromium";
  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1500, height: 860 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  let failed = 0, passed = 0;
  const ok = (cond, name, detail) => {
    if (cond) { passed++; console.log("  ok " + name); }
    else { failed++; console.error("  FAIL " + name + (detail ? " — " + detail : "")); }
  };

  try {
    // ── 3. echte Engine hochfahren ───────────────────────────────────────
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.setInputFiles("#f-scene", SCENE_IMG);
    await page.waitForFunction(() => /Szene geladen|Tiefenkarte geladen/.test(document.getElementById("status").textContent));
    await page.click("#btn-create");
    await page.waitForFunction(() => window.SHADED.isReady(), null, { timeout: 30000 });

    // ── 4. Driver injizieren — exakt die generierte Datei ────────────────
    await page.addScriptTag({ content: driver.content });

    console.log("== driver in real engine ==");
    ok(await page.evaluate(() => window.TRIVIUM_DRIVER && window.TRIVIUM_DRIVER.worldId === "dorf-sturmnacht"),
      "TRIVIUM_DRIVER lebt und kennt seine Welt");

    // Storyboard: installArc schreibt in die LIVE-Referenz story.board()
    const board = await page.evaluate(() => {
      window.TRIVIUM_DRIVER.installArc();
      return window.SHADED.story.board().map((s) => ({ name: s.name, dur: s.dur, hasP: !!s.p }));
    });
    ok(board.length === 4 && board[0].name === "Goldener Tag" && board[2].name === "Sturmnacht" && board.every((s) => s.hasP),
      "installArc(): 4 abspielbare Schritte im echten story.board()", JSON.stringify(board));

    // Momente setzen echte Engine-Parameter
    const p1 = await page.evaluate(() => { window.TRIVIUM_DRIVER.moment("sturmnacht"); return window.SHADED.getParams(); });
    ok(p1.dayNight === 1 && p1.rain === 1 && p1.storm === 1 && p1.wind === 1,
      "moment('sturmnacht') spricht die Engine: dayNight/rain/storm/wind = 1", JSON.stringify(p1));

    // Sichtbeweis: die Sturmnacht, wie der übersetzte Driver sie spricht
    const outDir = path.join(__dirname, "verify-out");
    fs.mkdirSync(outDir, { recursive: true });
    await page.waitForTimeout(800); // Regen/Blitz einschwingen lassen
    const cv = await page.$("#gl"); // Overlay #ov liegt darüber und wird mitkomponiert
    const box = await cv.boundingBox();
    await page.screenshot({ path: path.join(outDir, "live_sturmnacht.png"), clip: box });
    ok(fs.existsSync(path.join(outDir, "live_sturmnacht.png")),
      "Screenshot der Driver-gesteuerten Sturmnacht: tools/verify-out/live_sturmnacht.png");

    // ── 5. Logik: Fehlversuch lehrt, Erfolg verändert die Welt ──────────
    const flow = await page.evaluate(() => {
      const D = window.TRIVIUM_DRIVER;
      const log = {};
      log.fail = D.trigger("anspreche_waechterin");           // zu früh: onFail
      log.memAfterFail = D.memory.length;
      log.hintFail = D.memory[D.memory.length - 1] && D.memory[D.memory.length - 1].hint;
      log.vertrauenAfterFail = D.state.vertrauen_waechterin;
      D.trigger("moment_sturmnacht");                          // Sturm: Schaden +2
      log.schaden = D.state.sturmschaden;
      log.success = D.trigger("anspreche_waechterin");         // jetzt: Vertrauen +1
      log.vertrauen = D.state.vertrauen_waechterin;
      return log;
    });
    ok(flow.fail.length === 1 && flow.fail[0].ok === false && flow.vertrauenAfterFail === 0,
      "Fehlversuch: Regel feuert onFail, Vertrauen bleibt 0", JSON.stringify(flow.fail));
    ok(flow.memAfterFail === 1 && /mustert dich/.test(flow.hintFail || ""),
      "Fehlversuch LEHRT: Hint liegt im Gedächtnis (Anti-Chore-Loop)", flow.hintFail);
    ok(flow.schaden === 2, "Sturm-Trigger: sturmschaden = 2", String(flow.schaden));
    ok(flow.success.length === 1 && flow.success[0].ok === true && flow.vertrauen === 1,
      "Erfolg nach gemeinsamem Erlebnis: Vertrauen = 1");

    // Fund der Laterne springt in den Moment 'der_tag_danach'
    const fund = await page.evaluate(() => {
      const D = window.TRIVIUM_DRIVER;
      D.trigger("untersuche_dorfweg");
      return { laterne: D.state.laterne_gefunden, params: window.SHADED.getParams() };
    });
    ok(fund.laterne === true && Math.abs(fund.params.dayNight - 0.04) < 1e-9 && fund.params.rain === 0,
      "Laternen-Fund wechselt die Welt in 'Der Tag danach' (dayNight 0.04, rain 0)",
      JSON.stringify({ laterne: fund.laterne, dayNight: fund.params.dayNight, rain: fund.params.rain }));

    // ── 6. Storyboard abspielen — die Welt lebt, ohne Fehler ─────────────
    await page.evaluate(() => window.TRIVIUM_DRIVER.play());
    await page.waitForTimeout(1500);
    const playing = await page.evaluate(() => window.SHADED.getParams());
    ok(typeof playing.dayNight === "number", "story.play() läuft (Parameter blenden)");

    ok(errors.length === 0, "keine Konsolen-/GL-Fehler", errors.join(" | "));
  } catch (err) {
    failed++;
    console.error("  FAIL (exception): " + err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nverify-live: ${passed} passed, ${failed} failed`);
  console.log(failed ? "VERIFY-LIVE: FAIL" : "VERIFY-LIVE: PASS — die Übersetzung LEBT in der echten Engine");
  process.exit(failed ? 1 : 0);
})();
