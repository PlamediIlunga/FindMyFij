import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parseFijWorkbook, geocodeImportRow, importFijRows } from '../src/lib/fijImport';

const headers = ['Nom', 'Catégorie', 'Adresse', 'Ville', 'Province', 'Code postal', 'Téléphone', 'Local'];
const good = ['FIJ Espoir', ' jeunes ados ', '123 rue Principale', 'Gatineau', 'Québec', 'j8x 1a1', '819 555-1234', '201'];
function workbook(rows: unknown[][]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'FIJ');
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}
const parsed = () => parseFijWorkbook(workbook([headers, good]));
const result = { ...parsed()[0].input!, latitude: 45.4, longitude: -75.7, approximate: false };
const pause = async () => {};

test('lit un véritable .xlsx, accents, catégorie, province et champs optionnels', () => {
  const row = parsed()[0];
  assert.deepEqual(row.errors, []);
  assert.equal(row.input?.category, 'Jeunes Ados');
  assert.equal(row.input?.province, 'QC');
  assert.equal(row.input?.country, 'Canada');
  assert.equal(row.input?.postalCode, 'J8X 1A1');
  assert.equal(row.input?.phone, '819 555-1234');
  assert.equal(row.input?.unitNumber, '201');
});
test('conserve les numéros de ligne après une ligne vide', () => {
  const rows = parseFijWorkbook(workbook([headers, [], good]));
  assert.equal(rows.length, 1); assert.equal(rows[0].line, 3);
});
test('signale les champs manquants et refuse Global', () => {
  const rows = parseFijWorkbook(workbook([headers, ['Invalide', 'Global']]));
  assert.equal(rows[0].input, undefined); assert.equal(rows[0].errors.length, 5);
});
test('accepte les en-têtes anglais et les valeurs numériques', () => {
  const rows = parseFijWorkbook(workbook([['Name', 'Category', 'Address', 'City', 'Province', 'Postal code', 'Phone'], ['Test', 'Jeunes', '123 Main', 'Ottawa', 'ON', 'K1A 0B1', 123456]]));
  assert.equal(rows[0].input?.phone, '123456');
});
test('feuille sans données : aucune ligne valide', () => {
  assert.deepEqual(parseFijWorkbook(workbook([headers])), []);
  assert.throws(() => parseFijWorkbook(workbook([])), /vide/);
});
test('géocode une adresse et inclut le pays', async () => {
  const fetcher: typeof fetch = async (_url, options) => {
    assert.match(JSON.parse(String(options?.body)).address, /Canada/);
    return Response.json({ latitude: 45.4, longitude: -75.7 });
  };
  assert.equal((await geocodeImportRow(parsed()[0].input!, fetcher, pause))?.approximate, false);
});
test('réessaie les erreurs réseau et marque le repli approximatif', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; if (calls < 3) throw Error('network'); return Response.json({ latitude: 45, longitude: -75 }); };
  assert.equal((await geocodeImportRow(parsed()[0].input!, fetcher, pause))?.approximate, true);
  assert.equal(calls, 3);
});
test('refuse des coordonnées hors limites ou non numériques', async () => {
  assert.equal(await geocodeImportRow(parsed()[0].input!, async () => Response.json({ latitude: 400, longitude: 'oops' }), pause), null);
});
test('importe uniquement les lignes valides, puis ne les réimporte pas', async () => {
  let writes = 0;
  const dependencies = { geocode: async () => result, save: async (inputs: unknown[]) => { writes++; assert.equal(inputs.length, 1); assert.equal('approximate' in (inputs[0] as object), false); }, pause };
  const first = await importFijRows([...parsed(), { line: 3, name: 'Invalide', errors: ['Adresse manquante'] }], dependencies);
  assert.equal(first.count, 1); assert.equal(first.rows[0].imported, true);
  const second = await importFijRows(first.rows, dependencies);
  assert.equal(second.count, 0); assert.equal(writes, 1);
});
test('une erreur de sauvegarde ne marque aucune ligne importée', async () => {
  const rows = parsed();
  await assert.rejects(importFijRows(rows, { geocode: async () => result, save: async () => { throw Error('database'); }, pause }), /database/);
  assert.equal(rows[0].imported, undefined);
});
test('continue après un échec de géocodage et permet sa reprise seule', async () => {
  let calls = 0;
  const rows = [...parsed(), { ...parsed()[0], line: 3 }];
  const first = await importFijRows(rows, { geocode: async () => { if (++calls === 1) throw Error('offline'); return result; }, save: async () => {}, pause });
  assert.equal(first.count, 1); assert.ok(first.rows[0].geocodeError);
  calls = 0;
  const retry = await importFijRows(first.rows, { geocode: async () => { calls++; return result; }, save: async () => {}, pause });
  assert.equal(calls, 1); assert.equal(retry.count, 1); assert.equal(retry.rows[0].geocodeError, undefined);
});
