import * as XLSX from 'xlsx';
import { FIJ_CATEGORIES, type FijInput } from '../types/fij';
import { CANADIAN_PROVINCES } from '../data/canadaLocations';

export type ImportInput = Omit<FijInput, 'latitude' | 'longitude'>;
export type ImportRow = { line: number; name: string; input?: ImportInput; errors: string[]; approximate?: boolean; geocodeError?: string; imported?: boolean };
const normalize = (value: unknown) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

export function parseFijWorkbook(data: ArrayBuffer): ImportRow[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  if (!sheet) throw new Error('Le fichier ne contient aucune feuille.');
  const source = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: true });
  const headers = (source[0] ?? []).map(normalize);
  if (!headers.length) throw new Error('La première feuille est vide.');
  const value = (row: unknown[], names: string[]) => String(row[headers.findIndex(key => names.includes(key))] ?? '').trim();
  return source.slice(1).flatMap((row, index): ImportRow[] => {
    if (row.every(cell => !String(cell ?? '').trim())) return [];
    const name = value(row, ['nom', 'name']);
    const category = FIJ_CATEGORIES.find(item => normalize(item) === normalize(value(row, ['categorie', 'category'])));
    const address = value(row, ['adresse', 'address']);
    const city = value(row, ['ville', 'city']);
    const rawProvince = value(row, ['province']);
    const province = CANADIAN_PROVINCES.find(item => [normalize(item.code), normalize(item.name)].includes(normalize(rawProvince)))?.code ?? rawProvince;
    const postalCode = value(row, ['codepostal', 'postalcode', 'postal']).toUpperCase();
    const country = value(row, ['pays', 'country']) || 'Canada';
    const phone = value(row, ['telephone', 'phone']);
    const unitNumber = value(row, ['appartement', 'local', 'unitnumber']);
    const errors = [!name && 'Nom manquant', !address && 'Adresse manquante', !city && 'Ville manquante', !province && 'Province manquante', !postalCode && 'Code postal manquant', !category && 'Catégorie invalide (Jeunes ou Jeunes Ados)'].filter(Boolean) as string[];
    return [{ line: index + 2, name, errors, input: errors.length || !category ? undefined : { name, category, address, city, province, postalCode, country, phone: phone || undefined, unitNumber: unitNumber || undefined, status: 'open' } }];
  });
}

export async function geocodeImportRow(input: ImportInput, request: typeof fetch = fetch, pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))) {
  const attempts = [
    `${input.address}, ${input.city}, ${input.province} ${input.postalCode}, ${input.country}`,
    `${input.address}, ${input.city}, ${input.province}, ${input.country}`,
    `${input.city}, ${input.province}, ${input.country}`,
  ];
  for (let index = 0; index < attempts.length; index++) {
    try {
      const response = await request('/api/geocoding', { method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: attempts[index], countryCode: normalize(input.country) === 'canada' ? 'ca' : undefined }) });
      if (response.ok) {
        const result = await response.json();
        if (typeof result.latitude === 'number' && Number.isFinite(result.latitude) && Math.abs(result.latitude) <= 90 && typeof result.longitude === 'number' && Number.isFinite(result.longitude) && Math.abs(result.longitude) <= 180) {
          return { ...input, latitude: result.latitude, longitude: result.longitude, approximate: index === 2 };
        }
      }
    } catch { /* Une erreur réseau est réessayée comme une adresse introuvable. */ }
    if (index < attempts.length - 1) await pause(1000);
  }
  return null;
}

export async function importFijRows(rows: ImportRow[], dependencies: {
  geocode: (input: ImportInput) => Promise<(FijInput & { approximate: boolean }) | null>;
  save: (inputs: FijInput[]) => Promise<void>;
  progress?: (current: number, total: number) => void;
  pause?: () => Promise<unknown>;
}) {
  const next = rows.map(row => ({ ...row }));
  const valid = next.filter(row => row.input && !row.imported);
  const ready: FijInput[] = [];
  const completed: ImportRow[] = [];
  for (const [index, row] of valid.entries()) {
    dependencies.progress?.(index + 1, valid.length);
    row.geocodeError = undefined;
    try {
      const result = await dependencies.geocode(row.input!);
      if (result) {
        const { approximate, ...input } = result;
        ready.push(input); completed.push(row); row.approximate = approximate;
      } else row.geocodeError = 'Position introuvable. Vérifiez l’adresse avant de réessayer.';
    } catch { row.geocodeError = 'Service indisponible. Réessayez plus tard.'; }
    if (index < valid.length - 1) await (dependencies.pause?.() ?? new Promise(resolve => setTimeout(resolve, 1000)));
  }
  // Une seule écriture ; une ligne ne devient importée qu'après confirmation.
  if (ready.length) await dependencies.save(ready);
  completed.forEach(row => { row.imported = true; });
  return { rows: next, count: ready.length };
}
