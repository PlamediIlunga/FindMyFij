'use client';

import type { Fij } from '@/types/fij';
import { CATEGORY_COLORS } from '@/types/fij';
import { buildGoogleMapsDirectionsUrl } from '@/lib/maps/directions';
import { formatDistance } from '@/lib/geo/distance';
import styles from './FijMiniCard.module.scss';

interface FijMiniCardProps {
  fij: Fij;
  distanceMeters?: number;
  onViewDetails: (fij: Fij) => void;
  onClose: () => void;
}

/**
 * Fiche compacte affichée en tête de la feuille mobile lorsqu'une FIJ est
 * sélectionnée sur la carte — équivalent de la "place card" de Google Maps.
 * Donne accès aux deux actions clés (itinéraire, détails) sans devoir
 * ouvrir un panneau supplémentaire.
 */
export function FijMiniCard({ fij, distanceMeters, onViewDetails, onClose }: FijMiniCardProps) {
  const directionsUrl = buildGoogleMapsDirectionsUrl(fij);

  return (
    <div className={styles.card}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer la fiche">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.top}>
        <span className={styles.dot} style={{ background: CATEGORY_COLORS[fij.category] }} />
        <div className={styles.info}>
          <p className={styles.name}>{fij.name}</p>
          <p className={styles.meta}>
            {fij.category} · {fij.city}
            {distanceMeters !== undefined ? ` · ${formatDistance(distanceMeters)}` : ''}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <a
          className={styles.primary}
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 11l18-8-8 18-2-8-8-2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          Itinéraire
        </a>
        <button type="button" className={styles.secondary} onClick={() => onViewDetails(fij)}>
          Détails
        </button>
      </div>
    </div>
  );
}
