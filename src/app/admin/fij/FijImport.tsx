'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseFijWorkbook, geocodeImportRow, importFijRows, type ImportRow } from '@/lib/fijImport';
import { createManyFijAction } from './actions';
import styles from './FijImport.module.scss';

export function FijImport() {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);

  async function parse(file: File) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setRows([]); setError(''); setProgress('Lecture du fichier…'); setFileName(file.name);
    try {
      if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Sélectionnez un fichier Excel au format .xlsx.');
      const parsed = parseFijWorkbook(await file.arrayBuffer());
      setRows(parsed);
      setProgress(parsed.length ? 'Vérifiez l’aperçu avant de lancer l’importation.' : 'Aucune ligne à importer dans cette feuille.');
    } catch (err) {
      setProgress('');
      setError(err instanceof Error ? err.message : 'Ce fichier Excel ne peut pas être lu.');
    } finally { lock.current = false; setBusy(false); }
  }

  async function runImport() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await importFijRows(rows, {
        geocode: input => geocodeImportRow(input),
        save: createManyFijAction,
        progress: (current, total) => setProgress(`Localisation des adresses : ${current} sur ${total}…`),
      });
      setRows(result.rows);
      setProgress(`${result.count} FIJ importée(s). ${result.rows.some(row => row.geocodeError) ? 'Certaines adresses restent à vérifier.' : 'La carte et la liste sont à jour.'}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible. Veuillez réessayer.');
      setProgress('');
    } finally { lock.current = false; setBusy(false); }
  }

  const validCount = rows.filter(row => row.input && !row.imported).length;
  return <section className={styles.importer} aria-busy={busy}>
    <div className={styles.heading}><span className={styles.fileIcon} aria-hidden>↥</span><div><h2>Votre réseau, en un fichier.</h2><p>Importez vos FIJ depuis la première feuille d’un classeur Excel (.xlsx).</p></div></div>
    <div className={styles.instructions}><strong>Préparer votre fichier</strong><p>Première ligne : nom, catégorie, adresse, ville, province, code postal. Les colonnes pays, téléphone et appartement/local sont facultatives.</p><p>Catégories : Jeunes ou Jeunes Ados. Vérifiez les adresses pour obtenir une position précise.</p></div>
    <div className={styles.fileRow}>
      <input id="excel-file" className={styles.fileInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event => { const file = event.target.files?.[0]; if (file) void parse(file); event.target.value = ''; }} disabled={busy} />
      <label className={styles.fileButton} htmlFor="excel-file">Choisir un fichier Excel</label>
      <span className={styles.fileName}>{fileName || 'Aucun fichier sélectionné'}</span>
    </div>
    <p className={styles.summary} role="status" aria-live="polite">{progress}</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {rows.length > 0 && <>
      <p>{validCount} ligne(s) prête(s) à importer sur {rows.length}.</p>
      <div className={styles.preview} tabIndex={0} role="region" aria-label="Aperçu des lignes Excel"><table><thead><tr><th>Ligne</th><th>FIJ</th><th>État</th></tr></thead><tbody>{rows.map(row => <tr key={row.line} className={row.errors.length || row.geocodeError ? styles.invalid : ''}><td>{row.line}</td><td>{row.name || '—'}</td><td>{row.imported ? (row.approximate ? 'Importée · position approximative à vérifier' : 'Importée') : row.errors.join(', ') || row.geocodeError || 'Prête'}</td></tr>)}</tbody></table></div>
      <button type="button" className={styles.importButton} onClick={runImport} disabled={busy || validCount === 0}>{busy ? 'Importation en cours…' : validCount ? `Importer ${validCount} ligne(s)` : 'Importation terminée'}</button>
    </>}
  </section>;
}
