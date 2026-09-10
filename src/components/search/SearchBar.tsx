'use client';

import { useMemo, useState } from 'react';
import type { Fij, GeocodeResult } from '@/types/fij';
import { CATEGORY_COLORS } from '@/types/fij';
import { normalizeText } from '@/lib/normalizeText';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  fijList: Fij[];
  onSelectFij: (fij: Fij) => void;
  onAddressGeocoded: (result: GeocodeResult, label: string) => void;
}

function fijMatches(fij: Fij, query: string): boolean {
  const haystack = normalizeText(
    `${fij.name} ${fij.address} ${fij.city} ${fij.postalCode}`
  );
  return haystack.includes(query);
}

export function SearchBar({ fijList, onSelectFij, onAddressGeocoded }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const normalizedQuery = normalizeText(query);

  const matches = useMemo(() => {
    if (!normalizedQuery) return [];
    return fijList.filter((fij) => fijMatches(fij, normalizedQuery)).slice(0, 8);
  }, [fijList, normalizedQuery]);

  const showDropdown = isFocused && query.trim().length > 0;

  async function handleGeocodeSearch() {
    const address = query.trim();
    if (!address) return;
    setIsGeocoding(true);
    setGeocodeError(null);
    try {
      const response = await fetch('/api/geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, countryCode: 'ca' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGeocodeError(data.error ?? 'Adresse introuvable.');
        return;
      }
      onAddressGeocoded(data as GeocodeResult, address);
      setIsFocused(false);
    } catch {
      setGeocodeError('Impossible de contacter le service de géocodage.');
    } finally {
      setIsGeocoding(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <svg className={styles.icon} width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className={styles.input}
          type="text"
          placeholder="Rechercher un FIJ, une ville, une adresse…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && matches.length === 0) {
              handleGeocodeSearch();
            }
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            aria-label="Effacer la recherche"
            onClick={() => setQuery('')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className={styles.results}>
          {matches.map((fij) => (
            <button
              key={fij.id}
              type="button"
              className={styles.resultItem}
              // On sélectionne dès le mousedown (avant le blur/focus-loss de
              // l'input) plutôt qu'au click : ça évite toute course avec le
              // setTimeout de fermeture du dropdown et garantit que le clic
              // déclenche bien le recentrage de la carte, y compris sur les
              // écrans tactiles où le timing click/blur est moins fiable.
              onMouseDown={(event) => {
                event.preventDefault();
                onSelectFij(fij);
                setQuery(fij.name);
                setIsFocused(false);
              }}
            >
              <span
                className={styles.resultDot}
                style={{ background: CATEGORY_COLORS[fij.category] }}
              />
              <span className={styles.resultText}>
                <span className={styles.resultName}>{fij.name}</span>
                <br />
                <span className={styles.resultMeta}>
                  {fij.address}, {fij.city}
                </span>
              </span>
            </button>
          ))}

          {matches.length === 0 && (
            <p className={styles.emptyState}>Aucune FIJ ne correspond à &laquo;&nbsp;{query}&nbsp;&raquo;.</p>
          )}

          <button
            type="button"
            className={styles.geocodeItem}
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleGeocodeSearch}
            disabled={isGeocoding}
          >
            📍 {isGeocoding ? 'Recherche en cours…' : `Rechercher l'adresse « ${query} »`}
          </button>

          {geocodeError && <p className={styles.emptyState}>{geocodeError}</p>}
        </div>
      )}
    </div>
  );
}
