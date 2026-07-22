// ============================================================
// SCRIPT DE MONITORING — Ladbrokes.be
// Ouvre chaque page dans un vrai navigateur (Chromium headless),
// vérifie que le contenu utile est affiché, mesure le temps de
// chargement, et sauvegarde capture d'écran + DOM en cas de souci.
//
// Codes de sortie : 0 = tout va bien, 1 = au moins une page en échec
// ============================================================

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const config = require("./pages.config.js");

const OUTPUT_DIR = path.join(__dirname, "..", "artifacts");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Nettoie un nom de page pour en faire un nom de fichier
const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();

// Tente de fermer les popups classiques (cookies, âge) — best effort, sans échouer
async function dismissPopups(page) {
  const candidates = [
    "#onetrust-accept-btn-handler",                    // bannière cookies OneTrust
    'button:has-text("Accepter")',
    'button:has-text("Tout accepter")',
    'button:has-text("J\'accepte")',
    'button:has-text("OK")',
    '[class*="cookie"] button',
  ];
  for (const sel of candidates) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(500);
      }
    } catch (_) { /* pas grave, on continue */ }
  }
}

// Vérifie une page et retourne { ok, name, details, loadTimeMs }
async function checkPage(browser, pageConfig) {
  const result = { name: pageConfig.name, url: pageConfig.url, ok: false, details: [], loadTimeMs: null };
  const context = await browser.newContext({
    locale: "fr-BE",
    timezoneId: "Europe/Brussels",
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  const start = Date.now();

  try {
    // 1) La page répond-elle ?
    const response = await page.goto(pageConfig.url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (response && response.status() >= 400) {
      throw new Error(`Le serveur répond avec une erreur HTTP ${response.status()}`);
    }

    await dismissPopups(page);

    // 2) Le contenu utile s'affiche-t-il ?
    //    On attend que suffisamment de "preuves de contenu" soient visibles.
    const deadline = start + config.contentTimeoutMs;
    let found = [];
    while (Date.now() < deadline) {
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText : "");
      found = pageConfig.contentSignals.filter((sig) =>
        new RegExp(sig.value).test(bodyText)
      );
      if (found.length >= pageConfig.minSignals) break;
      await page.waitForTimeout(1000);
    }
    result.loadTimeMs = Date.now() - start;

    if (found.length < pageConfig.minSignals) {
      const missing = pageConfig.contentSignals
        .filter((s) => !found.includes(s))
        .map((s) => s.description)
        .join(", ");
      throw new Error(
        `Contenu incomplet après ${Math.round(config.contentTimeoutMs / 1000)}s — ` +
        `signaux trouvés: ${found.length}/${pageConfig.minSignals} requis. Manquants: ${missing}`
      );
    }
    result.details.push(`Signaux de contenu OK: ${found.map((s) => s.description).join(" | ")}`);

    // 3) Des squelettes de chargement traînent-ils encore ?
    const skeletons = await page
      .locator('[class*="skeleton" i]:visible, [class*="placeholder" i]:visible, [class*="shimmer" i]:visible')
      .count()
      .catch(() => 0);
    if (skeletons > 5) {
      throw new Error(`${skeletons} éléments de chargement (squelettes) encore visibles`);
    }

    // 4) La page est-elle assez rapide ?
    if (result.loadTimeMs > config.maxLoadTimeMs) {
      throw new Error(
        `Page trop lente: contenu affiché en ${(result.loadTimeMs / 1000).toFixed(1)}s ` +
        `(seuil: ${config.maxLoadTimeMs / 1000}s)`
      );
    }

    result.ok = true;
    result.details.push(`Temps de chargement: ${(result.loadTimeMs / 1000).toFixed(1)}s`);
  } catch (err) {
    result.ok = false;
    result.loadTimeMs = result.loadTimeMs || Date.now() - start;
    result.details.push(`ÉCHEC: ${err.message}`);
  }

  // Dans tous les cas : capture d'écran + DOM rendu (pour diagnostic et calibration)
  try {
    const base = path.join(OUTPUT_DIR, slug(pageConfig.name));
    await page.screenshot({ path: `${base}.png`, fullPage: false });
    const dom = await page.content();
    fs.writeFileSync(`${base}.html`, dom);
  } catch (_) { /* la capture ne doit jamais faire échouer le check */ }

  await context.close();
  return result;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const pageConfig of config.pages) {
    console.log(`\n▶ Vérification: ${pageConfig.name}`);
    const r = await checkPage(browser, pageConfig);
    results.push(r);
    console.log(r.ok ? "  ✅ OK" : "  ❌ ÉCHEC");
    r.details.forEach((d) => console.log(`     ${d}`));
  }
  await browser.close();

  // Résumé lisible (repris dans l'e-mail/notification GitHub)
  console.log("\n========== RÉSUMÉ ==========");
  for (const r of results) {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name} — ${r.details[r.details.length - 1]}`);
  }

  // Écrit un résumé pour le workflow GitHub
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "summary.json"),
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2)
  );

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.error(`\n${failures.length} page(s) en échec.`);
    process.exit(1);
  }
  console.log("\nToutes les pages sont saines.");
})();
