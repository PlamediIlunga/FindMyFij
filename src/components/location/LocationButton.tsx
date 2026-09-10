'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import styles from './LocationButton.module.scss';

interface LocationButtonProps {
  onLocated: (position: { latitude: number; longitude: number }) => void;
  /** 'default' : bouton pleine largeur (sidebar desktop / feuille étendue).
   *  'fab' : rond flottant posé sur la carte (pile de contrôles mobile). */
  variant?: 'default' | 'fab';
}

export function LocationButton({ onLocated, variant = 'default' }: LocationButtonProps) {
  const { isLocating, error, locate } = useGeolocation();

  async function handleClick() {
    const position = await locate();
    if (position) onLocated(position);
  }

  if (variant === 'fab') {
    return (
      <>
        <button
          type="button"
          className={styles.fab}
          onClick={handleClick}
          disabled={isLocating}
          aria-label="Utiliser ma position"
        >
          {isLocating ? (
            <span className={styles.spinner} aria-hidden />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 3v3M12 18v3M3 12h3M18 12h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        {error && <p className={styles.fabError}>{error}</p>}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        disabled={isLocating}
      >
        📍 {isLocating ? 'Localisation en cours…' : 'Utiliser ma position'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
