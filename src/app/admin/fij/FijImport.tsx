'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FIJ_CATEGORIES, type FijCategory, type FijInput } from '@/types/fij';
import { createManyFijAction } from './actions';
import styles from './FijImport.module.scss';

type ParsedRow = { line: number; input?: Omit<FijInput, 'latitude' | 'longitude'>; errors: string[]; approximate?: boolean; geocodeError?: string };
const header = (value: unknown) => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
const value = (row: Record<string, unknown>, names: string[]) => {
  const key = Object.keys(row).find((candidate) => names.includes(header(candidate)));
  return key ? String(row[key] ?? '').trim() : '';
};

export function FijImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]); const [progress, setProgress] = useState(''); const [importing, setImporting] = useState(false); const [fileName, setFileName] = useState('');
  async function parse(file: File) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
    if (!sheet) { setRows([]); setProgress('Le fichier ne contient aucune feuille.'); return; }
    const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    setRows(source.map((row, index) => {
      const name = value(row, ['nom', 'name']); const category = value(row, ['categorie', 'category']); const address = value(row, ['adresse', 'address']); const city = value(row, ['ville', 'city']); const province = value(row, ['province']); const postalCode = value(row, ['codepostal', 'postalcode', 'postal']); const country = value(row, ['pays', 'country']) || 'Canada'; const phone = value(row, ['telephone', 'phone']); const unitNumber = value(row, ['appartement', 'local', 'unitnumber']);
      const errors = [!name && 'Nom manquant', !address && 'Adresse manquante', !city && 'Ville manquante', !province && 'Province manquante', !postalCode && 'Code postal manquant', !FIJ_CATEGORIES.includes(category as FijCategory) && 'Catégorie invalide (Jeunes ou Jeunes Ados)'].filter(Boolean) as string[];
      return { line: index + 2, errors, input: errors.length ? undefined : { name, category: category as FijCategory, address, city, province, postalCode, country, phone: phone || undefined, unitNumber: unitNumber || undefined, status: 'open' } };
    })); setProgress('Aperçu prêt : seules les lignes valides seront importées.');
  }
  async function geocode(input: Omit<FijInput, 'latitude' | 'longitude'>) {
    const attempts = [[`${input.address}, ${input.city}, ${input.province} ${input.postalCode}`, false], [`${input.address}, ${input.city}, ${input.province}`, false], [`${input.city}, ${input.province}, ${input.country}`, true]] as const;
    for (let index = 0; index < attempts.length; index += 1) { const [address, approximate] = attempts[index]!; const response = await fetch('/api/geocoding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, countryCode: input.country.toLowerCase() === 'canada' ? 'ca' : undefined }) }); if (response.ok) { const result = await response.json() as { latitude: number; longitude: number }; return { ...input, latitude: result.latitude, longitude: result.longitude, approximate }; } if (index < attempts.length - 1) await new Promise<void>((resolve) => window.setTimeout(resolve, 1000)); }
    return null;
  }
  async function runImport() {
    setImporting(true); const ready: FijInput[] = []; const next = [...rows]; const valid = rows.filter((row) => row.input);
    for (let index = 0; index < valid.length; index += 1) { const row = valid[index]!; setProgress(`Géocodage ${index + 1}/${valid.length} — limite Nominatim : 1 requête/seconde`); const result = await geocode(row.input!); const target = next.find((item) => item.line === row.line)!; if (result) { ready.push(result); target.approximate = result.approximate; } else target.geocodeError = 'Position introuvable, même approximativement.'; if (index < valid.length - 1) await new Promise<void>((resolve) => window.setTimeout(resolve, 1000)); }
    try { if (ready.length) await createManyFijAction(ready); setRows(next); setProgress(`${ready.length} FIJ importée(s). Les échecs restent signalés ci-dessous.`); } catch (error) { setProgress(error instanceof Error ? error.message : 'Import impossible.'); } finally { setImporting(false); }
  }
  const validCount = rows.filter((row) => row.input && !row.geocodeError).length;
  return <section className={styles.importer}><div><h2>Importer un fichier Excel</h2><p>Colonnes attendues : nom, catégorie, adresse, ville, province, code postal; pays, téléphone et appartement/local sont facultatifs.</p></div><div className={styles.fileRow}><input id="excel-file" className={styles.fileInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFileName(file.name); parse(file); } }} disabled={importing} /><label className={styles.fileButton} htmlFor="excel-file">Choisir un fichier</label><span className={styles.fileName}>{fileName || 'Aucun fichier sélectionné'}</span></div>{rows.length > 0 && <><p className={styles.summary}>{validCount} ligne(s) valide(s) sur {rows.length}. {progress}</p><div className={styles.preview}><table><thead><tr><th>Ligne</th><th>FIJ</th><th>État</th></tr></thead><tbody>{rows.map((row) => <tr key={row.line} className={row.errors.length || row.geocodeError ? styles.invalid : ''}><td>{row.line}</td><td>{row.input?.name ?? '—'}</td><td>{row.errors.join(', ') || row.geocodeError || (row.approximate ? 'Position approximative' : 'Prête')}</td></tr>)}</tbody></table></div><button type="button" className={styles.importButton} onClick={runImport} disabled={importing || validCount === 0}>{importing ? progress : `Importer ${validCount} ligne(s) valide(s)`}</button></>}</section>;
}
