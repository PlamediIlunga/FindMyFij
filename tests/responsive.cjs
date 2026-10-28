const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const XLSX = require('xlsx');

// À exécuter sur une instance locale en mode démo, jamais sur la production.
const base = process.env.FIJ_TEST_URL || 'http://localhost:3100';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Utiliser un serveur local de test.');

(async () => {
  const browser = await chromium.launch({ channel: process.env.FIJ_TEST_BROWSER || 'chrome', headless: true });
  try {
    for (const width of [390, 820, 1440]) {
      for (const theme of ['light', 'dark']) {
        const page = await browser.newPage({ viewport: { width, height: 960 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(theme => localStorage.setItem('fij-carte-theme', theme), theme);
        for (const route of ['/', '/admin/fij', '/admin/fij/new', '/admin/fij/fij-001/edit', '/admin/login']) {
          await page.goto(base + route);
          await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
          await page.waitForTimeout(300); // Fin des transitions de thème avant capture.
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Débordement ${route} ${width}`);
          if (route === '/') {
            const footer = page.getByRole('link', { name: "Accéder à l'administration" }).filter({ visible: true });
            if (width > 640) {
              const scroll = page.locator('aside > div').first();
              assert.ok(await scroll.evaluate(el => el.scrollHeight > el.clientHeight), 'Sidebar doit défiler');
              await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
              assert.ok(await footer.isVisible());
              assert.ok((await footer.boundingBox()).y < 960);
              await scroll.evaluate(el => { el.scrollTop = 0; });
            } else {
              const handle = page.getByRole('button', { name: 'Faire glisser pour agrandir ou réduire la liste des FIJ' });
              await handle.press('Enter'); await handle.press('Enter');
              const body = page.locator('[class*="MobileBottomSheet_body"]');
              await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
              await page.waitForTimeout(400);
              assert.ok((await footer.boundingBox()).y < 960, 'Copyright mobile accessible en fin de liste');
              await body.evaluate(el => { el.scrollTop = 0; });
              await handle.press('Enter');
              await page.waitForTimeout(400);
            }
          }
          await page.locator('body').click({ position: { x: width - 2, y: 2 } });
          if (route === '/admin/fij') {
            assert.ok(await page.locator('tbody tr').count() > 0);
            const table = page.locator('[class*="tableScroll"]').first();
            if (width === 390) {
              assert.ok(await table.evaluate(el => el.scrollWidth > el.clientWidth));
              await table.evaluate(el => { el.scrollLeft = el.scrollWidth; });
              assert.ok(await page.getByRole('button', { name: /^Supprimer/ }).first().isVisible());
              await table.evaluate(el => { el.scrollLeft = 0; });
            }
            await page.getByLabel('Rechercher une FIJ').fill('Espoir');
            assert.equal(await page.locator('tbody tr').count(), 1);
            await page.getByLabel('Rechercher une FIJ').fill('');
          }
          const name = route === '/' ? 'map' : route.split('/').filter(Boolean).join('-');
          await page.screenshot({ path: path.join(os.tmpdir(), `fij-${name}-${width}-${theme}.png`) });
          console.log(`OK ${route} ${width}px ${theme}`);
        }
        assert.deepEqual(errors, [], 'Pas d’erreur JavaScript');
        await page.close();
      }
    }
    const page = await browser.newPage();
    await page.goto(base + '/admin/fij/new');
    await page.getByRole('tab', { name: 'Importer un fichier Excel' }).click();
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Nom', 'Catégorie', 'Adresse', 'Ville', 'Province', 'Code postal'],
      ['FIJ test', 'Jeunes', '123 Main', 'Ottawa', 'ON', 'K1A 0B1'],
      ['Invalide', 'Global'],
    ]), 'FIJ');
    await page.locator('input[type=file]').setInputFiles({ name: 'test.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) });
    await page.getByRole('button', { name: 'Importer 1 ligne(s)', exact: true }).waitFor();
    assert.match(await page.locator('tbody').innerText(), /Catégorie invalide/);
    // Le géocodage simulé échoue : aucune écriture de données n’est possible.
    await page.route('**/api/geocoding', route => route.fulfill({ status: 502, json: { error: 'Test indisponibilité' } }));
    await page.getByRole('button', { name: 'Importer 1 ligne(s)', exact: true }).click();
    await page.getByText('Position introuvable. Vérifiez l’adresse avant de réessayer.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Importer 1 ligne(s)', exact: true }).isEnabled(), true);
    console.log('OK aperçu Excel, rejet des lignes invalides, échec réseau et reprise du bouton');
    await page.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
